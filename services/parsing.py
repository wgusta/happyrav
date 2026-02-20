"""Parsing helpers for form and text inputs."""
from __future__ import annotations

import re
from typing import List, Tuple

from happyrav.models import EducationItem, ExperienceItem


def _clean_lines(raw: str) -> List[str]:
    if not raw:
        return []
    lines = [line.strip() for line in raw.splitlines()]
    return [line for line in lines if line]


def parse_list_text(raw: str) -> List[str]:
    if not raw:
        return []
    parts = re.split(r"[\n,;]+", raw)
    cleaned = [part.strip() for part in parts if part.strip()]
    return cleaned


def parse_experience_text(raw: str) -> List[ExperienceItem]:
    """
    Parse lines in format:
    role | company | period | achievement 1 ; achievement 2
    """
    rows = _clean_lines(raw)
    items: List[ExperienceItem] = []

    for row in rows:
        parts = [part.strip() for part in row.split("|")]
        if not parts:
            continue

        role = parts[0] if len(parts) > 0 else ""
        company = parts[1] if len(parts) > 1 else ""
        period = parts[2] if len(parts) > 2 else ""
        achievements_raw = parts[3] if len(parts) > 3 else ""
        achievements = parse_list_text(achievements_raw)

        if role:
            items.append(
                ExperienceItem(
                    role=role,
                    company=company,
                    period=period,
                    achievements=achievements,
                )
            )
    return items


def parse_education_text(raw: str) -> List[EducationItem]:
    """
    Parse lines in format:
    degree | school | period
    """
    rows = _clean_lines(raw)
    items: List[EducationItem] = []

    for row in rows:
        parts = [part.strip() for part in row.split("|")]
        if not parts:
            continue
        degree = parts[0] if len(parts) > 0 else ""
        school = parts[1] if len(parts) > 1 else ""
        period = parts[2] if len(parts) > 2 else ""
        if degree:
            items.append(EducationItem(degree=degree, school=school, period=period))
    return items


def parse_hex_color(value: str, fallback: str) -> str:
    if not value:
        return fallback
    value = value.strip()
    if re.fullmatch(r"#([0-9a-fA-F]{6})", value):
        return value
    return fallback


def parse_language(value: str) -> str:
    value = (value or "").lower().strip()
    return "de" if value == "de" else "en"


def split_keywords(job_ad_text: str) -> Tuple[List[str], List[str]]:
    """
    Lightweight keyword split fallback:
    - hard-ish: words with uppercase, symbols, or >=8 chars
    - soft-ish: shorter words often used for traits.
    """
    words = re.findall(r"[A-Za-z0-9\+\#\.\-]{3,}", job_ad_text or "")
    normalized = []
    seen = set()
    for word in words:
        token = word.strip().lower()
        if token not in seen:
            seen.add(token)
            normalized.append(token)

    hard = [w for w in normalized if len(w) >= 8 or any(ch in w for ch in "+#.-")]
    soft = [w for w in normalized if 3 <= len(w) < 8]
    return hard[:25], soft[:25]

