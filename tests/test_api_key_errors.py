"""Tests for API key validation and error messaging.

Critical fix: Generate endpoint returns clear 503 error when API keys missing,
with helpful message about environment variables.
"""
import pytest
from unittest.mock import patch
import os


class TestApiKeyValidation:
    """Verify API key validation and error messages."""

    def test_generate_returns_503_without_api_keys(self, test_client):
        """Generate endpoint should return 503 when API keys not configured."""
        # ARRANGE: Create session with profile
        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp",
                "position_title": "Developer",
                "job_ad_text": "Python developer.",
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

        # Mock has_api_key to return False
        with patch("happyrav.main.has_api_key", return_value=False):
            # ACT: Try to generate CV
            response = test_client.post(
                f"/api/session/{session_id}/generate",
                json={
                    "template_id": "simple_cv",
                    "primary_color": "#1F5AA8",
                    "accent_color": "#173A73",
                    "border_style": "rounded",
                    "box_shadow": True,
                    "card_bg": "#ffffff",
                    "page_bg": "#ffffff",
                    "font_family": "inter"
                }
            )

        # ASSERT
        assert response.status_code == 503, \
            "Generate should return 503 when API keys missing"

        error_detail = response.json()["detail"]

        # Error message should be clear and helpful
        assert "API keys not configured" in error_detail, \
            f"Error should mention API keys. Got: {error_detail}"
        assert "OPENAI_API_KEY" in error_detail or "environment variable" in error_detail, \
            f"Error should mention environment variables. Got: {error_detail}"

    def test_error_message_mentions_environment_variables(self, test_client):
        """Error message should be helpful and mention environment variables."""
        # ARRANGE: Session
        response = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TechCorp",
                "position_title": "Developer",
                "job_ad_text": "Python developer.",
                "consent_confirmed": True,
            },
        )
        session_id = response.json()["session_id"]

        preseed_data = {
            "profile": {
                "full_name": "John Doe",
                "skills": ["Python"],
                "experience": [{"role": "Dev", "company": "Co", "period": "2020-2023", "achievements": ["Work"]}]
            }
        }
        test_client.post(f"/api/session/{session_id}/preseed", json=preseed_data)

        # ACT: Try generate without keys
        with patch("happyrav.main.has_api_key", return_value=False):
            response = test_client.post(
                f"/api/session/{session_id}/generate",
                json={"template_id": "simple_cv"}
            )

        # ASSERT: Clear, helpful error message
        assert response.status_code == 503
        detail = response.json()["detail"]

        # Should mention both the problem and the solution
        assert "environment variable" in detail.lower(), \
            f"Should mention environment variables. Got: {detail}"
        assert "openai" in detail.lower() or "anthropic" in detail.lower(), \
            f"Should mention specific API keys. Got: {detail}"
        assert "administrator" in detail.lower() or "contact" in detail.lower(), \
            f"Should suggest who to contact. Got: {detail}"

    def test_has_api_key_validation_logic(self):
        """Verify has_api_key() checks for required environment variables."""
        from happyrav.main import has_api_key

        # Mock codex token loader to avoid fallback auth
        with patch("happyrav.services.llm_kimi._load_codex_oauth_token", return_value=None):
            # Test with both keys present
            with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key", "ANTHROPIC_API_KEY": "test-key"}):
                assert has_api_key() is True, "Should return True when both keys present"

            # Test with missing OPENAI_API_KEY
            with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}, clear=True):
                assert has_api_key() is False, "Should return False when OPENAI_API_KEY missing"

            # Test with missing ANTHROPIC_API_KEY
            with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=True):
                assert has_api_key() is False, "Should return False when ANTHROPIC_API_KEY missing"

            # Test with both missing
            with patch.dict(os.environ, {}, clear=True):
                assert has_api_key() is False, "Should return False when both keys missing"
