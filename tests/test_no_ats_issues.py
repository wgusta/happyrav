"""Tests for ATS issues field removal.

Critical fix: MatchPayload no longer has ats_issues field.
Quality warnings used instead throughout the application.
"""
import pytest
from unittest.mock import patch, MagicMock
from happyrav.models import MatchPayload


class TestAtsIssuesRemoval:
    """Verify ats_issues field completely removed from codebase."""

    def test_match_payload_has_no_ats_issues_field(self):
        """MatchPayload model should not have ats_issues field."""
        # ARRANGE & ACT: Create MatchPayload instance
        match = MatchPayload(
            overall_score=75.0,
            category_scores={"skills_match": 80.0},
            matched_keywords=["Python", "FastAPI"],
            missing_keywords=["Docker"],
            quality_warnings=["Consider adding metrics"],
        )

        # ASSERT: ats_issues field should not exist
        assert not hasattr(match, "ats_issues"), \
            "MatchPayload should not have ats_issues field"

        # quality_warnings should exist instead
        assert hasattr(match, "quality_warnings"), \
            "MatchPayload should have quality_warnings field"
        assert match.quality_warnings == ["Consider adding metrics"]

    def test_preview_match_uses_quality_warnings_in_suggestions(self, test_client):
        """Suggestions should reference quality_warnings, not ats_issues."""
        # ARRANGE: Create session
        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp",
                "position_title": "Developer",
                "job_ad_text": "Looking for Python developer.",
                "consent_confirmed": True,
            },
        )
        assert response.status_code == 200
        session_id = response.json()["session_id"]

        # Preseed profile
        preseed_data = {
            "profile": {
                "full_name": "Jane Doe",
                "email": "jane@example.com",
                "skills": ["JavaScript"],  # Missing Python
                "experience": [
                    {
                        "role": "Developer",
                        "company": "WebCo",
                        "period": "2020-2023",
                        "achievements": ["Built apps"]
                    }
                ]
            }
        }
        response = test_client.post(f"/api/session/{session_id}/preseed", json=preseed_data)
        assert response.status_code == 200

        # Mock quality validation
        mock_quality = MagicMock()
        mock_quality.warnings = ["Low readability score", "Add more action verbs"]
        mock_quality.__dict__ = {
            "readability_score": 45.0,
            "fog_index": 14.0,
            "action_verb_ratio": 0.4,
            "quantification_ratio": 0.3,
            "avg_sentence_length": 22.0,
            "buzzword_count": 2,
            "section_balance_score": 60.0,
            "tense_consistency_score": 85.0,
            "warnings": ["Low readability score", "Add more action verbs"],
            "recommendations": []
        }

        with patch("happyrav.services.cv_quality.validate_cv_quality", return_value=mock_quality):
            with patch("happyrav.services.llm_matching.extract_semantic_keywords", side_effect=Exception("LLM disabled")):
                # ACT: Call preview-match with low score (triggers suggestions)
                response = test_client.post(f"/api/session/{session_id}/preview-match")

        # ASSERT
        assert response.status_code == 200
        data = response.json()

        # Suggestion should reference quality warnings if present
        suggestion = data.get("suggestion", "")

        # Should NOT mention "ATS issues" or "ats_issues"
        assert "ats" not in suggestion.lower() or "ats_compatibility" in suggestion.lower(), \
            f"Suggestion should not reference ATS issues. Got: {suggestion}"

        # If there are quality warnings, they should be referenced
        match = data["match"]
        if match.get("quality_warnings"):
            assert "quality" in suggestion.lower() or len(suggestion) == 0, \
                f"Suggestion should reference quality warnings. Got: {suggestion}"

    def test_preview_response_has_no_ats_issues_field(self, test_client):
        """Preview-match response should not include ats_issues in match object."""
        # ARRANGE: Create session with profile
        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp",
                "position_title": "Developer",
                "job_ad_text": "Python developer needed.",
                "consent_confirmed": True,
            },
        )
        session_id = response.json()["session_id"]

        preseed_data = {
            "profile": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "skills": ["Python"],
                "experience": [{"role": "Dev", "company": "Co", "period": "2020-2023", "achievements": ["Work"]}]
            }
        }
        response = test_client.post(f"/api/session/{session_id}/preseed", json=preseed_data)

        with patch("happyrav.services.cv_quality.validate_cv_quality", side_effect=Exception("Disabled")):
            with patch("happyrav.services.llm_matching.extract_semantic_keywords", side_effect=Exception("Disabled")):
                # ACT
                response = test_client.post(f"/api/session/{session_id}/preview-match")

        # ASSERT
        assert response.status_code == 200
        data = response.json()
        match = data["match"]

        # ats_issues should NOT be in response
        assert "ats_issues" not in match, \
            "Match response should not include ats_issues field"

        # quality_warnings should be present (even if empty)
        assert "quality_warnings" in match, \
            "Match response should include quality_warnings field"
