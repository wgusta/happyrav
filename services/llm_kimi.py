"""OpenAI integration for happyRAV extraction and generation."""
from __future__ import annotations

import asyncio
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI

from happyrav.models import EducationItem, ExperienceItem, ExtractedProfile, GeneratedContent
from happyrav.services.parsing import split_keywords


DEFAULT_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
TRUE_VALUES = {"1", "true", "yes", "on"}


def _strip_code_fences(text: str) -> str:
    text = (text or "").strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


def _extract_json_payload(text: str) -> Dict[str, Any]:
    clean = _strip_code_fences(text)
    return json.loads(clean)


def has_api_key() -> bool:
    """Check if an OpenAI API key or Codex OAuth token is available."""
    if (os.getenv("OPENAI_API_KEY") or "").strip():
        return True
    if _load_codex_oauth_token():
        return True
    return False


def _build_client() -> OpenAI:
    api_key = (os.getenv("OPENAI_API_KEY") or "").strip()
    if not api_key:
        api_key = _load_codex_oauth_token()
    if not api_key:
        raise ValueError("OPENAI_API_KEY missing and no Codex OAuth token available.")
    base_url = (os.getenv("OPENAI_BASE_URL") or "").strip()
    if base_url:
        return OpenAI(api_key=api_key, base_url=base_url)
    return OpenAI(api_key=api_key)


def _load_codex_oauth_token() -> str:
    explicit = (os.getenv("OPENAI_OAUTH_ACCESS_TOKEN") or "").strip()
    if explicit:
        return explicit
    use_codex_oauth = (os.getenv("OPENAI_USE_CODEX_OAUTH", "true") or "").strip().lower() in TRUE_VALUES
    if not use_codex_oauth:
        return ""
    auth_path = (os.getenv("CODEX_AUTH_JSON") or "").strip() or str(Path.home() / ".codex" / "auth.json")
    path = Path(auth_path)
    if not path.exists():
        return ""
    try:
        payload = json.loads(path.read_text())
    except Exception:
        return ""
    return str((payload.get("tokens") or {}).get("access_token") or "").strip()


def _safe_list(items: Any) -> List[str]:
    if not isinstance(items, list):
        return []
    cleaned: List[str] = []
    for item in items:
        value = str(item).strip()
        if value:
            cleaned.append(value)
    return cleaned


def _coerce_experience(items: Any) -> List[ExperienceItem]:
    output: List[ExperienceItem] = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role", "")).strip()
        if not role:
            continue
        output.append(
            ExperienceItem(
                role=role,
                company=str(item.get("company", "")).strip(),
                period=str(item.get("period", "")).strip(),
                achievements=_safe_list(item.get("achievements", [])),
            )
        )
    return output[:14]


def _coerce_education(items: Any) -> List[EducationItem]:
    output: List[EducationItem] = []
    for item in items if isinstance(items, list) else []:
        if not isinstance(item, dict):
            continue
        degree = str(item.get("degree", "")).strip()
        if not degree:
            continue
        output.append(
            EducationItem(
                degree=degree,
                school=str(item.get("school", "")).strip(),
                period=str(item.get("period", "")).strip(),
            )
        )
    return output[:10]


def _coerce_generated_payload(payload: Dict[str, Any]) -> GeneratedContent:
    return GeneratedContent(
        summary=str(payload.get("summary", "")).strip(),
        skills=_safe_list(payload.get("skills", []))[:30],
        experience=_coerce_experience(payload.get("experience", [])),
        education=_coerce_education(payload.get("education", [])),
        cover_greeting=str(payload.get("cover_greeting", "")).strip(),
        cover_opening=str(payload.get("cover_opening", "")).strip(),
        cover_body=_safe_list(payload.get("cover_body", []))[:5],
        cover_closing=str(payload.get("cover_closing", "")).strip(),
        matched_keywords=_safe_list(payload.get("matched_keywords", []))[:30],
    )


def _merge_generated_with_profile(content: GeneratedContent, profile: ExtractedProfile, language: str) -> GeneratedContent:
    merged = content.model_copy(deep=True)
    if not merged.summary:
        merged.summary = profile.summary or (
            "Kurzprofil basierend auf den bereitgestellten Unterlagen." if language == "de"
            else "Profile summary based on provided documents."
        )
    if not merged.skills:
        merged.skills = profile.skills[:25]
    if not merged.experience:
        merged.experience = profile.experience[:12]
    if not merged.education:
        merged.education = profile.education[:8]
    if not merged.cover_greeting:
        merged.cover_greeting = "Sehr geehrte Damen und Herren," if language == "de" else "Dear Hiring Team,"
    if not merged.cover_opening:
        merged.cover_opening = (
            "Ich bewerbe mich mit diesem Profil auf die ausgeschriebene Position."
            if language == "de"
            else "I am applying for this role with the profile attached."
        )
    if not merged.cover_body:
        merged.cover_body = [
            "Meine Erfahrungen und Skills entsprechen den genannten Anforderungen."
            if language == "de"
            else "My documented experience and skills align with the posted requirements."
        ]
    if not merged.cover_closing:
        merged.cover_closing = (
            "Ich freue mich auf ein persönliches Gespräch."
            if language == "de"
            else "I look forward to discussing the role."
        )
    return merged


def _coerce_profile_payload(payload: Dict[str, Any]) -> ExtractedProfile:
    return ExtractedProfile(
        full_name=str(payload.get("full_name", "")).strip(),
        headline=str(payload.get("headline", "")).strip(),
        email=str(payload.get("email", "")).strip(),
        phone=str(payload.get("phone", "")).strip(),
        location=str(payload.get("location", "")).strip(),
        linkedin=str(payload.get("linkedin", "")).strip(),
        portfolio=str(payload.get("portfolio", "")).strip(),
        summary=str(payload.get("summary", "")).strip(),
        skills=_safe_list(payload.get("skills", []))[:35],
        languages=_safe_list(payload.get("languages", []))[:10],
        achievements=_safe_list(payload.get("achievements", []))[:35],
        experience=_coerce_experience(payload.get("experience", [])),
        education=_coerce_education(payload.get("education", [])),
    )


def _fallback_content(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
) -> GeneratedContent:
    hard_kw, _ = split_keywords(job_ad_text)
    skills = profile.skills[:20]
    matched = [kw for kw in hard_kw if any(kw in skill.lower() for skill in skills)]
    headline = profile.headline or profile.summary[:80] or "Role"

    if language == "de":
        summary = (
            f"{profile.full_name or 'Kandidat:in'} bringt relevante Erfahrung, klare Struktur und verlässliche Lieferung."
        )
        greeting = "Sehr geehrte Damen und Herren,"
        opening = (
            f"hiermit bewerbe ich mich für {headline}. "
            "Meine dokumentierten Erfahrungen passen gut zu den Anforderungen."
        )
        body = [
            "Ich arbeite strukturiert, kommuniziere klar und liefere belastbare Resultate.",
            "Die Unterlagen wurden auf ATS-Lesbarkeit und Rollenfit ausgerichtet.",
        ]
        closing = "Ich freue mich auf ein Gespräch und danke für Ihre Zeit."
    else:
        summary = f"{profile.full_name or 'Candidate'} brings relevant experience, structure, and reliable delivery."
        greeting = "Dear Hiring Team,"
        opening = (
            f"I am applying for {headline}. "
            "My documented experience aligns with your posted requirements."
        )
        body = [
            "I work with clear structure, communication discipline, and measurable delivery.",
            "The documents are tailored for ATS readability and role fit.",
        ]
        closing = "I look forward to discussing the role and appreciate your time."

    return GeneratedContent(
        summary=summary,
        skills=skills,
        experience=profile.experience[:10],
        education=profile.education[:8],
        cover_greeting=greeting,
        cover_opening=opening,
        cover_body=body,
        cover_closing=closing,
        matched_keywords=matched[:20],
    )


def _chat_json(prompt: str, max_tokens: int) -> Dict[str, Any]:
    client = _build_client()
    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        temperature=0.1,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": "Return valid JSON only. No markdown. No comments."},
            {"role": "user", "content": prompt},
        ],
    )
    text = response.choices[0].message.content or ""
    return _extract_json_payload(text)


def _profile_extract_prompt(language: str, source_documents: List[str]) -> str:
    schema = {
        "full_name": "string",
        "headline": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "linkedin": "string",
        "portfolio": "string",
        "summary": "string",
        "skills": ["string"],
        "languages": ["string"],
        "achievements": ["string"],
        "experience": [{"role": "string", "company": "string", "period": "string", "achievements": ["string"]}],
        "education": [{"degree": "string", "school": "string", "period": "string"}],
    }
    source_blob = "\n\n--- DOCUMENT ---\n\n".join(source_documents)[:28000]
    guard = (
        "Extract structured CV facts from the provided documents. "
        "Use only explicit facts from input. Do not infer employers, dates, degrees, locations, or contacts. "
        "If a field is unknown return empty string/list. "
        "Return concise normalized values."
    )
    return (
        f"{guard}\n"
        f"Preferred language: {language}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n"
        f"Input documents:\n{json.dumps(source_blob, ensure_ascii=True)}"
    )


def _generate_prompt(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
    source_documents: Optional[List[str]],
) -> str:
    schema = {
        "summary": "string",
        "skills": ["string"],
        "experience": [{"role": "string", "company": "string", "period": "string", "achievements": ["string"]}],
        "education": [{"degree": "string", "school": "string", "period": "string"}],
        "cover_greeting": "string",
        "cover_opening": "string",
        "cover_body": ["string", "string"],
        "cover_closing": "string",
        "matched_keywords": ["string"],
    }
    source_blob = "\n\n".join((source_documents or [])[:5])[:22000]
    input_payload = {
        "language": language,
        "job_ad_text": job_ad_text,
        "profile_confirmed": profile.model_dump(),
        "source_documents_excerpt": source_blob,
    }
    guard = (
        "You are a CV and cover-letter assistant. Use only factual inputs. "
        "Never invent employers, degrees, periods, or certifications. "
        "If data is missing or uncertain, omit it."
    )
    if language == "de":
        guard = (
            "Du bist ein CV/Anschreiben-Assistent. Nutze nur vorhandene Fakten. "
            "Erfinde niemals Arbeitgeber, Abschlüsse, Zeiträume oder Zertifikate. "
            "Wenn Daten fehlen oder unsicher sind, lasse sie weg."
        )
    return (
        f"{guard}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n"
        f"Input data:\n{json.dumps(input_payload, ensure_ascii=True)}"
    )


def _extract_profile_sync(
    language: str,
    source_documents: List[str],
) -> Tuple[Optional[ExtractedProfile], Optional[str], Dict[str, Any]]:
    if not source_documents:
        return None, None, {"model_used": None, "source_chars": 0, "source_docs": 0}
    prompt = _profile_extract_prompt(language=language, source_documents=source_documents)
    try:
        payload = _chat_json(prompt=prompt, max_tokens=2600)
        profile = _coerce_profile_payload(payload)
        debug = {
            "model_used": DEFAULT_MODEL,
            "source_chars": sum(len(chunk) for chunk in source_documents),
            "source_docs": len(source_documents),
            "experience_count": len(profile.experience),
            "skills_count": len(profile.skills),
        }
        return profile, None, debug
    except Exception as exc:
        prefix = "OpenAI-Extraktion Fallback" if language == "de" else "OpenAI extraction fallback used"
        return None, f"{prefix}: {exc}", {
            "model_used": DEFAULT_MODEL,
            "source_chars": sum(len(chunk) for chunk in source_documents),
            "source_docs": len(source_documents),
        }


def _generate_sync(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
    source_documents: Optional[List[str]],
) -> Tuple[GeneratedContent, Optional[str]]:
    prompt = _generate_prompt(
        language=language,
        job_ad_text=job_ad_text,
        profile=profile,
        source_documents=source_documents,
    )
    try:
        payload = _chat_json(prompt=prompt, max_tokens=2600)
        generated = _coerce_generated_payload(payload)
        return _merge_generated_with_profile(generated, profile, language), None
    except Exception as exc:
        fallback = _fallback_content(language=language, job_ad_text=job_ad_text, profile=profile)
        prefix = "OpenAI-Generierung Fallback" if language == "de" else "OpenAI generation fallback used"
        return fallback, f"{prefix}: {exc}"


async def extract_profile_from_documents(
    language: str,
    source_documents: List[str],
) -> Tuple[Optional[ExtractedProfile], Optional[str], Dict[str, Any]]:
    return await asyncio.to_thread(_extract_profile_sync, language, source_documents)


async def generate_content(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
    source_documents: Optional[List[str]] = None,
) -> Tuple[GeneratedContent, Optional[str]]:
    return await asyncio.to_thread(
        _generate_sync,
        language,
        job_ad_text,
        profile,
        source_documents,
    )
