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


def parse_date_for_sort(date_str: str) -> int:
    """
    Parse date string to sortable int (YYYYMMDD).
    Handles: YYYY, YYYY-MM, YYYY-MM-DD, "Month YYYY", "Januar 2018", etc.
    Returns 0 for unparseable dates (sorted to end).
    """
    if not date_str:
        return 0

    date_str = date_str.strip()

    # Try YYYY-MM-DD
    match = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", date_str)
    if match:
        y, m, d = match.groups()
        return int(y) * 10000 + int(m) * 100 + int(d)

    # Try YYYY-MM
    match = re.match(r"^(\d{4})-(\d{2})$", date_str)
    if match:
        y, m = match.groups()
        return int(y) * 10000 + int(m) * 100 + 1

    # Try YYYY
    match = re.match(r"^(\d{4})$", date_str)
    if match:
        return int(match.group(1)) * 10000 + 101

    # Try "Month YYYY" (English and German)
    months_en = {
        "january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
        "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12
    }
    months_de = {
        "januar": 1, "februar": 2, "märz": 3, "april": 4, "mai": 5, "juni": 6,
        "juli": 7, "august": 8, "september": 9, "oktober": 10, "november": 11, "dezember": 12
    }

    match = re.match(r"^([a-zA-ZäöüÄÖÜß]+)\s+(\d{4})$", date_str, re.IGNORECASE)
    if match:
        month_str, year_str = match.groups()
        month_str_lower = month_str.lower()
        month = months_en.get(month_str_lower) or months_de.get(month_str_lower)
        if month:
            return int(year_str) * 10000 + month * 100 + 1

    # Unparseable
    return 0

