"""Tests for keyword matching fix (job ad vs CV comparison bug).

Critical fix: Preview-match must use job_ad_text for keyword extraction,
not extract keywords from CV itself (which causes CV to compare against itself).
"""
import pytest
from unittest.mock import patch, MagicMock


class TestKeywordMatchingFix:
    """Verify keywords extracted from job ad, not CV."""

    def test_preview_match_receives_correct_job_ad_text(self, test_client):
        """Verify compute_match() receives job_ad_text parameter from session state."""
        # ARRANGE: Create session with specific job ad text
        job_ad = "Looking for Python expert with FastAPI and PostgreSQL skills."

        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp",
                "position_title": "Python Developer",
                "job_ad_text": job_ad,
                "consent_confirmed": True,
            },
        )
        assert response.status_code == 200
        session_id = response.json()["session_id"]

        # Preseed profile with DIFFERENT skills (not in job ad)
        preseed_data = {
            "profile": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "skills": ["JavaScript", "React", "Node.js", "MongoDB"],  # Different from job ad
                "experience": [
                    {
                        "role": "Frontend Developer",
                        "company": "WebCo",
                        "period": "2020-2023",
                        "achievements": ["Built React apps"]
                    }
                ]
            }
        }

        response = test_client.post(
            f"/api/session/{session_id}/preseed",
            json=preseed_data,
        )
        assert response.status_code == 200

        # Mock compute_match to capture parameters
        captured_job_ad = None
        captured_cv = None

        def mock_compute_match(cv_text, job_ad_text, language):
            nonlocal captured_job_ad, captured_cv
            captured_job_ad = job_ad_text
            captured_cv = cv_text
            # Return realistic result
            result = MagicMock()
            result.overall_score = 45.0
            result.category_scores = {
                "skills_match": 30.0,
                "experience_match": 50.0,
                "education_match": 40.0,
                "keyword_density": 35.0,
                "ats_compatibility": 60.0,
            }
            result.matched_keywords = []
            result.missing_keywords = ["Python", "FastAPI", "PostgreSQL"]
            result.matching_strategy = "baseline"
            return result

        with patch("happyrav.main.compute_match", side_effect=mock_compute_match):
            with patch("happyrav.services.llm_matching.extract_semantic_keywords", side_effect=Exception("LLM disabled")):
                # ACT: Call preview-match
                response = test_client.post(f"/api/session/{session_id}/preview-match")

        # ASSERT
        if response.status_code != 200:
            print(f"Error: {response.json()}")
        assert response.status_code == 200

        # Key assertion: compute_match received the EXACT job_ad_text from session
        assert captured_job_ad == job_ad, \
            f"compute_match should receive job_ad_text from session. Expected: {job_ad}, Got: {captured_job_ad}"

        # Verify CV text contains profile data (not job ad)
        assert "john doe" in captured_cv.lower(), "CV should contain profile name"
        assert "javascript" in captured_cv.lower() or "react" in captured_cv.lower(), \
            "CV should contain profile skills"
