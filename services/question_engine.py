"""Missing-data question generation and answer application."""
from __future__ import annotations

from typing import Dict, List, Set, Tuple

from happyrav.models import ExtractedProfile, MissingQuestion, SessionState
from happyrav.services.parsing import parse_education_text, parse_experience_text, parse_list_text


TRUE_VALUES = {"true", "1", "yes", "y", "ja", "ok"}


def _local_prompt(language: str, de_text: str, en_text: str) -> str:
    return de_text if language == "de" else en_text


def build_missing_questions(state: SessionState, profile: ExtractedProfile) -> List[MissingQuestion]:
    language = state.language
    questions: List[MissingQuestion] = []

    if not profile.full_name:
        questions.append(
            MissingQuestion(
                question_id="req_full_name",
                field_path="profile.full_name",
                required=True,
                reason="Missing required identity field.",
                prompt=_local_prompt(language, "Wie ist Ihr voller Name?", "What is your full name?"),
            )
        )
    if not profile.email:
        questions.append(
            MissingQuestion(
                question_id="req_email",
                field_path="profile.email",
                required=True,
                reason="Missing required contact field.",
                prompt=_local_prompt(language, "Welche E-Mail soll verwendet werden?", "Which email should be used?"),
            )
        )
    if not profile.experience:
        questions.append(
            MissingQuestion(
                question_id="req_experience",
                field_path="profile.experience",
                required=True,
                reason="At least one experience entry is required.",
                prompt=_local_prompt(
                    language,
                    "Bitte mindestens eine Erfahrung angeben (Format: Rolle | Firma | Zeitraum | Erfolg1;Erfolg2).",
                    "Please provide at least one experience entry (format: Role | Company | Period | achievement1;achievement2).",
                ),
            )
        )
    else:
        seen_periods: Dict[Tuple[str, str], Set[str]] = {}
        for item in profile.experience:
            role_key = item.role.strip().lower()
            company_key = item.company.strip().lower()
            period_key = item.period.strip().lower()
            if not role_key:
                continue
            key = (role_key, company_key)
            seen_periods.setdefault(key, set())
            if period_key:
                seen_periods[key].add(period_key)

        conflicts = [(k, v) for k, v in seen_periods.items() if len(v) > 1]
        if conflicts:
            detail_lines = []
            for (role, company), periods in conflicts:
                sorted_periods = sorted(periods)
                label = f"{role} @ {company}" if company else role
                detail_lines.append(f"  {label}: {' vs '.join(sorted_periods)}")
            detail_block = "\n".join(detail_lines)
            questions.append(
                MissingQuestion(
                    question_id="opt_experience_conflict",
                    field_path="profile.experience",
                    required=False,
                    reason=_local_prompt(
                        language,
                        f"Widersprüchliche Zeiträume in hochgeladenen Dokumenten:\n{detail_block}",
                        f"Conflicting periods found across uploaded documents:\n{detail_block}",
                    ),
                    prompt=_local_prompt(
                        language,
                        'Widersprüchliche Zeiträume gefunden (siehe Details). Korrekte Version eingeben oder "ok" um fortzufahren.',
                        'Conflicting periods found (see details). Enter correct version or type "ok" to continue as-is.',
                    ),
                )
            )
    if not state.job_ad_text.strip():
        questions.append(
            MissingQuestion(
                question_id="req_job_ad",
                field_path="state.job_ad_text",
                required=True,
                reason="Job ad is required for matching and generation.",
                prompt=_local_prompt(
                    language,
                    "Bitte den vollständigen Job-Inseratstext einfügen.",
                    "Please provide the full job ad text.",
                ),
            )
        )
    if state.language not in {"de", "en"}:
        questions.append(
            MissingQuestion(
                question_id="req_language",
                field_path="state.language",
                required=True,
                reason="Output language is required.",
                options=["de", "en"],
                prompt=_local_prompt(language, "Sprache wählen: de oder en?", "Choose output language: de or en?"),
            )
        )
    if not state.consent_confirmed:
        questions.append(
            MissingQuestion(
                question_id="req_consent",
                field_path="state.consent_confirmed",
                required=True,
                reason="Consent is mandatory before generation.",
                options=["true", "false"],
                prompt=_local_prompt(
                    language,
                    "Bestätigen Sie die Datennutzung für die Generierung? (true/false)",
                    "Please confirm data use for generation (true/false).",
                ),
            )
        )

    if not profile.phone:
        questions.append(
            MissingQuestion(
                question_id="opt_phone",
                field_path="profile.phone",
                required=False,
                reason="Optional contact field missing.",
                prompt=_local_prompt(language, "Telefonnummer hinzufügen (optional).", "Add phone number (optional)."),
            )
        )
    if not profile.location:
        questions.append(
            MissingQuestion(
                question_id="opt_location",
                field_path="profile.location",
                required=False,
                reason="Optional location field missing.",
                prompt=_local_prompt(language, "Standort hinzufügen (optional).", "Add location (optional)."),
            )
        )
    if not profile.linkedin:
        questions.append(
            MissingQuestion(
                question_id="opt_linkedin",
                field_path="profile.linkedin",
                required=False,
                reason="Optional profile link missing.",
                prompt=_local_prompt(
                    language,
                    "LinkedIn URL hinzufügen (optional).",
                    "Add LinkedIn URL (optional).",
                ),
            )
        )
    if not profile.portfolio:
        questions.append(
            MissingQuestion(
                question_id="opt_portfolio",
                field_path="profile.portfolio",
                required=False,
                reason="Optional portfolio link missing.",
                prompt=_local_prompt(
                    language,
                    "Portfolio URL hinzufügen (optional).",
                    "Add portfolio URL (optional).",
                ),
            )
        )
    if not profile.skills:
        questions.append(
            MissingQuestion(
                question_id="opt_skills",
                field_path="profile.skills",
                required=False,
                reason="Optional but useful for match quality.",
                prompt=_local_prompt(
                    language,
                    "Relevante Skills ergänzen (kommagetrennt, optional).",
                    "Add relevant skills (comma-separated, optional).",
                ),
            )
        )
    if not profile.education:
        questions.append(
            MissingQuestion(
                question_id="opt_education",
                field_path="profile.education",
                required=False,
                reason="Optional but useful for completeness.",
                prompt=_local_prompt(
                    language,
                    "Ausbildung ergänzen (Format: Abschluss | Schule | Zeitraum, optional).",
                    "Add education (format: Degree | School | Period, optional).",
                ),
            )
        )
    questions.append(
        MissingQuestion(
            question_id="opt_references",
            field_path="profile.achievements",
            required=False,
            reason="Optional reference context can improve credibility.",
            prompt=_local_prompt(
                language,
                "Referenzen oder Zeugnis-Hinweise ergänzen (optional).",
                "Add references or testimony notes (optional).",
            ),
        )
    )

    return questions


def apply_answers_to_profile(
    profile: ExtractedProfile,
    questions: List[MissingQuestion],
    answers: Dict[str, str],
) -> ExtractedProfile:
    updated = profile.model_copy(deep=True)
    q_lookup = {question.question_id: question for question in questions}

    for question_id, raw_answer in answers.items():
        question = q_lookup.get(question_id)
        if not question:
            continue
        answer = (raw_answer or "").strip()
        if not answer:
            continue

        field_path = question.field_path
        if field_path == "profile.full_name":
            updated.full_name = answer
        elif field_path == "profile.email":
            updated.email = answer
        elif field_path == "profile.phone":
            updated.phone = answer
        elif field_path == "profile.location":
            updated.location = answer
        elif field_path == "profile.linkedin":
            updated.linkedin = answer
        elif field_path == "profile.portfolio":
            updated.portfolio = answer
        elif field_path == "profile.skills":
            updated.skills = parse_list_text(answer)
        elif field_path == "profile.experience":
            skip_words = {"ok", "keep", "use cv", "passt", "weiter", "skip", "cv nehmen", "übernehmen"}
            if answer.lower().strip().rstrip(".!") in skip_words:
                continue
            parsed = parse_experience_text(answer)
            if parsed:
                updated.experience = parsed
        elif field_path == "profile.education":
            updated.education = parse_education_text(answer)
        elif field_path == "profile.achievements":
            updated.achievements = parse_list_text(answer)

    return updated


def apply_answers_to_state(
    state: SessionState,
    questions: List[MissingQuestion],
    answers: Dict[str, str],
) -> SessionState:
    updated = state.model_copy(deep=True)
    q_lookup = {question.question_id: question for question in questions}

    for question_id, raw_answer in answers.items():
        question = q_lookup.get(question_id)
        if not question:
            continue
        answer = (raw_answer or "").strip()
        if not answer:
            continue

        field_path = question.field_path
        if field_path == "state.job_ad_text":
            updated.job_ad_text = answer
        elif field_path == "state.language":
            updated.language = "de" if answer.lower() == "de" else "en"
        elif field_path == "state.consent_confirmed":
            updated.consent_confirmed = answer.lower() in TRUE_VALUES

    return updated


def unresolved_required_ids(questions: List[MissingQuestion]) -> List[str]:
    return [question.question_id for question in questions if question.required]
