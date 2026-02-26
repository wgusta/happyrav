"""FastAPI app for happyRAV document-first multi-phase generation."""
from __future__ import annotations

from dotenv import load_dotenv
load_dotenv()

import os
import hashlib
import base64
import io
import time
import uuid
from datetime import date
from typing import Dict, List, Optional

from fastapi import Body, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image

from happyrav.models import (
    ArtifactRecord,
    BasicProfile,
    ComparisonSection,
    CoverLetterRequest,
    CVData,
    DocTag,
    ExtractedProfile,
    GenerateRequest,
    MonsterArtifactRecord,
    PreSeedRequest,
    QualityMetrics,
    SessionAnswerRequest,
    SessionIntakeRequest,
    SessionStartRequest,
    SessionState,
    ThemeConfig,
)
from happyrav.services.cache import ArtifactCache, MonsterCache, SessionCache, SessionRecord
from happyrav.services.emailer import send_application_email
from happyrav.services.extract_documents import (
    DOC_TAGS,
    MAX_FILE_BYTES,
    MAX_SESSION_BYTES,
    MAX_SESSION_DOCS,
    build_document_meta,
    extract_profile_fragment,
    extract_text_from_bytes,
    guess_doc_tag,
    is_supported_filename,
    merge_profiles,
)
from happyrav.services.llm_kimi import (
    extract_monster_timeline,
    extract_profile_from_documents,
    generate_content,
    refine_content,
    has_api_key,
    QUALITY_MODE,
)
from happyrav.services.llm_matching import summarize_job_ad
from happyrav.services.parsing import parse_hex_color, parse_language
from happyrav.services.pdf_render import render_pdf
from happyrav.services.question_engine import (
    apply_answers_to_profile,
    apply_answers_to_state,
    build_missing_questions,
    unresolved_required_ids,
)
from happyrav.services.scoring import compute_match, extract_job_keywords
from happyrav.services.cv_quality import validate_cv_quality
from happyrav.services.templating import (
    build_cv_text,
    build_filenames,
    render_builder_cv_html,
    render_cover_html,
    render_cover_markdown,
    render_cv_html,
    render_monster_cv_html,
    sanitize_filename,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_PATH = (os.getenv("HAPPYRAV_PREFIX") or "").strip()
WIZARD_TOTAL_STEPS = 6
WIZARD_PROGRESS = {
    "start": {"percent": 0, "index": 1},
    "upload": {"percent": 20, "index": 2},
    "questions": {"percent": 40, "index": 3},
    "review": {"percent": 60, "index": 4},
    "result": {"percent": 80, "index": 5},
    "cover": {"percent": 100, "index": 6},
}
PHOTO_MAX_BYTES = 5 * 1024 * 1024
PHOTO_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
SIGNATURE_MAX_BYTES = 5 * 1024 * 1024
SIGNATURE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}
REVIEW_RECOMMEND_THRESHOLD = 70  # Match score threshold for "ready" vs "improve" recommendation

DE_MONTHS = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
]


def _format_cover_date(location: str, language: str) -> str:
    today = date.today()
    if language == "de":
        return f"{location}, {today.day}. {DE_MONTHS[today.month - 1]} {today.year}"
    return f"{location}, {today.day} {today.strftime('%B')} {today.year}"


def _template_alias(value: str) -> str:
    template_id = (value or "").strip().lower()
    if template_id in {"ats_clean", "ats_modern"}:
        return "simple"
    if template_id in {"simple", "friendly", "sophisticated"}:
        return template_id
    return "simple"


def _asset_version() -> str:
    paths = [
        os.path.join(BASE_DIR, "static", "app.js"),
        os.path.join(BASE_DIR, "static", "style.css"),
    ]
    mtimes = []
    for path in paths:
        try:
            mtimes.append(os.path.getmtime(path))
        except OSError:
            continue
    return str(int(max(mtimes) if mtimes else time.time()))


ASSET_VERSION = _asset_version()

app = FastAPI(title="happyRAV", root_path=ROOT_PATH)
templates = Jinja2Templates(directory=os.path.join(BASE_DIR, "templates"))
app.mount("/static", StaticFiles(directory=os.path.join(BASE_DIR, "static")), name="static")

artifact_cache = ArtifactCache(ttl_seconds=int(os.getenv("HAPPYRAV_ARTIFACT_TTL", "3600")))
session_cache = SessionCache(ttl_seconds=int(os.getenv("HAPPYRAV_SESSION_TTL", "7200")))
from happyrav.services.cache import DocumentCache
document_cache = DocumentCache()
monster_cache = MonsterCache(ttl_seconds=7200)


def _require_session(session_id: str) -> SessionRecord:
    record = session_cache.touch(session_id)
    if not record:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    return record


def _profile_confidence(profile: ExtractedProfile) -> Dict[str, float]:
    output: Dict[str, float] = {}
    for field, sources in profile.source_map.items():
        if not sources:
            continue
        output[field] = round(max(source.confidence for source in sources), 3)
    return output


def _profile_to_basic(profile: ExtractedProfile) -> BasicProfile:
    return BasicProfile(
        full_name=profile.full_name,
        headline=profile.headline or profile.summary[:120],
        email=profile.email,
        phone=profile.phone,
        location=profile.location,
        linkedin=profile.linkedin,
        portfolio=profile.portfolio,
        photo_data_url=profile.photo_data_url,
    )


def _skill_str(s) -> str:
    """Convert a SkillEntry or string to display string."""
    if isinstance(s, str):
        return s
    if hasattr(s, "name"):
        return f"{s.name} ({s.level})" if s.level else s.name
    return str(s)


def _lang_str(l) -> str:
    """Convert a LanguageEntry or string to display string."""
    if isinstance(l, str):
        return l
    if hasattr(l, "language"):
        return f"{l.language} ({l.level})" if l.level else l.language
    return str(l)


def _profile_text_for_score(profile: ExtractedProfile) -> str:
    chunks: List[str] = [
        profile.full_name,
        profile.headline,
        profile.summary,
        profile.email,
        profile.phone,
        profile.location,
        profile.linkedin,
        profile.portfolio,
    ]
    chunks.extend(profile.skills_str)
    chunks.extend(profile.languages_str)
    chunks.extend(profile.achievements)
    for entry in profile.experience:
        chunks.extend([entry.role, entry.company, entry.period, *entry.achievements])
    for item in profile.education:
        chunks.extend([item.degree, item.school, item.period])
    return "\n".join(chunk for chunk in chunks if chunk)


def _refresh_state(record: SessionRecord) -> SessionRecord:
    state = record.state
    merged = ExtractedProfile()
    for document in state.documents:
        text = record.document_texts.get(document.doc_id, "")
        fragment = extract_profile_fragment(
            text=text,
            doc_id=document.doc_id,
            confidence=document.confidence,
        )
        merged = merge_profiles(merged, fragment)

    if record.llm_profile:
        merged = merge_profiles(merged, record.llm_profile)
    if record.preseed_profile:
        merged = merge_profiles(merged, record.preseed_profile)
    if record.photo_data_url:
        merged.photo_data_url = record.photo_data_url

    initial_questions = build_missing_questions(state, merged)
    state = apply_answers_to_state(state, initial_questions, state.answers)
    merged = apply_answers_to_profile(merged, initial_questions, state.answers)
    questions = build_missing_questions(state, merged)

    state.extracted_profile = merged
    state.questions = questions
    unresolved = unresolved_required_ids(questions)
    state.ready_to_generate = len(unresolved) == 0
    state.extraction_warning = record.llm_warning or ""
    state.extraction_debug = dict(record.llm_debug or {})

    if state.ready_to_generate:
        state.phase = "review"
    elif state.documents or record.preseed_profile:
        state.phase = "questions"
    elif state.consent_confirmed and state.job_ad_text.strip():
        state.phase = "upload"
    else:
        state.phase = "start"

    record.state = state
    return record


def _review_match_payload(state: SessionState) -> Optional[Dict]:
    if not state.job_ad_text.strip():
        return None
    cv_text = _profile_text_for_score(state.extracted_profile)
    if state.telos_context:
        telos_lines = [f"{k}: {v}" for k, v in state.telos_context.items() if v]
        cv_text += "\n\n# Career Goals & Values\n" + "\n".join(telos_lines)
    if not cv_text.strip():
        return None
    try:
        match = compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language)
        match.job_summary = state.job_summary
        return match.model_dump()
    except Exception:
        return None


def _generation_match_context(state: SessionState) -> Optional[Dict]:
    payload = _review_match_payload(state)
    if not payload:
        return None
    return {
        "overall_score": payload.get("overall_score", 0.0),
        "matched_keywords": list(payload.get("matched_keywords", []))[:40],
        "missing_keywords": list(payload.get("missing_keywords", []))[:40],
        "job_summary": payload.get("job_summary", "") or state.job_summary,
    }


def _extraction_signature(record: SessionRecord) -> str:
    hasher = hashlib.sha256()
    hasher.update(record.state.language.encode("utf-8"))
    for document in sorted(record.state.documents, key=lambda item: item.doc_id):
        hasher.update(document.doc_id.encode("utf-8"))
        hasher.update(document.tag.encode("utf-8"))
        text = record.document_texts.get(document.doc_id, "")
        hasher.update(str(len(text)).encode("utf-8"))
        hasher.update(text[:2000].encode("utf-8", errors="ignore"))
    return hasher.hexdigest()


async def _enrich_profile_with_openai(record: SessionRecord) -> SessionRecord:
    signature = _extraction_signature(record)
    if signature == record.extraction_signature:
        return record
    record.extraction_signature = signature
    source_documents = [record.document_texts.get(doc.doc_id, "") for doc in record.state.documents]
    source_documents = [text for text in source_documents if text and text.strip()]
    profile, warning, debug = await extract_profile_from_documents(record.state.language, source_documents)
    record.llm_profile = profile
    record.llm_warning = warning or ""
    record.llm_debug = debug or {}
    return record


def _has_profile_data(profile: ExtractedProfile) -> bool:
    return bool(
        profile.full_name or profile.experience or profile.education
        or profile.skills or profile.summary
    )


def _recommended_step(state: SessionState) -> str:
    unresolved = unresolved_required_ids(state.questions)
    if state.ready_to_generate and not unresolved:
        return "review"
    if state.documents or _has_profile_data(state.extracted_profile):
        return "questions"
    if state.consent_confirmed and state.job_ad_text.strip():
        return "upload"
    return "start"


def _state_payload(state: SessionState) -> Dict:
    review_match = _review_match_payload(state)
    return {
        "session_id": state.session_id,
        "phase": state.phase,
        "language": state.language,
        "company_name": state.company_name,
        "position_title": state.position_title,
        "job_ad_text": state.job_ad_text,
        "consent_confirmed": state.consent_confirmed,
        "documents": [document.model_dump() for document in state.documents],
        "profile": state.extracted_profile.model_dump(),
        "profile_confidence": _profile_confidence(state.extracted_profile),
        "questions": [question.model_dump() for question in state.questions],
        "answers": state.answers,
        "unresolved_required_question_ids": unresolved_required_ids(state.questions),
        "ready_to_generate": state.ready_to_generate,
        "template_id": _template_alias(state.template_id),
        "theme": state.theme.model_dump(),
        "extraction_warning": state.extraction_warning,
        "extraction_debug": state.extraction_debug,
        "review_match": review_match,
        "expires_at": state.expires_at,
        "recommended_step": _recommended_step(state),
        "api_key_configured": has_api_key(),
    }


def _wizard_context(
    request: Request,
    *,
    page_key: str,
    content_template: str,
    page_title: Optional[str] = None,
    record: Optional[ArtifactRecord] = None,
) -> Dict:
    progress = WIZARD_PROGRESS.get(page_key, WIZARD_PROGRESS["start"])
    return {
        "request": request,
        "asset_version": ASSET_VERSION,
        "default_primary": "#1F5AA8",
        "default_accent": "#173A73",
        "page_key": page_key,
        "page_title": page_title or "happyRAV · Multi-phase CV + Cover Letter",
        "content_template": content_template,
        "progress_percent": progress["percent"],
        "progress_step_index": progress["index"],
        "progress_total_steps": WIZARD_TOTAL_STEPS,
        "record": record,
    }


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok", "service": "happyrav"}


# ── CV Builder (stateless) ──


@app.get("/builder", response_class=HTMLResponse)
async def page_builder(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "asset_version": ASSET_VERSION,
            "default_primary": "#1F5AA8",
            "default_accent": "#173A73",
            "page_key": "builder",
            "page_title": "happyRAV · CV Builder",
            "content_template": "_page_builder.html",
            "progress_percent": 0,
            "progress_step_index": 0,
            "progress_total_steps": 0,
            "record": None,
        },
    )


@app.post("/api/builder/render")
async def api_builder_render(cv_data: CVData) -> Dict:
    html = render_builder_cv_html(cv_data)
    safe_name = sanitize_filename(cv_data.full_name) or "CV"
    filename = f"CV_{safe_name}.html"
    return {"html": html, "filename": filename}


@app.post("/api/builder/markdown")
async def api_builder_markdown(cv_data: CVData) -> Dict:
    md = _cv_data_to_markdown(cv_data)
    safe_name = sanitize_filename(cv_data.full_name) or "CV"
    filename = f"CV_{safe_name}.md"
    return {"markdown": md, "filename": filename}


def _cv_data_to_markdown(cv: CVData) -> str:
    """Convert CVData to structured Markdown for LLM consumption."""
    lines: List[str] = []
    lines.append(f"# {cv.full_name}")
    if cv.headline:
        lines.append(f"**{cv.headline}**")
    lines.append("")

    # Contact
    contact_parts: List[str] = []
    if cv.address:
        contact_parts.append(cv.address)
    if cv.email:
        contact_parts.append(cv.email)
    if cv.phone:
        contact_parts.append(cv.phone)
    if cv.linkedin:
        contact_parts.append(cv.linkedin)
    if cv.portfolio:
        contact_parts.append(cv.portfolio)
    if cv.github:
        contact_parts.append(cv.github)
    if cv.birthdate:
        contact_parts.append(f"Born: {cv.birthdate}")
    if contact_parts:
        lines.append("## Contact")
        for part in contact_parts:
            lines.append(f"- {part}")
        lines.append("")

    # Summary
    if cv.summary:
        lines.append("## Summary")
        lines.append(cv.summary)
        lines.append("")

    # KPIs
    if cv.kpis:
        lines.append("## Key Figures")
        for kpi in cv.kpis:
            lines.append(f"- **{kpi.value}** {kpi.label}")
        lines.append("")

    # Skills
    if cv.skills:
        lines.append("## Skills")
        for skill in cv.skills:
            parts = [skill.name]
            if skill.level:
                parts.append(f"({skill.level})")
            if skill.category:
                parts.append(f"[{skill.category}]")
            line = " ".join(parts)
            if skill.description:
                line += f": {skill.description}"
            lines.append(f"- {line}")
        lines.append("")

    # Languages
    if cv.languages:
        lines.append("## Languages")
        for lang in cv.languages:
            line = lang.language
            if lang.proficiency:
                line += f" ({lang.proficiency})"
            lines.append(f"- {line}")
        lines.append("")

    # Experience
    if cv.experience:
        lines.append("## Experience")
        for exp in cv.experience:
            title = exp.role
            if exp.company:
                title += f" | {exp.company}"
            if exp.location:
                title += f" | {exp.location}"
            lines.append(f"### {title}")
            if exp.period:
                lines.append(f"*{exp.period}*")
            if exp.achievements:
                for a in exp.achievements:
                    lines.append(f"- {a}")
            lines.append("")

    # Education
    if cv.education:
        lines.append("## Education")
        for edu in cv.education:
            title = edu.degree
            if edu.school:
                title += f" | {edu.school}"
            lines.append(f"### {title}")
            if edu.period:
                lines.append(f"*{edu.period}*")
            if edu.description:
                lines.append(edu.description)
            lines.append("")

    # Certifications
    if cv.certifications:
        lines.append("## Certifications")
        for cert in cv.certifications:
            line = cert.name
            if cert.issuer:
                line += f", {cert.issuer}"
            if cert.date:
                line += f" ({cert.date})"
            lines.append(f"- {line}")
        lines.append("")

    # Military
    if cv.military:
        lines.append("## Military")
        for mil in cv.military:
            line = mil.rank
            if mil.period:
                line += f" ({mil.period})"
            lines.append(f"### {line}")
            if mil.description:
                lines.append(mil.description)
            lines.append("")

    # Projects
    if cv.projects:
        lines.append("## Projects")
        for proj in cv.projects:
            lines.append(f"### {proj.name}")
            if proj.description:
                lines.append(proj.description)
            if proj.url:
                lines.append(proj.url)
            lines.append("")

    # References
    if cv.references:
        lines.append("## References")
        for ref in cv.references:
            if ref.quote:
                lines.append(f"> \"{ref.quote}\"")
            parts = []
            if ref.name:
                parts.append(ref.name)
            if ref.title:
                parts.append(ref.title)
            if ref.contact:
                parts.append(ref.contact)
            if parts:
                lines.append(f"> — {', '.join(parts)}")
            lines.append("")
    if cv.references_on_request:
        if not cv.references:
            lines.append("## References")
        lines.append("*Available on request*")
        lines.append("")

    return "\n".join(lines)


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="start",
            content_template="_page_start.html",
        ),
    )


@app.get("/start", response_class=HTMLResponse)
async def page_start(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="start",
            content_template="_page_start.html",
        ),
    )


@app.get("/upload", response_class=HTMLResponse)
async def page_upload(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="upload",
            content_template="_page_upload.html",
        ),
    )


@app.get("/questions", response_class=HTMLResponse)
async def page_questions(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="questions",
            content_template="_page_questions.html",
        ),
    )


@app.get("/review", response_class=HTMLResponse)
async def page_review(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="review",
            content_template="_page_review.html",
        ),
    )


@app.get("/cover", response_class=HTMLResponse, name="page_cover")
async def page_cover(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(request, page_key="cover", content_template="_page_cover.html", page_title="happyRAV · Cover Letter"),
    )


@app.get("/result-page", response_class=HTMLResponse, name="page_result_wizard")
async def page_result_wizard(request: Request) -> HTMLResponse:
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(request, page_key="result", content_template="_page_result.html", page_title="happyRAV · Result"),
    )


@app.post("/api/session/start")
async def api_session_start(payload: SessionStartRequest) -> Dict:
    session_id = session_cache.create_session_id()
    now = time.time()
    state = SessionState(
        session_id=session_id,
        phase="start",
        language=parse_language(payload.language),
        company_name=payload.company_name.strip(),
        position_title=payload.position_title.strip(),
        job_ad_text=payload.job_ad_text.strip(),
        consent_confirmed=payload.consent_confirmed,
        created_at=now,
        expires_at=now + session_cache.ttl_seconds,
    )
    record = SessionRecord(state=state)
    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {"session_id": session_id, "expires_at": record.state.expires_at, "state": _state_payload(record.state)}


@app.post("/api/session/{session_id}/intake")
async def api_session_intake(session_id: str, payload: SessionIntakeRequest) -> Dict:
    record = _require_session(session_id)
    record.state.company_name = payload.company_name.strip()
    record.state.position_title = payload.position_title.strip()
    record.state.job_ad_text = payload.job_ad_text.strip()
    record.state.consent_confirmed = payload.consent_confirmed
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/upload")
async def api_session_upload(
    session_id: str,
    files: List[UploadFile] = File(...),
    tags: Optional[List[str]] = Form(None),
) -> Dict:
    record = _require_session(session_id)
    state = record.state

    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded.")
    if len(state.documents) + len(files) > MAX_SESSION_DOCS:
        raise HTTPException(status_code=400, detail=f"Session limit exceeded: max {MAX_SESSION_DOCS} documents.")

    uploaded = []
    total_bytes = sum(document.size_bytes for document in state.documents)

    for idx, upload in enumerate(files):
        filename = (upload.filename or f"document_{idx + 1}").strip()
        if not is_supported_filename(filename):
            raise HTTPException(
                status_code=415,
                detail="Unsupported file type. Allowed: pdf, docx, png, jpg, jpeg, webp.",
            )

        content = await upload.read()
        size_bytes = len(content)
        if size_bytes == 0:
            raise HTTPException(status_code=400, detail=f"Empty file: {filename}")
        if size_bytes > MAX_FILE_BYTES:
            raise HTTPException(status_code=413, detail=f"File too large (max {MAX_FILE_BYTES // (1024 * 1024)} MB).")
        if total_bytes + size_bytes > MAX_SESSION_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Session size exceeded (max {MAX_SESSION_BYTES // (1024 * 1024)} MB total).",
            )

        content_hash = hashlib.md5(content).hexdigest()
        cached = document_cache.get(content_hash)
        if cached:
            text = cached.get("text", "")
            parse_method = cached.get("parse_method", "cached")
            confidence = cached.get("confidence", 0.9)
        else:
            try:
                text, parse_method, confidence = extract_text_from_bytes(filename=filename, content=content)
                document_cache.set(content_hash, {
                    "text": text,
                    "parse_method": parse_method,
                    "confidence": confidence,
                    "size_bytes": size_bytes,
                })
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Could not parse {filename}: {exc}") from exc

        provided_tag = tags[idx] if tags and idx < len(tags) else None
        doc_tag = guess_doc_tag(filename=filename, provided_tag=provided_tag)
        doc_id = uuid.uuid4().hex
        document_meta = build_document_meta(
            doc_id=doc_id,
            filename=filename,
            mime=upload.content_type or "application/octet-stream",
            tag=doc_tag,
            parse_method=parse_method,
            confidence=confidence,
            size_bytes=size_bytes,
            text=text,
        )
        state.documents.append(document_meta)
        record.document_texts[doc_id] = text
        uploaded.append(document_meta.model_dump())
        total_bytes += size_bytes

    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "uploaded": uploaded,
        "documents_total": len(state.documents),
        "bytes_total": total_bytes,
        "expires_at": state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/paste")
async def api_session_paste(
    session_id: str,
    payload: Dict[str, str] = Body(...),
) -> Dict:
    record = _require_session(session_id)
    state = record.state
    text = (payload.get("text") or "").strip()
    tag = payload.get("tag") or "cv"
    if tag not in ("cv", "cover_letter", "arbeitszeugnis", "certificate", "other"):
        tag = "cv"
    if not text:
        raise HTTPException(status_code=400, detail="No text provided.")
    if len(state.documents) >= MAX_SESSION_DOCS:
        raise HTTPException(status_code=400, detail=f"Session limit exceeded: max {MAX_SESSION_DOCS} documents.")
    doc_id = uuid.uuid4().hex
    size_bytes = len(text.encode("utf-8"))
    document_meta = build_document_meta(
        doc_id=doc_id,
        filename="pasted_text.txt",
        mime="text/plain",
        tag=tag,
        parse_method="plain_text",
        confidence=0.85,
        size_bytes=size_bytes,
        text=text,
    )
    state.documents.append(document_meta)
    record.document_texts[doc_id] = text
    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "uploaded": [document_meta.model_dump()],
        "documents_total": len(state.documents),
        "expires_at": state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/photo")
async def api_session_photo(
    session_id: str,
    file: UploadFile = File(...),
) -> Dict:
    record = _require_session(session_id)
    filename = (file.filename or "photo").strip().lower()
    extension = os.path.splitext(filename)[1]
    if extension not in PHOTO_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported photo type. Allowed: png, jpg, jpeg, webp.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty photo upload.")
    if len(content) > PHOTO_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"Photo too large (max {PHOTO_MAX_BYTES // (1024 * 1024)} MB).")
    try:
        image = Image.open(io.BytesIO(content))
        image = image.convert("RGB")
        image.thumbnail((640, 640))
        out = io.BytesIO()
        image.save(out, format="JPEG", quality=88)
        encoded = base64.b64encode(out.getvalue()).decode("ascii")
        record.photo_data_url = f"data:image/jpeg;base64,{encoded}"
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not parse image: {exc}") from exc

    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/extract")
async def api_session_extract(
    session_id: str,
    payload: Optional[Dict[str, Dict[str, DocTag]]] = Body(default=None),
) -> Dict:
    record = _require_session(session_id)
    state = record.state

    tag_overrides = (payload or {}).get("tag_overrides", {})
    if isinstance(tag_overrides, dict):
        for document in state.documents:
            override = tag_overrides.get(document.doc_id)
            if override in DOC_TAGS:
                document.tag = override  # type: ignore[assignment]

    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/answer")
async def api_session_answer(session_id: str, payload: SessionAnswerRequest) -> Dict:
    record = _require_session(session_id)
    for question_id, answer in payload.answers.items():
        record.state.answers[question_id] = str(answer).strip()
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.get("/api/session/{session_id}/state")
async def api_session_state(session_id: str) -> Dict:
    record = _require_session(session_id)
    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/language")
async def api_session_language(session_id: str, payload: Dict[str, str] = Body(...)) -> Dict:
    record = _require_session(session_id)
    record.state.language = parse_language(str((payload or {}).get("language", "en")))
    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


@app.post("/api/session/{session_id}/preseed")
async def api_preseed(session_id: str, req: PreSeedRequest) -> Dict:
    record = _require_session(session_id)
    if req.profile:
        existing = (record.preseed_profile or ExtractedProfile()).model_dump()
        existing.update({k: v for k, v in req.profile.items() if v})
        record.preseed_profile = ExtractedProfile(**existing)
        record.state.extracted_profile = record.preseed_profile.model_copy(deep=True)
    if req.telos:
        record.state.telos_context.update(req.telos)
    record = _refresh_state(record)
    session_cache.set(record)
    return {
        "session_id": session_id,
        "expires_at": record.state.expires_at,
        "state": _state_payload(record.state),
    }


def _validate_completeness(
    profile: ExtractedProfile,
    generated: "GeneratedContent",
) -> "GeneratedContent":
    """Append missing experience/education from profile and re-sort reverse-chronologically."""
    from happyrav.models import GeneratedContent as GC  # noqa: F811

    gen_exp_keys = {(e.role.lower().strip(), e.company.lower().strip()) for e in generated.experience}
    missing_exp = [
        e for e in profile.experience
        if (e.role.lower().strip(), e.company.lower().strip()) not in gen_exp_keys
    ]
    if missing_exp:
        generated.experience = list(generated.experience) + missing_exp

    def _period_sort_key(period: str) -> str:
        parts = period.replace("\u2013", "-").replace("\u2014", "-").split("-")
        last = parts[-1].strip().lower()
        if last in ("present", "heute", "now", "laufend", "current", ""):
            return "9999-99"
        digits = "".join(c for c in last if c.isdigit() or c == "/")
        if "/" in digits:
            segments = digits.split("/")
            if len(segments) == 2 and len(segments[1]) == 4:
                return f"{segments[1]}-{segments[0].zfill(2)}"
        return digits if digits else "0000-00"

    generated.experience = sorted(generated.experience, key=lambda e: _period_sort_key(e.period), reverse=True)

    # Enforce bullet cap: max 5 achievements per experience, min 1 if available
    for exp in generated.experience:
        if len(exp.achievements) > 5:
            exp.achievements = exp.achievements[:5]

    gen_edu_keys = {(e.degree.lower().strip(), e.school.lower().strip()) for e in generated.education}
    missing_edu = [
        e for e in profile.education
        if (e.degree.lower().strip(), e.school.lower().strip()) not in gen_edu_keys
    ]
    if missing_edu:
        generated.education = list(generated.education) + missing_edu

    generated.education = sorted(generated.education, key=lambda e: _period_sort_key(e.period), reverse=True)

    return generated


def _build_comparison_sections(
    profile: ExtractedProfile,
    generated,
) -> List[ComparisonSection]:
    sections: List[ComparisonSection] = []
    if profile.summary or generated.summary:
        sections.append(ComparisonSection(
            label_en="Summary", label_de="Kurzprofil",
            original=profile.summary or "",
            optimized=generated.summary or "",
        ))
    if profile.skills or generated.skills:
        sections.append(ComparisonSection(
            label_en="Skills", label_de="Skills",
            original=", ".join(profile.skills_str),
            optimized=", ".join(generated.skills),
        ))
    orig_exp = profile.experience or []
    gen_exp = generated.experience or []
    for i in range(max(len(orig_exp), len(gen_exp))):
        o = orig_exp[i] if i < len(orig_exp) else None
        g = gen_exp[i] if i < len(gen_exp) else None
        label_suffix = ""
        if o:
            label_suffix = f": {o.role}" if o.role else ""
        elif g:
            label_suffix = f": {g.role}" if g.role else ""
        sections.append(ComparisonSection(
            label_en=f"Experience{label_suffix}",
            label_de=f"Erfahrung{label_suffix}",
            original="\n".join(o.achievements) if o else "",
            optimized="\n".join(g.achievements) if g else "",
        ))
    orig_edu = [f"{e.degree}, {e.school}" for e in (profile.education or [])]
    gen_edu = [f"{e.degree}, {e.school}" for e in (generated.education or [])]
    orig_edu_str = "\n".join(orig_edu)
    gen_edu_str = "\n".join(gen_edu)
    if orig_edu_str != gen_edu_str:
        sections.append(ComparisonSection(
            label_en="Education", label_de="Ausbildung",
            original=orig_edu_str, optimized=gen_edu_str,
        ))
    return sections


def _count_transformations(original: ExtractedProfile, optimized) -> Dict[str, int]:
    """Count how many fields were enhanced/rewritten."""
    changes = {
        "summary_rewritten": int(original.summary != optimized.summary),
        "skills_enhanced": int(len(optimized.skills) > len(original.skills)),
        "experience_optimized": sum(1 for exp in optimized.experience if exp.achievements),
        "education_enhanced": int(len(optimized.education) > len(original.education)),
    }
    return changes


@app.post("/api/session/{session_id}/preview-match")
async def api_session_preview_match(session_id: str) -> Dict:
    """Preview ATS match score before generating PDFs."""
    record = _require_session(session_id)
    state = record.state

    if not state.job_ad_text.strip():
        raise HTTPException(status_code=422, detail="Job ad text required for match preview.")

    # Guarded job summary (LLM + baseline)
    job_summary = ""
    try:
        job_summary = await summarize_job_ad(state.job_ad_text, state.language)
    except Exception as exc:
        print(f"Job summary failed: {exc}")
        job_summary = (state.job_ad_text or "")[:400]
    state.job_summary = job_summary

    # Use extracted profile to build preview CV text
    profile = state.extracted_profile
    if not profile.full_name and not profile.experience:
        raise HTTPException(status_code=422, detail="No profile data available. Upload documents first.")

    basic_profile = _profile_to_basic(profile)

    # Build draft CV text from extracted profile (without generation)
    cv_lines = [basic_profile.full_name, basic_profile.headline, profile.summary]
    cv_lines.extend(profile.skills_str[:30])
    for item in profile.experience[:12]:
        cv_lines.extend([item.role, item.company, item.period])
        cv_lines.extend(item.achievements)
    for item in profile.education[:8]:
        cv_lines.extend([item.degree, item.school, item.period])

    cv_text = "\n".join([line for line in cv_lines if line])

    if state.telos_context:
        telos_lines = [f"{k}: {v}" for k, v in state.telos_context.items() if v]
        cv_text += "\n\n# Career Goals & Values\n" + "\n".join(telos_lines)
    job_keywords = extract_job_keywords(state.job_ad_text)

    # Compute match with hybrid approach
    from happyrav.services.llm_matching import (
        extract_semantic_keywords,
        match_skills_semantic,
        detect_contextual_gaps,
        merge_match_scores,
    )

    # 1. Fast baseline (existing parser)
    baseline_match = compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language)

    # 2. Semantic enhancement (LLM) - with error handling
    try:
        semantic_keywords = await extract_semantic_keywords(state.job_ad_text, state.language)
        semantic_match = await match_skills_semantic(
            cv_skills=profile.skills_str,
            cv_experience=[exp.model_dump() for exp in profile.experience],
            semantic_keywords=semantic_keywords
        )
        # 3. Merge scores (weighted average: 40% baseline, 60% semantic)
        match = merge_match_scores(baseline_match, semantic_match, weights={"baseline": 0.4, "semantic": 0.6})
    except Exception as e:
        # Fallback to baseline if LLM fails
        print(f"Semantic matching failed: {e}, falling back to baseline")
        match = baseline_match
        match.matching_strategy = "baseline"

    match.job_summary = job_summary

    # Compute quality metrics for preview
    from happyrav.services.cv_quality import validate_cv_quality

    try:
        quality_metrics_data = validate_cv_quality(
            cv_text=cv_text,
            generated=None,
            language=state.language
        )
        quality_metrics = QualityMetrics(**quality_metrics_data.__dict__)
        match.quality_metrics = quality_metrics
        match.quality_warnings = quality_metrics.warnings[:5]
    except Exception as e:
        print(f"Quality validation in preview failed: {e}")

    # Determine recommendation
    recommend_generate = match.overall_score >= REVIEW_RECOMMEND_THRESHOLD
    recommendation = "ready" if recommend_generate else "improve"
    suggestion = ""

    if not recommend_generate:
        suggestions = []
        if match.missing_keywords:
            suggestions.append(f"Add missing keywords: {', '.join(match.missing_keywords[:5])}")
        if match.quality_warnings:
            suggestions.append(f"Quality: {match.quality_warnings[0]}")
        if match.category_scores.get("skills_match", 0) < 50:
            suggestions.append("Add more relevant skills from job ad")
        suggestion = " | ".join(suggestions[:2])

    # Generate strategic analysis with contextual gaps if score below threshold
    strategic_analysis = None
    if not recommend_generate:
        from happyrav.services.llm_kimi import generate_strategic_analysis

        # Detect contextual gaps
        contextual_gaps = []
        try:
            contextual_gaps = await detect_contextual_gaps(
                profile=profile,
                job_ad_text=state.job_ad_text,
                language=state.language
            )
            # Add gaps to match payload
            match.contextual_gaps = contextual_gaps
        except Exception as e:
            print(f"Gap detection failed: {e}")

        strategic_analysis = await generate_strategic_analysis(
            language=state.language,
            match=match,
            profile=profile,
            job_ad_text=state.job_ad_text,
        )

    session_cache.set(record)
    return {
        "match": match.model_dump(),
        "recommendation": recommendation,
        "suggestion": suggestion,
        "score": match.overall_score,
        "matching_inputs": {
            "job_ad_chars": len(state.job_ad_text or ""),
            "cv_chars": len(cv_text or ""),
            "job_keywords_count": len(job_keywords),
        },
        "strategic_analysis": strategic_analysis,
        "preview_comparison_sections": [
            {
                "label_en": "Skills Overview",
                "label_de": "Kompetenz-Übersicht",
                "original": ", ".join(profile.skills_str[:10]) if profile.skills else "No skills listed",
                "optimized": "(Will be tailored to job requirements during generation)"
            },
            {
                "label_en": "Experience Summary",
                "label_de": "Berufserfahrung-Zusammenfassung",
                "original": f"{len(profile.experience)} positions" if profile.experience else "No experience listed",
                "optimized": "(Will be optimized with quantified achievements during generation)"
            }
        ],
    }


@app.post("/api/session/{session_id}/ask-recommendation")
async def api_session_ask_recommendation(session_id: str, payload: Dict[str, str]) -> Dict:
    """Chat endpoint for strategic recommendation questions."""
    record = _require_session(session_id)
    state = record.state
    message = payload.get("message", "").strip()

    if not message:
        raise HTTPException(status_code=422, detail="Message required")

    # Build context from server state
    strategic = state.server.get("strategic_analysis", {})
    match_data = state.server.get("review_match", {})

    # Import here to avoid circular dependency
    from happyrav.services.llm_kimi import _answer_strategic_question

    # Use Anthropic for conversational response
    response_text = await _answer_strategic_question(
        language=state.language,
        user_question=message,
        strategic_context=strategic,
        match_context=match_data,
        profile=state.extracted_profile,
        job_ad=state.job_ad_text,
    )

    # Store in chat history
    record.chat_history.append({"role": "user", "content": message})
    record.chat_history.append({"role": "assistant", "content": response_text})
    session_cache.set(record)

    return {
        "response": response_text,
        "message": response_text,
    }


@app.post("/api/session/{session_id}/generate")
async def api_session_generate(
    request: Request,
    session_id: str,
    payload: GenerateRequest,
) -> Dict:
    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="API keys not configured on server. Contact administrator to set OPENAI_API_KEY and ANTHROPIC_API_KEY environment variables.",
        )
    record = _require_session(session_id)
    state = record.state
    state.template_id = _template_alias(payload.template_id or state.template_id)
    border_style = payload.border_style if payload.border_style in ("rounded", "square", "none") else "rounded"
    font_family = payload.font_family if payload.font_family in ("inter", "roboto", "lato", "georgia", "source_sans") else "inter"
    state.theme = ThemeConfig(
        primary_hex=parse_hex_color(payload.primary_color, "#1F5AA8"),
        accent_hex=parse_hex_color(payload.accent_color, "#173A73"),
        border_style=border_style,
        box_shadow=payload.box_shadow,
        card_bg=parse_hex_color(payload.card_bg, "#ffffff"),
        page_bg=parse_hex_color(payload.page_bg, "#ffffff"),
        font_family=font_family,
    )

    record = await _enrich_profile_with_openai(record)
    record = _refresh_state(record)
    unresolved = unresolved_required_ids(record.state.questions)
    if unresolved:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Required questions unresolved.",
                "unresolved_question_ids": unresolved,
            },
        )

    state = record.state
    profile = state.extracted_profile
    basic_profile = _profile_to_basic(profile)
    match_context = _generation_match_context(state)
    generated, warning = await generate_content(
        language=state.language,
        job_ad_text=state.job_ad_text,
        profile=profile,
        source_documents=list(record.document_texts.values()),
        match_context=match_context,
        tone=payload.tone,
    )
    generated = _validate_completeness(profile, generated)

    # Build CV text for validation and scoring
    cv_text = build_cv_text(basic_profile, generated)
    if state.telos_context:
        telos_lines = [f"{k}: {v}" for k, v in state.telos_context.items() if v]
        cv_text += "\n\n# Career Goals & Values\n" + "\n".join(telos_lines)

    # Run quality validation
    quality_metrics_data = validate_cv_quality(
        cv_text=cv_text,
        generated=generated,
        language=state.language
    )
    quality_metrics = QualityMetrics(**quality_metrics_data.__dict__)

    # Run ATS scoring
    match = compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language)

    # Attach quality metrics to match
    match.quality_metrics = quality_metrics
    match.quality_warnings = quality_metrics.warnings[:5]  # Top 5 for UI
    cv_html = render_cv_html(
        template_id=state.template_id,
        language=state.language,
        profile=basic_profile,
        content=generated,
        theme=state.theme,
        match=match,
    )
    try:
        cv_pdf_bytes = render_pdf(cv_html)
    except Exception as exc:
        print(f"CV PDF render failed: {exc}")
        cv_pdf_bytes = b""

    comparison_sections = _build_comparison_sections(profile, generated)
    comparison_metadata = {
        "keywords_added": len(match.matched_keywords),
        "optimization_score": match.overall_score,
        "transformations": _count_transformations(profile, generated),
    }
    filenames = build_filenames(basic_profile.full_name or "Candidate", state.company_name or "Company")
    if payload.filename_cv.strip():
        artifact_filename_cv = payload.filename_cv.strip()
        if not artifact_filename_cv.endswith(".pdf"):
            artifact_filename_cv += ".pdf"
    else:
        artifact_filename_cv = filenames["cv"]
    token = artifact_cache.create_token()
    artifact = ArtifactRecord(
        token=token,
        filename_cv=artifact_filename_cv,
        cv_pdf_bytes=cv_pdf_bytes,
        cv_html=cv_html,
        match=match,
        warning=warning,
        expires_at=time.time() + artifact_cache.ttl_seconds,
        comparison_sections=comparison_sections,
        meta={
        "company_name": state.company_name,
        "position_title": state.position_title,
        "full_name": basic_profile.full_name,
        "session_id": session_id,
        "language": state.language,
        "pre_generation_match": match_context,
        "job_summary": state.job_summary,
        "generated_content": generated.model_dump(),
        "comparison_metadata": comparison_metadata,
    },
    )
    artifact_cache.set(artifact)
    session_cache.set(record)
    return {
        "token": token,
        "filename_cv": artifact.filename_cv,
        "match": artifact.match.model_dump(),
        "warning": artifact.warning,
        "download_cv_url": str(request.url_for("download_file", token=token, file_id="cv")),
        "cv_html": cv_html,
    }


@app.post("/api/session/{session_id}/chat")
async def api_session_chat(request: Request, session_id: str, payload: dict = Body(...)):
    if not has_api_key():
        raise HTTPException(status_code=503, detail="API keys not configured.")
    record = _require_session(session_id)
    state = record.state
    user_message = (payload.get("message") or "").strip()
    token = (payload.get("token") or "").strip()
    if not user_message:
        raise HTTPException(400, "Message required.")

    artifact = artifact_cache.get(token) if token else None
    if not artifact or not artifact.meta.get("generated_content"):
        raise HTTPException(422, "No generated CV found. Generate first.")

    from happyrav.services.llm_kimi import _coerce_generated_payload
    current_content = _coerce_generated_payload(artifact.meta["generated_content"])
    profile = state.extracted_profile

    record.chat_history.append({"role": "user", "content": user_message})

    refined, warning = await refine_content(
        language=state.language,
        user_message=user_message,
        current_content=current_content,
        profile=profile,
        job_ad_text=state.job_ad_text,
        chat_history=record.chat_history,
    )

    record.chat_history.append({"role": "assistant", "content": "Applied changes."})

    basic_profile = _profile_to_basic(profile)
    refined = _validate_completeness(profile, refined)
    cv_text = build_cv_text(basic_profile, refined)
    if state.telos_context:
        telos_lines = [f"{k}: {v}" for k, v in state.telos_context.items() if v]
        cv_text += "\n\n# Career Goals & Values\n" + "\n".join(telos_lines)
    match = compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language)
    cv_html = render_cv_html(
        template_id=state.template_id, language=state.language,
        profile=basic_profile, content=refined, theme=state.theme, match=match,
    )
    comparison_sections = _build_comparison_sections(profile, refined)
    new_token = artifact_cache.create_token()
    new_artifact = ArtifactRecord(
        token=new_token, filename_cv=artifact.filename_cv,
        cv_html=cv_html,
        cover_html=artifact.cover_html,
        filename_cover=artifact.filename_cover,
        match=match, warning=warning,
        expires_at=time.time() + artifact_cache.ttl_seconds,
        comparison_sections=comparison_sections,
        meta={**artifact.meta, "generated_content": refined.model_dump()},
    )
    artifact_cache.set(new_artifact)
    session_cache.set(record)

    return {
        "token": new_token,
        "message": "Changes applied.",
        "download_cv_url": str(request.url_for("download_file", token=new_token, file_id="cv")),
        "match": match.model_dump(),
        "warning": warning,
        "cv_html": cv_html,
    }


@app.post("/api/session/{session_id}/signature")
async def api_session_signature(
    session_id: str,
    file: UploadFile = File(...),
) -> Dict:
    record = _require_session(session_id)
    filename = (file.filename or "signature").strip().lower()
    extension = os.path.splitext(filename)[1]
    if extension not in SIGNATURE_EXTENSIONS:
        raise HTTPException(status_code=415, detail="Unsupported image type. Allowed: png, jpg, jpeg, webp.")
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(content) > SIGNATURE_MAX_BYTES:
        raise HTTPException(status_code=413, detail=f"File too large (max {SIGNATURE_MAX_BYTES // (1024 * 1024)} MB).")
    try:
        image = Image.open(io.BytesIO(content))
        image.thumbnail((400, 200))
        out = io.BytesIO()
        image.save(out, format="PNG")
        encoded = base64.b64encode(out.getvalue()).decode("ascii")
        record.signature_data_url = f"data:image/png;base64,{encoded}"
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not process image: {exc}") from exc
    session_cache.set(record)
    return {
        "session_id": session_id,
        "signature_uploaded": True,
    }


@app.post("/api/session/{session_id}/generate-cover")
async def api_session_generate_cover(
    request: Request,
    session_id: str,
    payload: CoverLetterRequest,
) -> Dict:
    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="API keys not configured on server. Contact administrator to set OPENAI_API_KEY and ANTHROPIC_API_KEY environment variables.",
        )
    record = _require_session(session_id)
    state = record.state

    if payload.sender_street.strip():
        state.sender_street = payload.sender_street.strip()
    if payload.sender_plz_ort.strip():
        state.sender_plz_ort = payload.sender_plz_ort.strip()

    profile = state.extracted_profile
    basic_profile = _profile_to_basic(profile)
    match_context = _generation_match_context(state)
    generated, warning = await generate_content(
        language=state.language,
        job_ad_text=state.job_ad_text,
        profile=profile,
        source_documents=list(record.document_texts.values()),
        match_context=match_context,
    )
    generated = _validate_completeness(profile, generated)

    if payload.cover_anrede.strip():
        generated.cover_greeting = payload.cover_anrede.strip().rstrip(",")

    cover_date = ""
    if payload.cover_date_location.strip():
        cover_date = _format_cover_date(payload.cover_date_location.strip(), state.language)

    cover_html = render_cover_html(
        template_id=state.template_id,
        language=state.language,
        profile=basic_profile,
        content=generated,
        company_name=payload.recipient_company.strip() or state.company_name or "Company",
        position_title=state.position_title or "Position",
        theme=state.theme,
        sender_street=state.sender_street,
        sender_plz_ort=state.sender_plz_ort,
        recipient_street=payload.recipient_street.strip(),
        recipient_plz_ort=payload.recipient_plz_ort.strip(),
        recipient_contact=payload.recipient_contact.strip(),
        cover_date=cover_date,
        signature_data_url=record.signature_data_url,
    )
    cover_markdown = render_cover_markdown(
        language=state.language,
        profile=basic_profile,
        content=generated,
        company_name=payload.recipient_company.strip() or state.company_name or "Company",
        position_title=state.position_title or "Position",
        sender_street=state.sender_street,
        sender_plz_ort=state.sender_plz_ort,
        recipient_street=payload.recipient_street.strip(),
        recipient_plz_ort=payload.recipient_plz_ort.strip(),
        recipient_contact=payload.recipient_contact.strip(),
        cover_date=cover_date,
    )
    try:
        cover_pdf_bytes = render_pdf(cover_html)
    except Exception as exc:
        print(f"Cover PDF render failed: {exc}")
        cover_pdf_bytes = b""

    filenames = build_filenames(basic_profile.full_name or "Candidate", state.company_name or "Company")
    if payload.filename_cover.strip():
        artifact_filename_cover = payload.filename_cover.strip()
        if not artifact_filename_cover.endswith(".pdf"):
            artifact_filename_cover += ".pdf"
    else:
        artifact_filename_cover = filenames["cover"]

    session_meta = state.session_id
    existing_tokens = [
        tok for tok, rec in artifact_cache._records.items()
        if rec.meta.get("session_id") == session_meta
    ]
    if existing_tokens:
        artifact = artifact_cache.get(existing_tokens[-1])
        if artifact:
            artifact.filename_cover = artifact_filename_cover
            artifact.cover_html = cover_html
            artifact.cover_pdf_bytes = cover_pdf_bytes
            artifact.meta.update({
                "cover_date": cover_date,
                "sender_street": state.sender_street,
                "sender_plz_ort": state.sender_plz_ort,
                "recipient_street": payload.recipient_street.strip(),
                "recipient_plz_ort": payload.recipient_plz_ort.strip(),
                "recipient_contact": payload.recipient_contact.strip(),
            })
            artifact_cache.set(artifact)
            session_cache.set(record)
            return {
                "token": artifact.token,
                "result_url": str(request.url_for("result_page", token=artifact.token)),
                "cover_html": cover_html,
                "cover_markdown": cover_markdown,
            }

    raise HTTPException(status_code=404, detail="No CV artifact found. Generate CV first.")


@app.post("/api/session/{session_id}/generate-monster")
async def api_session_generate_monster(
    request: Request,
    session_id: str,
) -> Dict:
    """Generate Monster CV: comprehensive chronological timeline extraction."""
    if not has_api_key():
        raise HTTPException(
            status_code=503,
            detail="Required API keys not configured (OPENAI_API_KEY + ANTHROPIC_API_KEY).",
        )

    record = _require_session(session_id)
    state = record.state

    if not record.document_texts:
        raise HTTPException(status_code=422, detail="No documents uploaded.")

    # Extract comprehensive timeline
    source_documents = list(record.document_texts.values())
    doc_tags = [doc.tag for doc in state.documents]

    timeline, warning = await extract_monster_timeline(
        language=state.language,
        source_documents=source_documents,
        doc_tags=doc_tags,
    )

    if not timeline or not timeline.timeline:
        raise HTTPException(
            status_code=500,
            detail=f"Monster CV extraction failed. {warning or ''}"
        )

    # Render Monster CV PDF
    profile_name = state.extracted_profile.full_name or "Career Timeline"
    monster_html = render_monster_cv_html(
        language=state.language,
        profile_name=profile_name,
        timeline=timeline,
        theme=state.theme,
    )

    try:
        monster_pdf = render_pdf(monster_html)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Monster PDF generation failed: {exc}") from exc

    # Generate filename
    safe_name = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in profile_name.strip())
    filename = f"MonsterCV_{safe_name}.pdf"

    # Store in monster cache
    token = monster_cache.create_token()
    monster_artifact = MonsterArtifactRecord(
        token=token,
        filename=filename,
        pdf_bytes=monster_pdf,
        html=monster_html,
        timeline=timeline,
        expires_at=time.time() + monster_cache.ttl_seconds,
    )
    monster_cache.set(monster_artifact)

    # Update session state
    state.monster_cv_generated = True
    session_cache.set(record)

    # Compute stats
    date_range = ""
    if timeline.timeline:
        from happyrav.services.parsing import parse_date_for_sort
        dates = []
        for entry in timeline.timeline:
            if entry.start_date:
                dates.append(parse_date_for_sort(entry.start_date))
            if entry.end_date:
                dates.append(parse_date_for_sort(entry.end_date))
        valid_dates = [d for d in dates if d > 0]
        if valid_dates:
            min_year = min(valid_dates) // 10000
            max_year = max(valid_dates) // 10000
            date_range = f"{min_year}-{max_year}" if min_year != max_year else str(min_year)

    return {
        "token": token,
        "filename": filename,
        "entry_count": len(timeline.timeline),
        "date_range": date_range,
        "warning": warning,
    }


@app.get("/download/monster/{token}")
async def download_monster(token: str) -> Response:
    """Download Monster CV PDF."""
    record = monster_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Monster CV token expired or invalid.")

    headers = {"Content-Disposition": f'attachment; filename="{record.filename}"'}
    return Response(content=record.pdf_bytes, media_type="application/pdf", headers=headers)


@app.get("/result/{token}", response_class=HTMLResponse, name="result_page")
async def result_page(request: Request, token: str) -> HTMLResponse:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Result expired or not found.")
    return templates.TemplateResponse(
        "index.html",
        _wizard_context(
            request,
            page_key="result",
            content_template="_page_result_full.html",
            page_title="happyRAV · Result",
            record=record,
        ),
    )


@app.get("/result-fragment/{token}", response_class=HTMLResponse, name="result_fragment")
async def result_fragment(request: Request, token: str) -> HTMLResponse:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Result expired or not found.")
    return templates.TemplateResponse("_result.html", {"request": request, "record": record})


@app.get("/api/result/{token}/comparison")
async def api_result_comparison(token: str) -> Dict:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Result expired or not found.")
    return {"sections": [s.model_dump() for s in record.comparison_sections]}


def _cv_html_to_markdown(record: ArtifactRecord) -> str:
    """Convert artifact to markdown using stored metadata."""
    meta = record.meta or {}
    gen = meta.get("generated_content", {})
    name = meta.get("full_name", "")
    lines = []
    if name:
        lines.append(f"# {name}")
    summary = gen.get("summary", "")
    if summary:
        lines.append(f"\n{summary}\n")
    skills = gen.get("skills", [])
    if skills:
        lines.append("## Skills")
        for s in skills:
            lines.append(f"- {s}")
        lines.append("")
    experience = gen.get("experience", [])
    if experience:
        lines.append("## Experience")
        for exp in experience:
            role = exp.get("role", "")
            company = exp.get("company", "")
            period = exp.get("period", "")
            lines.append(f"### {role} | {company} | {period}")
            for ach in exp.get("achievements", []):
                lines.append(f"- {ach}")
            lines.append("")
    education = gen.get("education", [])
    if education:
        lines.append("## Education")
        for edu in education:
            degree = edu.get("degree", "")
            school = edu.get("school", "")
            period = edu.get("period", "")
            lines.append(f"### {degree} | {school} | {period}")
            lines.append("")
    return "\n".join(lines)


def _cover_markdown(record: ArtifactRecord) -> str:
    meta = record.meta or {}
    gen = meta.get("generated_content", {})
    basic_name = meta.get("full_name", "")
    company = meta.get("company_name", "")
    position = meta.get("position_title", "")
    cover_date = meta.get("cover_date", "")
    sender_street = meta.get("sender_street", "")
    sender_plz_ort = meta.get("sender_plz_ort", "")
    recipient_street = meta.get("recipient_street", "")
    recipient_plz_ort = meta.get("recipient_plz_ort", "")
    recipient_contact = meta.get("recipient_contact", "")

    lines: List[str] = []
    if basic_name:
        lines.append(f"# Cover Letter – {basic_name}")
    if company or position:
        lines.append(f"**Role:** {position} @ {company}".strip())
    if cover_date:
        lines.append(f"**Date:** {cover_date}")
    lines.append("")

    if sender_street or sender_plz_ort:
        lines.append("**Sender**")
        if sender_street:
            lines.append(f"- {sender_street}")
        if sender_plz_ort:
            lines.append(f"- {sender_plz_ort}")
        lines.append("")

    if recipient_contact or recipient_street or recipient_plz_ort:
        lines.append("**Recipient**")
        if recipient_contact:
            lines.append(f"- {recipient_contact}")
        if recipient_street:
            lines.append(f"- {recipient_street}")
        if recipient_plz_ort:
            lines.append(f"- {recipient_plz_ort}")
        lines.append("")

    greeting = gen.get("cover_greeting", "")
    opening = gen.get("cover_opening", "")
    body = gen.get("cover_body", [])
    closing = gen.get("cover_closing", "")

    for text in [greeting, opening]:
        if text:
            lines.append(text)
            lines.append("")
    for para in body or []:
        lines.append(para)
        lines.append("")
    if closing:
        lines.append(closing)
        lines.append("")
    lines.append("_Generated with happyRAV_")
    return "\n".join(lines)


@app.get("/api/result/{token}/cv-html")
async def api_result_cv_html(token: str) -> Response:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Result expired or not found.")
    filename = record.filename_cv.replace(".pdf", ".html") if record.filename_cv.endswith(".pdf") else record.filename_cv + ".html"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=record.cv_html, media_type="text/html", headers=headers)


@app.get("/api/result/{token}/cv-markdown")
async def api_result_cv_markdown(token: str) -> Response:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Result expired or not found.")
    md = _cv_html_to_markdown(record)
    filename = record.filename_cv.replace(".pdf", ".md") if record.filename_cv.endswith(".pdf") else record.filename_cv + ".md"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=md, media_type="text/markdown", headers=headers)


@app.get("/api/result/{token}/cover-html")
async def api_result_cover_html(token: str) -> Response:
    record = artifact_cache.get(token)
    if not record or not record.cover_html:
        raise HTTPException(status_code=404, detail="Cover letter not found.")
    filename = record.filename_cover.replace(".pdf", ".html") if record.filename_cover.endswith(".pdf") else (record.filename_cover or "cover") + ".html"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=record.cover_html, media_type="text/html", headers=headers)


@app.get("/api/result/{token}/cover-markdown")
async def api_result_cover_markdown(token: str) -> Response:
    record = artifact_cache.get(token)
    if not record or not record.cover_html:
        raise HTTPException(status_code=404, detail="Cover letter not found.")
    md = _cover_markdown(record)
    filename = record.filename_cover.replace(".pdf", ".md") if record.filename_cover.endswith(".pdf") else (record.filename_cover or "cover") + ".md"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=md, media_type="text/markdown", headers=headers)


@app.get("/download/{token}/{file_id}")
async def download_file(token: str, file_id: str) -> Response:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="File token expired or invalid.")

    if file_id == "cv":
        data = record.cv_pdf_bytes
        filename = record.filename_cv
        if not data:
            raise HTTPException(status_code=404, detail="CV PDF not available. Use HTML/Markdown download.")
    elif file_id == "cover":
        data = record.cover_pdf_bytes
        filename = record.filename_cover
        if not data:
            raise HTTPException(status_code=404, detail="Cover letter PDF not available.")
    else:
        raise HTTPException(status_code=400, detail="Invalid file id.")

    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}
    return Response(content=data, media_type="application/pdf", headers=headers)


@app.post("/email", response_class=HTMLResponse)
async def send_email(
    token: str = Form(...),
    recipient_email: str = Form(...),
) -> HTMLResponse:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="Token expired. Generate again.")

    recipient_email = recipient_email.strip()
    if "@" not in recipient_email:
        raise HTTPException(status_code=400, detail="Invalid email address.")

    company_name = str(record.meta.get("company_name", "company"))
    position_title = str(record.meta.get("position_title", "position"))
    is_de = str(record.meta.get("language", "en")) == "de"
    subject = (
        f"Ihre happyRAV Unterlagen: {position_title} bei {company_name}"
        if is_de
        else f"Your happyRAV files: {position_title} at {company_name}"
    )
    body = (
        "Anbei: passgenauer CV und Anschreiben als PDF aus happyRAV."
        if is_de
        else "Attached: tailored CV and cover letter PDFs generated by happyRAV."
    )

    try:
        send_application_email(
            recipient_email=recipient_email,
            subject=subject,
            body_text=body,
            cv_filename=record.filename_cv,
            cv_bytes=record.cv_pdf_bytes,
            cover_filename=record.filename_cover,
            cover_bytes=record.cover_pdf_bytes,
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Email send failed: {exc}") from exc

    return HTMLResponse(
        '<div class="alert success">E-Mail mit CV + Anschreiben gesendet.</div>'
        if is_de
        else '<div class="alert success">Email sent with CV and cover letter attached.</div>'
    )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("happyrav.main:app", host="0.0.0.0", port=8010, reload=True)
