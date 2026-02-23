"""Tests for quality metrics and preview sections in preview-match endpoint.

Critical fix: Preview-match response must include quality_metrics and
preview_comparison_sections so frontend can display them before generation.
"""
import pytest
from unittest.mock import patch, MagicMock


class TestQualityInPreview:
    """Verify quality data included in preview response."""

    def test_preview_response_includes_quality_metrics(self, test_client):
        """Preview-match response should include quality_metrics field."""
        # ARRANGE: Create session with profile
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
                "skills": ["Python", "Django"],
                "experience": [
                    {
                        "role": "Developer",
                        "company": "TechCo",
                        "period": "2020-2023",
                        "achievements": ["Built apps"]
                    }
                ]
            }
        }
        response = test_client.post(f"/api/session/{session_id}/preseed", json=preseed_data)
        assert response.status_code == 200

        # Mock quality validation to return successful result
        mock_quality = MagicMock()
        mock_quality.readability_score = 65.0
        mock_quality.fog_index = 12.5
        mock_quality.action_verb_ratio = 0.7
        mock_quality.quantification_ratio = 0.5
        mock_quality.avg_sentence_length = 18.0
        mock_quality.buzzword_count = 1
        mock_quality.section_balance_score = 75.0
        mock_quality.tense_consistency_score = 90.0
        mock_quality.warnings = ["Sample warning"]
        mock_quality.recommendations = ["Sample recommendation"]
        mock_quality.__dict__ = {
            "readability_score": 65.0,
            "fog_index": 12.5,
            "action_verb_ratio": 0.7,
            "quantification_ratio": 0.5,
            "avg_sentence_length": 18.0,
            "buzzword_count": 1,
            "section_balance_score": 75.0,
            "tense_consistency_score": 90.0,
            "warnings": ["Sample warning"],
            "recommendations": ["Sample recommendation"]
        }

        # Mock LLM calls (patch at module level since it's imported inside the function)
        with patch("happyrav.services.cv_quality.validate_cv_quality", return_value=mock_quality):
            with patch("happyrav.services.llm_matching.extract_semantic_keywords", side_effect=Exception("LLM disabled")):
                # ACT: Call preview-match
                response = test_client.post(f"/api/session/{session_id}/preview-match")

        # ASSERT
        assert response.status_code == 200
        data = response.json()

        # Verify quality_metrics exists in match
        assert "match" in data, "Response should include match field"
        match = data["match"]

        assert "quality_metrics" in match, "Match should include quality_metrics"
        quality_metrics = match["quality_metrics"]

        # Verify quality_metrics has expected fields
        assert quality_metrics is not None, "quality_metrics should not be None"
        assert "readability_score" in quality_metrics, "Should include readability_score"
        assert "fog_index" in quality_metrics, "Should include fog_index"
        assert "action_verb_ratio" in quality_metrics, "Should include action_verb_ratio"
        assert "warnings" in quality_metrics, "Should include warnings list"
