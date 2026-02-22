"""Template rendering for CV and cover letter documents."""
from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Dict

from jinja2 import Environment, FileSystemLoader, select_autoescape

from happyrav.models import BasicProfile, GeneratedContent, MatchPayload, MonsterCVProfile, ThemeConfig
from happyrav.services.parsing import parse_date_for_sort


TEMPLATE_DIR = Path(__file__).resolve().parent.parent / "doc_templates"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(default_for_string=True, enabled_extensions=("html",)),
)


def build_cv_text(profile: BasicProfile, content: GeneratedContent) -> str:
    chunks = [profile.full_name, profile.headline, content.summary]
    chunks.extend(content.skills)
    for item in content.experience:
        chunks.append(item.role)
        chunks.append(item.company)
        chunks.append(item.period)
        chunks.extend(item.achievements)
    for entry in content.education:
        chunks.append(entry.degree)
        chunks.append(entry.school)
        chunks.append(entry.period)
    return "\n".join([chunk for chunk in chunks if chunk])


def render_cv_html(
    template_id: str,
    language: str,
    profile: BasicProfile,
    content: GeneratedContent,
    theme: ThemeConfig,
    match: MatchPayload,
) -> str:
    template_map = {
        "simple": "cv-template-simple.html.j2",
        "sophisticated": "cv-template-sophisticated.html.j2",
        "friendly": "cv-template-friendly.html.j2",
        "ats_clean": "cv-template-simple.html.j2",
        "ats_modern": "cv-template-simple.html.j2",
    }
    template_name = template_map.get(template_id, "cv-template-simple.html.j2")

    template = env.get_template(template_name)
    return template.render(
        language=language,
        profile=profile,
        content=content,
        theme=theme,
        match=match,
    )


def render_cover_html(
    template_id: str,
    language: str,
    profile: BasicProfile,
    content: GeneratedContent,
    company_name: str,
    position_title: str,
    theme: ThemeConfig,
    sender_street: str = "",
    sender_plz_ort: str = "",
    recipient_street: str = "",
    recipient_plz_ort: str = "",
    recipient_contact: str = "",
    cover_date: str = "",
    signature_data_url: str = "",
) -> str:
    template_map = {
        "simple": "coverletter-template-simple.html.j2",
        "sophisticated": "coverletter-template-sophisticated.html.j2",
        "friendly": "coverletter-template-friendly.html.j2",
        "ats_clean": "coverletter-template-simple.html.j2",
        "ats_modern": "coverletter-template-simple.html.j2",
    }
    template = env.get_template(template_map.get(template_id, "coverletter-template-simple.html.j2"))
    return template.render(
        language=language,
        profile=profile,
        content=content,
        company_name=company_name,
        position_title=position_title,
        theme=theme,
        today=cover_date or date.today().isoformat(),
        sender_street=sender_street,
        sender_plz_ort=sender_plz_ort,
        recipient_street=recipient_street,
        recipient_plz_ort=recipient_plz_ort,
        recipient_contact=recipient_contact,
        cover_date=cover_date,
        signature_data_url=signature_data_url,
    )


def sanitize_filename(value: str) -> str:
    safe = "".join(ch if ch.isalnum() or ch in ("-", "_") else "_" for ch in value.strip())
    return safe.strip("_") or "document"


def build_filenames(profile_name: str, company_name: str) -> Dict[str, str]:
    safe_name = sanitize_filename(profile_name)
    safe_company = sanitize_filename(company_name)
    return {
        "cv": f"CV_{safe_name}_{safe_company}.pdf",
        "cover": f"CoverLetter_{safe_name}_{safe_company}.pdf",
    }


def compute_date_range(timeline: MonsterCVProfile) -> str:
    """Compute date range from timeline entries (e.g., '2015-2025')."""
    if not timeline.timeline:
        return ""

    dates = []
    for entry in timeline.timeline:
        if entry.start_date:
            dates.append(parse_date_for_sort(entry.start_date))
        if entry.end_date:
            dates.append(parse_date_for_sort(entry.end_date))

    valid_dates = [d for d in dates if d > 0]
    if not valid_dates:
        return ""

    min_date = min(valid_dates)
    max_date = max(valid_dates)

    min_year = min_date // 10000
    max_year = max_date // 10000

    if min_year == max_year:
        return str(min_year)
    return f"{min_year}-{max_year}"


def render_monster_cv_html(
    language: str,
    profile_name: str,
    timeline: MonsterCVProfile,
    theme: ThemeConfig,
) -> str:
    """Render Monster CV chronological timeline template."""
    template = env.get_template("monster_timeline.html.j2")
    date_range = compute_date_range(timeline)
    entry_count = len(timeline.timeline)

    return template.render(
        language=language,
        profile_name=profile_name,
        timeline=timeline,
        theme=theme,
        date_range=date_range,
        entry_count=entry_count,
    )
