"""Local deterministic baseline ATS-like matching."""
from __future__ import annotations

import re
from collections import Counter
from typing import Dict, List, Set

from happyrav.models import MatchPayload


_WORD_RE = re.compile(r"[a-zA-Z0-9][a-zA-Z0-9+#./_-]{1,}")
_COMMON_STOPWORDS: Set[str] = {
    "and", "the", "for", "with", "you", "your", "our", "this", "that", "from", "into", "will",
    "oder", "und", "der", "die", "das", "mit", "für", "von", "ein", "eine", "dass", "wir", "sie",
}
_SKILL_HINTS = {
    "python", "java", "javascript", "typescript", "react", "node", "git", "docker", "kubernetes",
    "aws", "azure", "gcp", "sql", "postgresql", "mysql", "fastapi", "django", "ml", "ai", "agile",
}
_EDU_HINTS = {"bachelor", "master", "msc", "bsc", "phd", "diploma", "degree", "studium"}
_EXP_HINTS = {"years", "year", "experience", "lead", "managed", "project", "team", "praxis", "erfahrung"}


def _tokenize(text: str) -> List[str]:
    return [m.group(0).lower() for m in _WORD_RE.finditer(text or "")]


def extract_job_keywords(job_ad_text: str, limit: int = 60) -> List[str]:
    """Extract deterministic keywords from job ad only."""
    tokens = _tokenize(job_ad_text)
    counts = Counter(
        tok for tok in tokens
        if len(tok) >= 2 and tok not in _COMMON_STOPWORDS and any(c.isalpha() for c in tok)
    )
    ranked = [kw for kw, _ in counts.most_common(limit * 2)]
    # Prefer known skill-like tokens but keep broader terms for coverage.
    skill_first = [kw for kw in ranked if kw in _SKILL_HINTS]
    rest = [kw for kw in ranked if kw not in _SKILL_HINTS]
    return (skill_first + rest)[:limit]


def _coverage(candidates: List[str], cv_tokens: Set[str]) -> float:
    if not candidates:
        return 0.0
    matched = sum(1 for kw in candidates if kw in cv_tokens)
    return round((matched / len(candidates)) * 100.0, 2)


def compute_match(cv_text: str, job_ad_text: str, language: str) -> MatchPayload:
    del language  # Reserved for future language-specific weighting.
    keywords = extract_job_keywords(job_ad_text)
    cv_tokens = set(_tokenize(cv_text))

    matched = [kw for kw in keywords if kw in cv_tokens]
    missing = [kw for kw in keywords if kw not in cv_tokens]

    skill_candidates = [kw for kw in keywords if kw in _SKILL_HINTS] or keywords[:10]
    exp_candidates = [kw for kw in keywords if kw in _EXP_HINTS] or keywords[10:20]
    edu_candidates = [kw for kw in keywords if kw in _EDU_HINTS] or keywords[20:30]

    skills_match = _coverage(skill_candidates, cv_tokens)
    experience_match = _coverage(exp_candidates, cv_tokens)
    education_match = _coverage(edu_candidates, cv_tokens)
    keyword_density = _coverage(keywords[: min(len(keywords), 25)], cv_tokens)

    # ATS compatibility keeps deterministic sanity checks (presence of core sections/text volume).
    ats_compatibility = 65.0
    if len(cv_text.strip()) > 300:
        ats_compatibility += 10.0
    if any(h in cv_text.lower() for h in ("experience", "education", "skills", "erfahrung", "ausbildung")):
        ats_compatibility += 15.0
    ats_compatibility = min(100.0, ats_compatibility)

    overall = round(
        skills_match * 0.35
        + experience_match * 0.25
        + education_match * 0.15
        + keyword_density * 0.15
        + ats_compatibility * 0.10,
        2,
    )
    category_scores: Dict[str, float] = {
        "skills_match": skills_match,
        "experience_match": experience_match,
        "education_match": education_match,
        "keyword_density": keyword_density,
        "ats_compatibility": ats_compatibility,
    }
    return MatchPayload(
        overall_score=overall,
        category_scores=category_scores,
        matched_keywords=matched,
        missing_keywords=missing,
    )
