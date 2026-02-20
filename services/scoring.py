"""Score generation based on existing parser scanner logic."""
from __future__ import annotations

from typing import Dict

from app.scanners.parser_scanner import run_parser_scan

from happyrav.models import MatchPayload


def compute_match(cv_text: str, job_ad_text: str, language: str) -> MatchPayload:
    parser_result = run_parser_scan(cv_text=cv_text, job_ad_text=job_ad_text, language=language)
    category_scores: Dict[str, float] = {
        "skills_match": float(parser_result.category_scores.skills_match),
        "experience_match": float(parser_result.category_scores.experience_match),
        "education_match": float(parser_result.category_scores.education_match),
        "keyword_density": float(parser_result.category_scores.keyword_density),
        "ats_compatibility": float(parser_result.category_scores.ats_compatibility),
    }
    return MatchPayload(
        overall_score=float(parser_result.overall_score),
        category_scores=category_scores,
        matched_keywords=parser_result.matched_keywords,
        missing_keywords=parser_result.missing_keywords,
        ats_issues=parser_result.ats_issues,
    )

