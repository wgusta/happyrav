"""Multi-provider LLM integration for happyRAV extraction and generation."""
from __future__ import annotations

import asyncio
import base64
import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from openai import OpenAI

from happyrav.models import (
    ChronologicalEntry,
    EducationItem,
    ExperienceItem,
    ExtractedProfile,
    GeneratedContent,
    MonsterCVProfile,
)
from happyrav.services.parsing import split_keywords


QUALITY_MODE = os.getenv("HAPPYRAV_QUALITY", "balanced").strip().lower()
if QUALITY_MODE not in ("balanced", "max"):
    QUALITY_MODE = "balanced"

MODELS = {
    "balanced": {"ocr": "gpt-5-mini", "extraction": "gpt-4.1-mini", "generation": "claude-sonnet-4-6", "crosscheck": None},
    "max": {"ocr": "gpt-5-mini", "extraction": "gpt-5.2", "generation": "claude-opus-4-5", "crosscheck": "gemini-3.1-pro"},
}
CFG = MODELS[QUALITY_MODE]

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
    """Check if required API keys are available."""
    has_openai = bool((os.getenv("OPENAI_API_KEY") or "").strip() or _load_codex_oauth_token())
    has_anthropic = bool((os.getenv("ANTHROPIC_API_KEY") or "").strip())
    if not (has_openai and has_anthropic):
        return False
    if QUALITY_MODE == "max" and not (os.getenv("GOOGLE_API_KEY") or "").strip():
        return False
    return True


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


def _build_anthropic_client():
    from anthropic import Anthropic
    key = (os.getenv("ANTHROPIC_API_KEY") or "").strip()
    if not key:
        raise ValueError("ANTHROPIC_API_KEY not set")
    return Anthropic(api_key=key)


def _build_google_client():
    import google.generativeai as genai
    key = (os.getenv("GOOGLE_API_KEY") or "").strip()
    if not key:
        raise ValueError("GOOGLE_API_KEY not set")
    genai.configure(api_key=key)
    return genai


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
    return output[:50]


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
    return output[:30]


def _coerce_generated_payload(payload: Dict[str, Any]) -> GeneratedContent:
    return GeneratedContent(
        summary=str(payload.get("summary", "")).strip(),
        skills=_safe_list(payload.get("skills", []))[:50],
        experience=_coerce_experience(payload.get("experience", [])),
        education=_coerce_education(payload.get("education", [])),
        cover_greeting=str(payload.get("cover_greeting", "")).strip().rstrip(","),
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
        merged.skills = profile.skills_str[:25]
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
    skills = profile.skills_str[:20]
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


def _chat_json_openai(prompt: str, max_tokens: int, model: str = None) -> Dict[str, Any]:
    client = _build_client()
    response = client.chat.completions.create(
        model=model or CFG["extraction"],
        temperature=0.1,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": "Return valid JSON only. No markdown. No comments."},
            {"role": "user", "content": prompt},
        ],
    )
    text = response.choices[0].message.content or ""
    return _extract_json_payload(text)


def _chat_json_anthropic(model: str, system: str, user: str, max_tokens: int) -> Dict[str, Any]:
    client = _build_anthropic_client()
    resp = client.messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return _extract_json_payload(resp.content[0].text or "")


def _chat_json_google(model: str, system: str, user: str) -> Dict[str, Any]:
    client = _build_google_client()
    m = client.GenerativeModel(model, system_instruction=system)
    return _extract_json_payload(m.generate_content(user).text or "")


def vision_ocr(image_bytes: bytes, mime_type: str = "image/png") -> str:
    """Extract text from a document image using GPT vision."""
    client = _build_client()
    b64 = base64.b64encode(image_bytes).decode("ascii")
    resp = client.chat.completions.create(
        model=CFG["ocr"],
        max_tokens=4000,
        messages=[
            {"role": "system", "content": "Extract all text from this document image. Raw text only, preserve structure."},
            {"role": "user", "content": [
                {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{b64}"}},
                {"type": "text", "text": "Extract all text."},
            ]},
        ],
    )
    return (resp.choices[0].message.content or "").strip()


def _profile_extract_prompt(language: str, source_documents: List[str]) -> Tuple[str, Optional[str]]:
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
    raw_blob = "\n\n--- DOCUMENT ---\n\n".join(source_documents)
    limit = 64000
    warning = None
    if len(raw_blob) > limit:
        raw_blob = raw_blob[:limit]
        warning = "Source documents truncated to 64k chars for extraction."

    guard = (
        "Extract structured CV facts from the provided documents. "
        "Use only explicit facts from input. Do not infer employers, dates, degrees, locations, or contacts. "
        "If a field is unknown return empty string/list. "
        "Return concise normalized values.\n\n"
        "CRITICAL: Separate language skills from technical skills:\n"
        "- languages: ONLY spoken/written languages with levels (e.g., 'Deutsch (Muttersprache)', 'Französisch (B2)', 'English (C1)')\n"
        "- skills: Technical competencies, tools, frameworks, domain expertise (e.g., 'Python (Expert)', 'Requirements Engineering (IREB)', 'Kundenportal')\n"
        "- Never put language skills in the skills array\n"
        "- Always include proficiency levels in parentheses when available"
    )
    prompt = (
        f"{guard}\n"
        f"Preferred language: {language}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n\n"
        f"Input documents:\n<DOCUMENTS>\n{raw_blob}\n</DOCUMENTS>"
    )
    return prompt, warning


def _generate_prompt(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
    source_documents: Optional[List[str]],
    match_context: Optional[Dict[str, Any]] = None,
) -> Tuple[str, Optional[str]]:
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
    raw_blob = "\n\n".join((source_documents or [])[:10])
    limit = 48000
    warning = None
    if len(raw_blob) > limit:
        raw_blob = raw_blob[:limit]
        warning = "Source documents truncated to 48k chars for generation."

    input_payload = {
        "language": language,
        "job_ad_text": job_ad_text,
        "profile_confirmed": profile.model_dump(),
        "pre_generation_match_context": match_context or {},
    }
    # Build skill prioritization instruction
    skill_instruction = ""
    if match_context and "skill_rankings" in match_context:
        top_skills = [s.get("skill", "") for s in match_context["skill_rankings"].get("top_skills", [])[:5]]
        if top_skills:
            skill_instruction = f"\n- SKILL PRIORITIZATION: List these high-relevance skills first: {', '.join(top_skills)}"

    # Build achievement optimization instruction
    achievement_instruction = ""
    if match_context and "achievement_hints" in match_context:
        hints = match_context["achievement_hints"]
        high_rel = hints.get("high_relevance", [])
        rewrites = hints.get("rewrite_suggestions", {})
        if high_rel or rewrites:
            achievement_instruction = "\n- ACHIEVEMENT OPTIMIZATION: Prioritize high-relevance achievements. Add metrics (numbers, %, duration, team size) where missing."
            if rewrites:
                rewrite_examples = "; ".join([f"'{k[:40]}' → '{v[:40]}'" for k, v in list(rewrites.items())[:2]])
                achievement_instruction += f" Example rewrites: {rewrite_examples}"

    guard = (
        "You are a CV and cover-letter assistant. Use only factual inputs. "
        "Never invent employers, degrees, periods, or certifications. "
        "If data is missing or uncertain, omit it.\n"
        "CRITICAL RULES:\n"
        "- Include ALL job positions from the profile. Never omit, merge, or skip any role.\n"
        "- List experience in reverse chronological order (most recent first). Mandatory for Swiss CVs.\n"
        "- Preserve all original period dates exactly as provided.\n"
        "- Rewrite achievements to match job ad keywords, but never remove an experience entry.\n"
        "- BULLET RULE: Each experience entry must have 1 to 5 achievement bullets. Optimal is 3. Select the most job-relevant achievements from the input.\n"
        "- Include ALL education entries, never skip any.\n"
        "- Skills array: ONLY technical/domain skills. Languages are handled separately, never include them.\n"
        "- Format skills as 'Skill Name: contextual details, tools, certifications, experience'.\n"
        "  Examples:\n"
        "  * 'Requirements Engineering: IREB-certified, structured workshops, User Stories'\n"
        "  * 'Python: FastAPI REST APIs, async programming, PostgreSQL integration, 5+ years'\n"
        "  Use job ad keywords and CV achievements to build rich context for each skill.\n"
        "- Treat pre_generation_match_context as optimization guidance:\n"
        f"  prioritize missing keywords, keep matched keywords present, and fix ATS issues where possible.{skill_instruction}{achievement_instruction}"
    )
    if language == "de":
        # Build German skill/achievement instructions
        skill_instruction_de = ""
        if match_context and "skill_rankings" in match_context:
            top_skills = [s.get("skill", "") for s in match_context["skill_rankings"].get("top_skills", [])[:5]]
            if top_skills:
                skill_instruction_de = f"\n- SKILL PRIORISIERUNG: Diese hochrelevanten Skills zuerst auflisten: {', '.join(top_skills)}"

        achievement_instruction_de = ""
        if match_context and "achievement_hints" in match_context:
            hints = match_context["achievement_hints"]
            high_rel = hints.get("high_relevance", [])
            rewrites = hints.get("rewrite_suggestions", {})
            if high_rel or rewrites:
                achievement_instruction_de = "\n- ERFOLGS-OPTIMIERUNG: Hochrelevante Erfolge priorisieren. Metriken ergänzen (Zahlen, %, Dauer, Teamgrösse) wo fehlend."

        guard = (
            "Du bist ein CV/Anschreiben-Assistent. Nutze nur vorhandene Fakten. "
            "Erfinde niemals Arbeitgeber, Abschlüsse, Zeiträume oder Zertifikate. "
            "Wenn Daten fehlen oder unsicher sind, lasse sie weg.\n"
            "KRITISCHE REGELN:\n"
            "- Alle Berufspositionen aus dem Profil aufführen. Niemals weglassen, zusammenfassen oder überspringen.\n"
            "- Berufserfahrung in umgekehrt chronologischer Reihenfolge (neueste zuerst). Pflicht für Schweizer CVs.\n"
            "- Alle originalen Zeitangaben exakt übernehmen.\n"
            "- Erfolge auf Stelleninserat-Keywords anpassen, aber niemals einen Erfahrungseintrag entfernen.\n"
            "- BULLET REGEL: Jeder Erfahrungseintrag muss 1 bis 5 Erfolgs-Bullets haben. Optimal sind 3. Die jobrelevantesten Erfolge aus dem Input auswählen.\n"
            "- Alle Ausbildungseinträge aufführen, niemals überspringen.\n"
            "- Skills Array: NUR technische/fachliche Kompetenzen. Sprachen separat behandelt, niemals hier einbeziehen.\n"
            "- Skills im Format 'Kompetenz: Kontext, Tools, Zertifikate, Erfahrung'.\n"
            "  Beispiele:\n"
            "  * 'Requirements Engineering: IREB-zertifiziert, strukturierte Workshops, User Stories'\n"
            "  * 'Python: FastAPI APIs, async Programmierung, PostgreSQL, 5+ Jahre'\n"
            "  Nutze Stelleninserat-Keywords und CV-Erfolge für reichhaltigen Kontext.\n"
            "- pre_generation_match_context als Optimierungsleitplanken nutzen:\n"
            f"  fehlende Keywords gezielt integrieren, vorhandene Treffer erhalten, ATS Probleme verbessern.{skill_instruction_de}{achievement_instruction_de}"
        )
    prompt = (
        f"{guard}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n"
        f"Input Metadata: {json.dumps(input_payload, ensure_ascii=True)}\n\n"
        f"Source Documents Context:\n<DOCUMENTS>\n{raw_blob}\n</DOCUMENTS>"
    )
    return prompt, warning


def _build_skill_contexts(
    profile: ExtractedProfile,
    match_context: Optional[Dict[str, Any]]
) -> Dict[str, List[str]]:
    """Extract contextual hints from achievements and match data for skill enrichment."""
    contexts = {}

    # Extract from skill rankings (semantic match top 15)
    if match_context and "skill_rankings" in match_context:
        for skill_data in match_context["skill_rankings"].get("top_skills", [])[:15]:
            skill_name = skill_data.get("skill", "")
            if skill_name:
                contexts[skill_name] = []

    # Find skill mentions in achievements
    for exp in profile.experience:
        for achievement in exp.achievements:
            for skill in profile.skills_str[:20]:
                skill_base = skill.lower().split('(')[0].strip()
                if skill_base in achievement.lower():
                    # Extract 5-word context window
                    words = achievement.split()
                    for i, word in enumerate(words):
                        if skill_base in word.lower():
                            context = ' '.join(words[max(0,i-3):min(len(words),i+4)])
                            contexts.setdefault(skill, []).append(context[:50])
                            break

    # Limit to 3 context items per skill
    return {k: list(set(v))[:3] for k, v in contexts.items()}


def _refine_prompt(
    language: str,
    user_message: str,
    current_content: GeneratedContent,
    profile: ExtractedProfile,
    job_ad_text: str,
    chat_history: List[Dict[str, str]],
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
    input_payload = {
        "language": language,
        "job_ad_text": job_ad_text,
        "profile_confirmed": profile.model_dump(),
        "current_generated_content": current_content.model_dump(),
        "chat_history": chat_history,
        "user_correction": user_message,
    }
    guard = (
        "You are refining an existing CV and cover letter. Apply only the user's requested change. "
        "Return the FULL updated content in the same JSON schema. Only modify what the user asks. "
        "Keep everything else identical. Never invent facts not present in the profile."
    )
    return (
        f"{guard}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n"
        f"Input: {json.dumps(input_payload, ensure_ascii=True)}"
    )


def _refine_sync(
    language: str,
    user_message: str,
    current_content: GeneratedContent,
    profile: ExtractedProfile,
    job_ad_text: str,
    chat_history: List[Dict[str, str]],
) -> Tuple[GeneratedContent, Optional[str]]:
    prompt = _refine_prompt(language, user_message, current_content, profile, job_ad_text, chat_history)
    try:
        payload = _chat_json_anthropic(
            model=CFG["generation"],
            system=_build_generation_system_prompt(language),
            user=prompt,
            max_tokens=2600,
        )
        generated = _coerce_generated_payload(payload)
        return _merge_generated_with_profile(generated, profile, language), None
    except Exception as exc:
        return current_content, f"Refinement fallback: {exc}"


def _crosscheck_gemini(generated: GeneratedContent, profile: ExtractedProfile, language: str) -> GeneratedContent:
    """Non-fatal advisory crosscheck via Gemini. Logs issues but returns generated content regardless."""
    try:
        system = "CV fact-checker. Compare generated vs source profile. Return JSON with issues array and verified boolean."
        user = json.dumps({"generated": generated.model_dump(), "source": profile.model_dump()})
        _chat_json_google(model=CFG["crosscheck"], system=system, user=user)
    except Exception:
        pass
    return generated


def _extract_profile_sync(
    language: str,
    source_documents: List[str],
) -> Tuple[Optional[ExtractedProfile], Optional[str], Dict[str, Any]]:
    if not source_documents:
        return None, None, {"model_used": None, "source_chars": 0, "source_docs": 0}
    prompt, warning = _profile_extract_prompt(language=language, source_documents=source_documents)
    try:
        payload = _chat_json_openai(prompt=prompt, max_tokens=2600, model=CFG["extraction"])
        profile = _coerce_profile_payload(payload)
        debug = {
            "model_used": CFG["extraction"],
            "source_chars": sum(len(chunk) for chunk in source_documents),
            "source_docs": len(source_documents),
            "experience_count": len(profile.experience),
            "skills_count": len(profile.skills),
        }
        return profile, warning, debug
    except Exception as exc:
        prefix = "Extraktion Fallback" if language == "de" else "Extraction fallback used"
        err_msg = f"{prefix}: {exc}"
        if warning:
            err_msg = f"{warning} | {err_msg}"
        return None, err_msg, {
            "model_used": CFG["extraction"],
            "source_chars": sum(len(chunk) for chunk in source_documents),
            "source_docs": len(source_documents),
        }


_TONE_INSTRUCTIONS = {
    "de": {
        1: "Verwende einfache, direkte Sprache. Keine Fachbegriffe oder Buzzwords. Kurze, klare Sätze. Faktenbasiert und nüchtern.",
        2: "Verwende klare, professionelle Sprache mit wenig Fachjargon. Bevorzuge konkrete Aussagen gegenüber abstrakten Formulierungen.",
        3: "Verwende professionelle Standardsprache. Branchenübliche Begriffe sind erlaubt, aber vermeide übertriebene Buzzwords.",
        4: "Verwende dynamische, branchenspezifische Sprache. Integriere relevante Fachbegriffe und Keywords aus dem Stelleninserat aktiv.",
        5: "Verwende maximale Keyword-Dichte. Integriere alle relevanten Fachbegriffe, Buzzwords und branchenspezifische Schlagwörter aus dem Stelleninserat. Dynamischer, selbstbewusster Ton.",
    },
    "en": {
        1: "Use simple, direct language. No jargon or buzzwords. Short, clear sentences. Fact-based and understated.",
        2: "Use clear, professional language with minimal jargon. Prefer concrete statements over abstract formulations.",
        3: "Use standard professional language. Industry terms are fine, but avoid excessive buzzwords.",
        4: "Use dynamic, industry-specific language. Actively integrate relevant technical terms and keywords from the job ad.",
        5: "Maximize keyword density. Integrate all relevant technical terms, buzzwords, and industry-specific terminology from the job ad. Dynamic, confident tone.",
    },
}


def _build_generation_system_prompt(language: str, tone: int = 3) -> str:
    """Build language-specific system prompt for CV/cover letter generation."""
    tone = max(1, min(5, tone))
    lang_key = "de" if language == "de" else "en"
    tone_line = _TONE_INSTRUCTIONS[lang_key][tone]

    if language == "de":
        return f"""Du bist ein Experte für Lebensläufe und Bewerbungsschreiben für den Schweizer Arbeitsmarkt.

Kultureller Kontext Schweiz:
- Professioneller, aber herzlicher Ton
- Präzision und Detailgenauigkeit geschätzt
- Mehrsprachiger Kontext (Deutsch, Französisch, Italienisch, Englisch)
- Direkte Kommunikation bevorzugt, keine Floskeln
- Betonung auf Zertifikaten, Qualifikationen, konkreten Erfolgen

Sprachrichtlinien Schweizer Hochdeutsch:
- Schweizer Standarddeutsch verwenden (nicht Bundesdeutsch, nicht Schweizerdeutsch)
- Schweizer Begriffe: "Arbeitgeber" (employer), "Arbeitnehmende" (employee)
- Schweizer Datumsformat: DD.MM.YYYY
- Keine deutschen Anglizismen (z.B. "Lebenslauf", nicht "CV")

Format-Anforderungen:
- Klare Abschnittsüberschriften
- Umgekehrt chronologische Reihenfolge (neueste zuerst)
- Quantifizierte Erfolge mit Metriken

Tonalität:
- {tone_line}

Rückgabe: Valides JSON, kein Markdown."""

    # English (default)
    return f"""You are an expert CV and cover letter writer for the Swiss job market.

Cultural context for Switzerland:
- Professional yet warm tone
- Precision and attention to detail valued
- Multilingual environment (German, French, Italian, English)
- Direct communication preferred over flowery language
- Emphasis on certifications, qualifications, and concrete achievements

Format requirements:
- Clear section headers
- Reverse chronological order (most recent first)
- Quantified achievements with metrics

Tone:
- {tone_line}

Return valid JSON only. No markdown."""


def _generate_sync(
    language: str,
    job_ad_text: str,
    profile: ExtractedProfile,
    source_documents: Optional[List[str]],
    match_context: Optional[Dict[str, Any]] = None,
    tone: int = 3,
) -> Tuple[GeneratedContent, Optional[str]]:
    prompt, warning = _generate_prompt(
        language=language,
        job_ad_text=job_ad_text,
        profile=profile,
        source_documents=source_documents,
        match_context=match_context,
    )
    try:
        payload = _chat_json_anthropic(
            model=CFG["generation"],
            system=_build_generation_system_prompt(language, tone),
            user=prompt,
            max_tokens=2600,
        )
        generated = _coerce_generated_payload(payload)
        result = _merge_generated_with_profile(generated, profile, language)
        if CFG["crosscheck"]:
            result = _crosscheck_gemini(result, profile, language)
        return result, warning
    except Exception as exc:
        fallback = _fallback_content(language=language, job_ad_text=job_ad_text, profile=profile)
        err_msg = f"Generation fallback: {exc}"
        if warning:
            err_msg = f"{warning} | {err_msg}"
        return fallback, err_msg


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
    match_context: Optional[Dict[str, Any]] = None,
    tone: int = 3,
) -> Tuple[GeneratedContent, Optional[str]]:
    # Enhance match_context with skill ranking and achievement scoring
    from happyrav.services.llm_matching import rank_skills_by_relevance, score_achievement_relevance

    enhanced_context = match_context.copy() if match_context else {}

    try:
        # 1. Rank skills by relevance
        if profile.skills:
            ranked_skills = await rank_skills_by_relevance(
                cv_skills=profile.skills_str,
                job_ad_text=job_ad_text,
                language=language
            )
            enhanced_context["skill_rankings"] = {
                "top_skills": [s for s in ranked_skills if s.get("relevance", 0) > 0.7][:10],
                "deprioritize": [s["skill"] for s in ranked_skills if s.get("relevance", 0) < 0.3]
            }

        # 2. Score achievements
        all_achievements = []
        for exp in profile.experience:
            all_achievements.extend(exp.achievements)

        if all_achievements:
            scored_achievements = await score_achievement_relevance(
                achievements=all_achievements,
                job_ad_text=job_ad_text,
                language=language
            )
            enhanced_context["achievement_hints"] = {
                "high_relevance": [a for a in scored_achievements if a.get("relevance", 0) > 0.7][:5],
                "needs_metrics": [a for a in scored_achievements if a.get("add_metrics")][:3],
                "rewrite_suggestions": {
                    a["original"]: a.get("rewrite_suggestion", "")
                    for a in scored_achievements
                    if a.get("rewrite_suggestion")
                }
            }
    except Exception as e:
        # Don't fail generation if enhancement fails
        print(f"LLM enhancement failed: {e}")

    return await asyncio.to_thread(
        _generate_sync,
        language,
        job_ad_text,
        profile,
        source_documents,
        enhanced_context,
        tone,
    )


async def refine_content(
    language: str,
    user_message: str,
    current_content: GeneratedContent,
    profile: ExtractedProfile,
    job_ad_text: str,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> Tuple[GeneratedContent, Optional[str]]:
    return await asyncio.to_thread(
        _refine_sync,
        language,
        user_message,
        current_content,
        profile,
        job_ad_text,
        chat_history or [],
    )


def _monster_timeline_prompt(language: str, source_documents: List[str], doc_tags: List[str]) -> Tuple[str, Optional[str]]:
    """Build prompt for comprehensive Monster CV timeline extraction."""
    schema = {
        "timeline": [
            {
                "start_date": "string (YYYY, YYYY-MM, or YYYY-MM-DD)",
                "end_date": "string (empty if current/ongoing)",
                "entry_type": "employment|education|achievement|certification",
                "organization": "string",
                "role_or_title": "string",
                "responsibilities": ["string", "..."],
                "achievements": ["string", "..."],
                "skills_used": ["string", "..."],
                "context": "string (team size, technologies, special projects)",
                "source_doc_id": "string",
                "confidence": "float",
            }
        ],
        "all_skills": ["string", "..."],
        "all_certifications": ["string", "..."],
        "extraction_metadata": {},
    }

    # Prioritize Arbeitszeugnisse by reordering documents
    prioritized_docs = []
    other_docs = []
    for i, (doc, tag) in enumerate(zip(source_documents, doc_tags)):
        if tag == "arbeitszeugnis":
            prioritized_docs.append(doc)
        else:
            other_docs.append(doc)
    ordered_docs = prioritized_docs + other_docs

    raw_blob = "\n\n--- DOCUMENT ---\n\n".join(ordered_docs)
    limit = 80000
    warning = None
    if len(raw_blob) > limit:
        raw_blob = raw_blob[:limit]
        warning = "Source documents truncated to 80k chars for Monster CV extraction."

    guard_en = (
        "Extract a COMPREHENSIVE chronological timeline from all documents. "
        "This is a 'Monster CV' - extract EVERY responsibility, task, achievement, and metric. NO SUMMARIZATION.\n\n"
        "CRITICAL RULES:\n"
        "- Extract ALL positions, roles, education, certifications mentioned\n"
        "- Preserve ALL responsibilities verbatim (no bullet limits)\n"
        "- Preserve ALL achievements with exact metrics and numbers\n"
        "- Arbeitszeugnisse (work references) contain detailed performance evaluations - extract ALL content\n"
        "- Include context: team size, technologies, budget, special projects\n"
        "- Chronological order by start_date (most recent first)\n"
        "- Preserve original date strings if unclear format\n"
        "- Do NOT merge or summarize entries\n"
        "- This is an archival document, completeness over brevity\n"
    )

    guard_de = (
        "Extrahiere eine UMFASSENDE chronologische Zeitleiste aus allen Dokumenten. "
        "Dies ist ein 'Monster CV' - extrahiere JEDE Verantwortlichkeit, Aufgabe, Erfolg und Metrik. KEINE ZUSAMMENFASSUNG.\n\n"
        "KRITISCHE REGELN:\n"
        "- Alle Positionen, Rollen, Ausbildungen, Zertifizierungen extrahieren\n"
        "- Alle Verantwortlichkeiten wortwörtlich übernehmen (keine Limits)\n"
        "- Alle Erfolge mit exakten Metriken und Zahlen\n"
        "- Arbeitszeugnisse enthalten detaillierte Leistungsbeurteilungen - ALLE Inhalte extrahieren\n"
        "- Kontext einbeziehen: Teamgröße, Technologien, Budget, Spezialprojekte\n"
        "- Chronologische Ordnung nach start_date (neueste zuerst)\n"
        "- Originale Datumsstrings beibehalten bei unklarem Format\n"
        "- Einträge NICHT zusammenführen oder zusammenfassen\n"
        "- Dies ist ein Archivdokument, Vollständigkeit vor Kürze\n"
    )

    guard = guard_de if language == "de" else guard_en

    prompt = (
        f"{guard}\n"
        f"Output schema: {json.dumps(schema, ensure_ascii=True)}\n\n"
        f"Input documents (Arbeitszeugnisse prioritized):\n<DOCUMENTS>\n{raw_blob}\n</DOCUMENTS>"
    )
    return prompt, warning


def _coerce_timeline_entry(item: Any) -> Optional[ChronologicalEntry]:
    """Coerce dict to ChronologicalEntry with validation."""
    if not isinstance(item, dict):
        return None

    role_or_title = str(item.get("role_or_title", "")).strip()
    if not role_or_title:
        return None

    entry_type = str(item.get("entry_type", "employment")).strip()
    if entry_type not in ("employment", "education", "achievement", "certification"):
        entry_type = "employment"

    return ChronologicalEntry(
        start_date=str(item.get("start_date", "")).strip(),
        end_date=str(item.get("end_date", "")).strip(),
        entry_type=entry_type,
        organization=str(item.get("organization", "")).strip(),
        role_or_title=role_or_title,
        responsibilities=_safe_list(item.get("responsibilities", [])),
        achievements=_safe_list(item.get("achievements", [])),
        skills_used=_safe_list(item.get("skills_used", [])),
        context=str(item.get("context", "")).strip(),
        source_doc_id=str(item.get("source_doc_id", "")).strip(),
        confidence=float(item.get("confidence", 0.0)),
    )


def _coerce_monster_payload(payload: Dict[str, Any]) -> MonsterCVProfile:
    """Coerce raw JSON to MonsterCVProfile."""
    from happyrav.services.parsing import parse_date_for_sort

    timeline_raw = payload.get("timeline", [])
    timeline_entries = []
    for item in timeline_raw if isinstance(timeline_raw, list) else []:
        entry = _coerce_timeline_entry(item)
        if entry:
            timeline_entries.append(entry)

    # Sort chronologically (most recent first)
    timeline_entries.sort(key=lambda e: parse_date_for_sort(e.start_date), reverse=True)

    # Deduplicate by org+role+period
    seen = set()
    deduped = []
    for entry in timeline_entries:
        key = (entry.organization.lower(), entry.role_or_title.lower(), entry.start_date, entry.end_date)
        if key not in seen:
            seen.add(key)
            deduped.append(entry)

    return MonsterCVProfile(
        timeline=deduped,
        all_skills=_safe_list(payload.get("all_skills", [])),
        all_certifications=_safe_list(payload.get("all_certifications", [])),
        extraction_metadata=payload.get("extraction_metadata", {}),
    )


def _extract_monster_timeline_sync(
    language: str,
    source_documents: List[str],
    doc_tags: List[str],
) -> Tuple[Optional[MonsterCVProfile], Optional[str]]:
    """Synchronous Monster CV timeline extraction."""
    if not source_documents:
        return None, "No source documents provided"

    prompt, warning = _monster_timeline_prompt(language, source_documents, doc_tags)

    try:
        payload = _chat_json_openai(prompt=prompt, max_tokens=8000, model=CFG["extraction"])
        timeline = _coerce_monster_payload(payload)
        return timeline, warning
    except Exception as exc:
        err_msg = f"Monster CV extraction failed: {exc}"
        if warning:
            err_msg = f"{warning} | {err_msg}"
        return None, err_msg


async def extract_monster_timeline(
    language: str,
    source_documents: List[str],
    doc_tags: List[str],
) -> Tuple[Optional[MonsterCVProfile], Optional[str]]:
    """Extract comprehensive Monster CV timeline (all responsibilities, no limits)."""
    return await asyncio.to_thread(_extract_monster_timeline_sync, language, source_documents, doc_tags)


def _strategic_analysis_prompt(
    language: str,
    match: Any,
    profile: ExtractedProfile,
    job_ad_text: str,
) -> str:
    """Build prompt for strategic analysis generation."""
    lang_label = "English" if language == "en" else "German"

    matched_kw = ", ".join(match.matched_keywords) if match.matched_keywords else "None"
    missing_kw = ", ".join(match.missing_keywords) if match.missing_keywords else "None"

    skills_list = ", ".join(profile.skills_str) if profile.skills else "Not specified"
    experience_summary = ""
    if profile.experience:
        exp_items = [f"{e.role} at {e.company} ({e.period or 'duration unknown'})" for e in profile.experience[:3]]
        experience_summary = "; ".join(exp_items)
    else:
        experience_summary = "No experience listed"

    # Add contextual gaps if available
    gaps_context = ""
    if hasattr(match, 'contextual_gaps') and match.contextual_gaps:
        critical_gaps = [g for g in match.contextual_gaps if g.severity == "critical"]
        important_gaps = [g for g in match.contextual_gaps if g.severity == "important"]
        substitutable_gaps = [g for g in match.contextual_gaps if g.substitutable]

        gaps_context = f"""
- Contextual gap analysis:
  Critical gaps (deal-breakers): {', '.join([g.missing for g in critical_gaps]) if critical_gaps else 'None'}
  Important gaps: {', '.join([g.missing for g in important_gaps]) if important_gaps else 'None'}
  Substitutable: {', '.join([f"{g.missing} (suggest: {g.suggestions[:40]})" for g in substitutable_gaps[:2]]) if substitutable_gaps else 'None'}"""

    # Add semantic match info if available
    semantic_context = ""
    if hasattr(match, 'semantic_match') and match.semantic_match:
        sem = match.semantic_match
        transferable = sem.transferable_matches[:3] if sem.transferable_matches else []
        if transferable:
            semantic_context = f"""
- Transferable skills: {', '.join([f"{m.get('cv_has', '')} → {m.get('job_needs', '')}" for m in transferable])}"""

    return f"""You are a career strategist analyzing a candidate's fit for a role.

INPUT:
- Job ad: {job_ad_text[:1500]}
- Candidate profile: {profile.full_name or 'Unknown'}
  Headline: {profile.headline or 'Not specified'}
  Skills: {skills_list}
  Experience: {experience_summary}
- Match analysis:
  Overall score: {match.overall_score:.1f}%
  Matched keywords: {matched_kw}
  Missing keywords: {missing_kw}{gaps_context}{semantic_context}

TASK:
Provide strategic advice on how to apply for this role in {lang_label}:

1. STRENGTHS (2-3 points): Where candidate matches well
   - Example: "Strong match on Python, SQL, and 5+ years experience"
   - Include transferable skills if detected

2. GAPS (2-3 points): What's missing and severity
   - Example: "Missing Kubernetes experience (nice-to-have, not critical)"
   - Distinguish must-have vs nice-to-have gaps
   - Note which gaps can be compensated

3. RECOMMENDATIONS (3-5 specific actions):
   - Cover letter: What to emphasize, what gaps to address directly
   - Interview: Which strengths to highlight, which gaps to prepare for
   - Application strategy: Any positioning advice

4. SUMMARY (1-2 sentences): Overall recommendation

CRITICAL:
- Be specific (mention exact skills/experiences)
- Distinguish must-have vs nice-to-have gaps
- Provide actionable advice (not generic)
- These are recommendations FOR THE USER, not changes to the CV
- Score {match.overall_score:.1f}%: {"congratulatory tone, emphasize strengths" if match.overall_score >= 70 else "constructive tone, focus on gap mitigation"}

Output: JSON with keys {{strengths, gaps, recommendations, summary}}
Each list should contain 2-5 items."""


def _generate_strategic_analysis_sync(
    language: str,
    match: Any,
    profile: ExtractedProfile,
    job_ad_text: str,
) -> Dict[str, Any]:
    """Synchronous strategic analysis generation."""
    prompt = _strategic_analysis_prompt(language, match, profile, job_ad_text)
    system = "You are an expert career strategist. Return valid JSON only."

    try:
        payload = _chat_json_anthropic(
            model=CFG["generation"],
            system=system,
            user=prompt,
            max_tokens=1500,
        )
        # Ensure all required keys exist
        return {
            "strengths": payload.get("strengths", []),
            "gaps": payload.get("gaps", []),
            "recommendations": payload.get("recommendations", []),
            "summary": payload.get("summary", ""),
        }
    except Exception as exc:
        # Graceful degradation if LLM fails
        return {
            "strengths": ["Unable to generate strategic analysis"],
            "gaps": [],
            "recommendations": [],
            "summary": f"Analysis generation failed: {exc}",
        }


async def generate_strategic_analysis(
    language: str,
    match: Any,
    profile: ExtractedProfile,
    job_ad_text: str,
) -> Dict[str, Any]:
    """Generate strategic recommendations for job application."""
    return await asyncio.to_thread(
        _generate_strategic_analysis_sync,
        language,
        match,
        profile,
        job_ad_text
    )


def _answer_strategic_question_prompt(
    language: str,
    user_question: str,
    strategic_context: Dict[str, Any],
    match_context: Dict[str, Any],
    profile: ExtractedProfile,
    job_ad: str,
) -> str:
    """Build prompt for answering strategic questions."""
    lang_label = "English" if language == "en" else "German"

    strengths = "\n".join(f"- {s}" for s in strategic_context.get("strengths", []))
    gaps = "\n".join(f"- {g}" for g in strategic_context.get("gaps", []))
    recommendations = "\n".join(f"- {r}" for r in strategic_context.get("recommendations", []))

    return f"""You are a career advisor helping a candidate understand their application strategy.

CONTEXT:
Job ad: {job_ad[:500]}...
Candidate: {profile.full_name or 'Unknown'} - {profile.headline or 'Professional'}
Match score: {match_context.get('overall_score', 0):.1f}%

STRATEGIC ANALYSIS ALREADY PROVIDED:
Strengths:
{strengths}

Gaps:
{gaps}

Recommendations:
{recommendations}

USER QUESTION:
{user_question}

TASK:
Answer the user's question in {lang_label} with specific, actionable advice based on the context above.
- Reference specific skills, gaps, or strengths from the analysis
- Provide concrete examples or phrasing suggestions if asked
- Keep response concise (2-4 sentences)
- Stay focused on application strategy

Do NOT return JSON. Return plain text answer only."""


def _answer_strategic_question_sync(
    language: str,
    user_question: str,
    strategic_context: Dict[str, Any],
    match_context: Dict[str, Any],
    profile: ExtractedProfile,
    job_ad: str,
) -> str:
    """Synchronous strategic question answering."""
    prompt = _answer_strategic_question_prompt(
        language, user_question, strategic_context, match_context, profile, job_ad
    )

    client = _build_anthropic_client()
    try:
        resp = client.messages.create(
            model=CFG["generation"],
            max_tokens=500,
            system="You are a helpful career advisor. Provide concise, actionable advice.",
            messages=[{"role": "user", "content": prompt}],
        )
        return (resp.content[0].text or "").strip()
    except Exception as exc:
        return f"Sorry, I couldn't generate a response. Error: {exc}"


async def _answer_strategic_question(
    language: str,
    user_question: str,
    strategic_context: Dict[str, Any],
    match_context: Dict[str, Any],
    profile: ExtractedProfile,
    job_ad: str,
) -> str:
    """Answer user's strategic question with context-aware advice."""
    return await asyncio.to_thread(
        _answer_strategic_question_sync,
        language,
        user_question,
        strategic_context,
        match_context,
        profile,
        job_ad
    )
