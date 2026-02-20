"""FastAPI app for happyRAV document-first multi-phase generation."""
from __future__ import annotations

import os
import hashlib
import base64
import io
import time
import uuid
from typing import Dict, List, Optional

from fastapi import Body, FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from PIL import Image

from happyrav.models import (
    ArtifactRecord,
    BasicProfile,
    DocTag,
    ExtractedProfile,
    GenerateRequest,
    SessionAnswerRequest,
    SessionIntakeRequest,
    SessionStartRequest,
    SessionState,
    ThemeConfig,
)
from happyrav.services.cache import ArtifactCache, SessionCache, SessionRecord
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
from happyrav.services.llm_kimi import extract_profile_from_documents, generate_content
from happyrav.services.parsing import parse_hex_color, parse_language
from happyrav.services.pdf_render import render_pdf
from happyrav.services.question_engine import (
    apply_answers_to_profile,
    apply_answers_to_state,
    build_missing_questions,
    unresolved_required_ids,
)
from happyrav.services.scoring import compute_match
from happyrav.services.templating import (
    build_cv_text,
    build_filenames,
    render_cover_html,
    render_cv_html,
)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_PATH = (os.getenv("HAPPYRAV_PREFIX") or "").strip()
WIZARD_TOTAL_STEPS = 5
WIZARD_PROGRESS = {
    "start": {"percent": 0, "index": 1},
    "upload": {"percent": 25, "index": 2},
    "questions": {"percent": 50, "index": 3},
    "review": {"percent": 75, "index": 4},
    "result": {"percent": 100, "index": 5},
}
PHOTO_MAX_BYTES = 5 * 1024 * 1024
PHOTO_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp"}


def _template_alias(value: str) -> str:
    template_id = (value or "").strip().lower()
    if template_id in {"ats_clean", "ats_modern"}:
        return "simple"
    if template_id in {"simple", "sophisticated", "friendly"}:
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

artifact_cache = ArtifactCache(ttl_seconds=int(os.getenv("HAPPYRAV_CACHE_TTL", "600")))
session_cache = SessionCache(ttl_seconds=int(os.getenv("HAPPYRAV_SESSION_TTL", "7200")))


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
    chunks.extend(profile.skills)
    chunks.extend(profile.languages)
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
    elif state.documents:
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
    if not cv_text.strip():
        return None
    try:
        return compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language).model_dump()
    except Exception:
        return None


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


def _recommended_step(state: SessionState) -> str:
    unresolved = unresolved_required_ids(state.questions)
    if state.ready_to_generate and not unresolved:
        return "review"
    if state.documents:
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

        try:
            text, parse_method, confidence = extract_text_from_bytes(filename=filename, content=content)
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


@app.delete("/api/session/{session_id}")
async def api_session_clear(session_id: str) -> Dict[str, str]:
    session_cache.delete(session_id)
    return {"status": "cleared"}


@app.post("/api/session/{session_id}/generate")
async def api_session_generate(
    request: Request,
    session_id: str,
    payload: GenerateRequest,
) -> Dict:
    record = _require_session(session_id)
    state = record.state
    state.template_id = _template_alias(payload.template_id or state.template_id)
    state.theme = ThemeConfig(
        primary_hex=parse_hex_color(payload.primary_color, "#1F5AA8"),
        accent_hex=parse_hex_color(payload.accent_color, "#173A73"),
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
    generated, warning = await generate_content(
        language=state.language,
        job_ad_text=state.job_ad_text,
        profile=profile,
        source_documents=list(record.document_texts.values()),
    )

    cv_text = build_cv_text(basic_profile, generated)
    match = compute_match(cv_text=cv_text, job_ad_text=state.job_ad_text, language=state.language)
    cv_html = render_cv_html(
        template_id=state.template_id,
        language=state.language,
        profile=basic_profile,
        content=generated,
        theme=state.theme,
        match=match,
    )
    cover_html = render_cover_html(
        template_id=state.template_id,
        language=state.language,
        profile=basic_profile,
        content=generated,
        company_name=state.company_name or "Company",
        position_title=state.position_title or "Position",
        theme=state.theme,
    )

    try:
        cv_pdf = render_pdf(cv_html)
        cover_pdf = render_pdf(cover_html)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}") from exc
    filenames = build_filenames(basic_profile.full_name or "Candidate", state.company_name or "Company")
    token = artifact_cache.create_token()
    artifact = ArtifactRecord(
        token=token,
        filename_cv=filenames["cv"],
        filename_cover=filenames["cover"],
        cv_pdf_bytes=cv_pdf,
        cover_pdf_bytes=cover_pdf,
        cv_html=cv_html,
        cover_html=cover_html,
        match=match,
        warning=warning,
        expires_at=time.time() + artifact_cache.ttl_seconds,
        meta={
            "company_name": state.company_name,
            "position_title": state.position_title,
            "full_name": basic_profile.full_name,
            "session_id": session_id,
            "language": state.language,
        },
    )
    artifact_cache.set(artifact)
    session_cache.set(record)
    return {
        "token": token,
        "filename_cv": artifact.filename_cv,
        "filename_cover": artifact.filename_cover,
        "match": artifact.match.model_dump(),
        "warning": artifact.warning,
        "result_url": str(request.url_for("result_page", token=token)),
        "result_fragment_url": str(request.url_for("result_fragment", token=token)),
        "download_cv_url": str(request.url_for("download_file", token=token, file_id="cv")),
        "download_cover_url": str(request.url_for("download_file", token=token, file_id="cover")),
    }


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


@app.get("/download/{token}/{file_id}")
async def download_file(token: str, file_id: str) -> Response:
    record = artifact_cache.get(token)
    if not record:
        raise HTTPException(status_code=404, detail="File token expired or invalid.")

    if file_id == "cv":
        data = record.cv_pdf_bytes
        filename = record.filename_cv
    elif file_id == "cover":
        data = record.cover_pdf_bytes
        filename = record.filename_cover
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
