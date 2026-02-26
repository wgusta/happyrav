"""Tests for local deterministic baseline scoring."""

from happyrav.services.scoring import compute_match, extract_job_keywords


def test_extract_keywords_uses_job_ad_only():
    job_ad = "Python FastAPI PostgreSQL Docker Agile Agile"
    cv_text = "React Node.js GraphQL"
    keywords = extract_job_keywords(job_ad)
    assert "python" in keywords
    assert "fastapi" in keywords
    assert "react" not in keywords
    match = compute_match(cv_text=cv_text, job_ad_text=job_ad, language="en")
    assert "python" in match.missing_keywords
    assert "react" not in match.missing_keywords


def test_self_match_regression_job_ad_vs_cv():
    job_ad = "kubernetes terraform aws"
    cv_text = "excel powerpoint communication"
    match = compute_match(cv_text=cv_text, job_ad_text=job_ad, language="en")
    assert "kubernetes" in match.missing_keywords
    assert match.category_scores["skills_match"] < 50.0
