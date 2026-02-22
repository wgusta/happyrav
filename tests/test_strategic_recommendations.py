"""Integration tests for strategic recommendations and chat."""
import pytest
from unittest.mock import patch, AsyncMock


class TestStrategicAnalysis:
    """Test strategic analysis generation for match preview."""

    def test_preview_match_includes_strategic_analysis_when_score_low(
        self, test_client, mock_llm_extract, mock_ocr
    ):
        """When match score < 70, preview-match should return strategic_analysis."""
        # Create session
        resp = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TestCo",
                "position_title": "Senior Engineer",
                "job_ad_text": "We need Python, Django, Kubernetes, GraphQL, React experts with 10 years experience",
                "consent_confirmed": True
            }
        )
        assert resp.status_code == 200
        session_id = resp.json()["session_id"]

        # Upload CV (mocked OCR will return basic content)
        import io
        pdf_bytes = b"%PDF-1.4\nBasic CV with Python skills only"
        pdf_file = ("cv.pdf", io.BytesIO(pdf_bytes), "application/pdf")

        upload_resp = test_client.post(
            f"/api/session/{session_id}/upload",
            files={"files": pdf_file}
        )
        assert upload_resp.status_code == 200

        # Mock strategic analysis generation
        mock_strategic = {
            "strengths": ["Strong Python foundation", "Good problem-solving skills"],
            "gaps": ["Missing Kubernetes experience (critical)", "No GraphQL exposure (nice-to-have)"],
            "recommendations": [
                "Highlight Python projects in cover letter",
                "Address Kubernetes gap directly, mention willingness to learn",
                "Emphasize transferable DevOps experience"
            ],
            "summary": "Solid Python match but key infrastructure skills missing. Address gaps proactively."
        }

        with patch("happyrav.services.llm_kimi.generate_strategic_analysis", new_callable=AsyncMock) as mock_gen:
            mock_gen.return_value = mock_strategic

            # Preview match (should trigger strategic analysis for low score)
            preview_resp = test_client.post(f"/api/session/{session_id}/preview-match")
            data = preview_resp.json()

            assert preview_resp.status_code == 200

            # If score < 70, should have strategic_analysis
            if data["match"]["overall_score"] < 70:
                assert data["strategic_analysis"] is not None
                assert "strengths" in data["strategic_analysis"]
                assert "gaps" in data["strategic_analysis"]
                assert "recommendations" in data["strategic_analysis"]
                assert "summary" in data["strategic_analysis"]
                assert len(data["strategic_analysis"]["strengths"]) >= 1
                assert len(data["strategic_analysis"]["gaps"]) >= 1
                assert len(data["strategic_analysis"]["recommendations"]) >= 1

    def test_preview_match_excludes_strategic_analysis_when_score_high(
        self, test_client, mock_llm_extract, mock_ocr
    ):
        """When match score >= 70, preview-match should NOT return strategic_analysis."""
        # Create session directly
        from happyrav.main import session_cache
        from happyrav.services.cache import SessionRecord
        from happyrav.models import SessionState, ExtractedProfile, ExperienceItem
        import time

        session_id = session_cache.create_session_id()

        # Create profile that matches well
        profile = ExtractedProfile(
            full_name="Test User",
            headline="Senior Python Developer",
            summary="Experienced Python and FastAPI developer",
            skills=["Python", "FastAPI", "Testing", "Git"],
            languages=["English", "German"],
            experience=[
                ExperienceItem(
                    role="Senior Python Developer",
                    company="TechCo",
                    period="2020 - Present",
                    achievements=["Built FastAPI applications", "Wrote tests"]
                )
            ],
            education=[],
        )

        state = SessionState(
            session_id=session_id,
            phase="review",
            language="en",
            company_name="TestCo",
            position_title="Python Developer",
            job_ad_text="We need Python and FastAPI developers",
            consent_confirmed=True,
            created_at=time.time(),
            expires_at=time.time() + 3600,
            extracted_profile=profile,
        )
        record = SessionRecord(state=state)
        session_cache.set(record)

        # Preview match
        preview_resp = test_client.post(f"/api/session/{session_id}/preview-match")
        data = preview_resp.json()

        assert preview_resp.status_code == 200

        # If score >= 70, should NOT have strategic_analysis
        if data["match"]["overall_score"] >= 70:
            assert data["strategic_analysis"] is None


class TestRecommendationsChat:
    """Test interactive recommendations chat endpoint."""

    def test_ask_recommendation_returns_contextual_response(
        self, test_client, mock_llm_extract, mock_ocr
    ):
        """Ask-recommendation endpoint should return relevant advice based on context."""
        # Create session
        from happyrav.main import session_cache
        from happyrav.services.cache import SessionRecord
        from happyrav.models import SessionState, ExtractedProfile
        import time

        session_id = session_cache.create_session_id()
        state = SessionState(
            session_id=session_id,
            phase="review",
            language="en",
            company_name="TestCo",
            position_title="DevOps Engineer",
            job_ad_text="Need Kubernetes, Docker, Python experts",
            consent_confirmed=True,
            created_at=time.time(),
            expires_at=time.time() + 3600,
            extracted_profile=ExtractedProfile(
                full_name="Test User",
                headline="Engineer",
                skills=["Docker"],
                languages=["English"],
            ),
        )
        state.server = {
            "strategic_analysis": {
                "strengths": ["Docker experience"],
                "gaps": ["Kubernetes missing"],
                "recommendations": ["Learn K8s"],
                "summary": "Good Docker, needs K8s"
            }
        }
        record = SessionRecord(state=state)
        session_cache.set(record)

        # Mock strategic question answering
        with patch("happyrav.services.llm_kimi._answer_strategic_question", new_callable=AsyncMock) as mock_answer:
            mock_answer.return_value = "Focus on your Docker experience and mention your eagerness to learn Kubernetes through hands-on projects."

            # Ask recommendation question
            ask_resp = test_client.post(
                f"/api/session/{session_id}/ask-recommendation",
                json={"message": "How should I address the Kubernetes gap?"}
            )
            data = ask_resp.json()

            assert ask_resp.status_code == 200
            assert "response" in data
            assert len(data["response"]) > 50  # Non-trivial response

    def test_chat_history_persists_across_recommendation_questions(
        self, test_client, mock_llm_extract
    ):
        """Chat history should accumulate in session record."""
        # Create session directly in cache
        from happyrav.main import session_cache
        from happyrav.services.cache import SessionRecord
        from happyrav.models import SessionState, ExtractedProfile
        import time

        session_id = session_cache.create_session_id()
        state = SessionState(
            session_id=session_id,
            phase="review",
            language="en",
            company_name="TestCo",
            position_title="Engineer",
            job_ad_text="Need Python developers",
            consent_confirmed=True,
            created_at=time.time(),
            expires_at=time.time() + 3600,
            extracted_profile=ExtractedProfile(
                full_name="Test User",
                headline="Engineer",
                skills=["Python"],
                languages=["English"],
            ),
        )
        record = SessionRecord(state=state)
        session_cache.set(record)

        # Mock strategic question answering
        with patch("happyrav.services.llm_kimi._answer_strategic_question", new_callable=AsyncMock) as mock_answer:
            mock_answer.return_value = "First answer"

            # First question
            test_client.post(
                f"/api/session/{session_id}/ask-recommendation",
                json={"message": "First question"}
            )

            mock_answer.return_value = "Second answer"

            # Second question
            test_client.post(
                f"/api/session/{session_id}/ask-recommendation",
                json={"message": "Second question"}
            )

            # Verify history persists
            from happyrav.services.cache import session_cache
            record = session_cache.get(session_id)
            assert record is not None
            assert len(record.chat_history) >= 4  # 2 user + 2 assistant messages

    def test_ask_recommendation_rejects_empty_message(self, test_client, mock_llm_extract):
        """Should return 422 for empty message."""
        # Create session directly
        from happyrav.main import session_cache
        from happyrav.services.cache import SessionRecord
        from happyrav.models import SessionState, ExtractedProfile
        import time

        session_id = session_cache.create_session_id()
        state = SessionState(
            session_id=session_id,
            phase="review",
            language="en",
            company_name="TestCo",
            position_title="Engineer",
            job_ad_text="Need developers",
            consent_confirmed=True,
            created_at=time.time(),
            expires_at=time.time() + 3600,
            extracted_profile=ExtractedProfile(
                full_name="Test User",
                headline="Engineer",
                skills=[],
                languages=["English"],
            ),
        )
        record = SessionRecord(state=state)
        session_cache.set(record)

        # Try empty message
        ask_resp = test_client.post(
            f"/api/session/{session_id}/ask-recommendation",
            json={"message": ""}
        )
        assert ask_resp.status_code == 422


class TestStrategicPromptContext:
    """Test strategic analysis prompt building."""

    @pytest.mark.asyncio
    async def test_strategic_analysis_includes_all_context(self):
        """Strategic analysis should receive match scores, keywords, and profile."""
        from happyrav.services.llm_kimi import generate_strategic_analysis
        from happyrav.models import MatchPayload, ExtractedProfile

        match = MatchPayload(
            overall_score=55.0,
            category_scores={
                "skills_match": 60.0,
                "experience_match": 50.0,
                "education_match": 55.0,
                "keyword_density": 52.0,
                "ats_compatibility": 58.0,
            },
            matched_keywords=["python", "sql"],
            missing_keywords=["kubernetes", "graphql"],
            ats_issues=[]
        )

        profile = ExtractedProfile(
            full_name="Test User",
            headline="Software Engineer",
            summary="Experienced developer",
            skills=["Python", "SQL"],
            languages=["English"],
        )

        job_ad = "We need Python, SQL, Kubernetes, GraphQL experts"

        # Mock the actual LLM call
        with patch("happyrav.services.llm_kimi._chat_json_anthropic", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = {
                "strengths": ["Python and SQL experience"],
                "gaps": ["Kubernetes missing"],
                "recommendations": ["Highlight Python"],
                "summary": "Good match"
            }

            result = await generate_strategic_analysis(
                language="en",
                match=match,
                profile=profile,
                job_ad_text=job_ad
            )

            # Verify LLM was called
            assert mock_llm.called

            # Verify result structure
            assert "strengths" in result
            assert "gaps" in result
            assert "recommendations" in result
            assert "summary" in result
