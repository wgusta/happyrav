"""Integration tests for happyRAV persistence and caching."""
import io
from pathlib import Path

import pytest


class TestOCRCache:
    """Test DocumentCache prevents duplicate OCR calls."""

    def test_same_file_uploaded_twice_uses_cache(
        self, test_client, mock_llm_extract, mock_ocr
    ):
        """
        BEHAVIOR: When same file (by MD5) is uploaded twice,
        OCR is called once, cached result used on second upload.
        """
        # Create session with intake data
        resp = test_client.post(
            "/api/session/start",
            json={
                "language": "en",
                "company_name": "TestCo",
                "position_title": "Engineer",
                "job_ad_text": "We need Python developers",
                "consent_confirmed": True
            }
        )
        assert resp.status_code == 200
        session_id = resp.json()["session_id"]

        # Create test PDF bytes
        pdf_bytes = b"%PDF-1.4\nTest CV content for cache testing"
        pdf_file = ("cv.pdf", io.BytesIO(pdf_bytes), "application/pdf")

        # FIRST upload: should call OCR
        resp = test_client.post(
            f"/api/session/{session_id}/upload",
            files={"files": pdf_file}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["uploaded"]) == 1
        assert data["documents_total"] == 1
        assert mock_ocr.call_count == 1

        # SECOND upload: same bytes, should use cache, NO OCR call
        pdf_file_2 = ("cv_copy.pdf", io.BytesIO(pdf_bytes), "application/pdf")
        resp = test_client.post(
            f"/api/session/{session_id}/upload",
            files={"files": pdf_file_2}
        )
        assert resp.status_code == 200
        data2 = resp.json()
        assert len(data2["uploaded"]) == 1  # One file uploaded this time
        assert data2["documents_total"] == 2  # But now 2 total docs in session
        assert mock_ocr.call_count == 1  # Still only 1 call (cached!)


class TestDiskPersistence:
    """Test SessionCache and ArtifactCache persist to disk."""

    def test_session_survives_cache_reload(self, temp_data_dir, mock_llm_extract):
        """
        BEHAVIOR: SessionCache writes to disk. After creating new cache instance
        pointing to same directory, previously created session is still retrievable.
        """
        from happyrav.services.cache import SessionCache, SessionRecord
        from happyrav.models import SessionState
        import time

        # Create cache instance and session
        cache1 = SessionCache(ttl_seconds=3600)
        session_id = cache1.create_session_id()

        state = SessionState(
            session_id=session_id,
            phase="upload",
            language="en",
            company_name="PersistCo",
            position_title="Engineer",
            job_ad_text="Test job ad",
            consent_confirmed=True,
            created_at=time.time(),
            expires_at=time.time() + 3600,
        )
        record = SessionRecord(state=state)
        cache1.set(record)

        # Verify session exists in first cache
        retrieved1 = cache1.get(session_id)
        assert retrieved1 is not None
        assert retrieved1.state.company_name == "PersistCo"

        # Simulate restart: create NEW cache instance, same data dir
        cache2 = SessionCache(ttl_seconds=3600)

        # Session should still be retrievable from disk
        retrieved2 = cache2.get(session_id)
        assert retrieved2 is not None
        assert retrieved2.state.session_id == session_id
        assert retrieved2.state.company_name == "PersistCo"
        assert retrieved2.state.position_title == "Engineer"

    def test_artifact_survives_cache_reload(self, temp_data_dir):
        """
        BEHAVIOR: ArtifactCache writes to disk. After creating new cache instance,
        previously created artifacts are still retrievable.
        """
        from happyrav.services.cache import ArtifactCache
        from happyrav.models import ArtifactRecord, MatchPayload
        import time

        # Create cache and artifact
        cache1 = ArtifactCache(ttl_seconds=3600)
        token = cache1.create_token()

        match_payload = MatchPayload(
            overall_score=85.0,
            category_scores={
                "skills_match": 90.0,
                "experience_match": 80.0,
                "education_match": 85.0,
                "keyword_density": 88.0,
                "ats_compatibility": 82.0,
            },
            matched_keywords=["python", "testing"],
            missing_keywords=["aws"],
            ats_issues=[]
        )

        artifact = ArtifactRecord(
            token=token,
            filename_cv="test_cv.pdf",
            cv_pdf_bytes=b"fake pdf content",
            cv_html="<html>CV content</html>",
            match=match_payload,
            expires_at=time.time() + 3600
        )
        cache1.set(artifact)

        # Verify artifact exists
        retrieved1 = cache1.get(token)
        assert retrieved1 is not None
        assert retrieved1.filename_cv == "test_cv.pdf"

        # Simulate restart: new cache instance
        cache2 = ArtifactCache(ttl_seconds=3600)

        # Artifact should still be retrievable
        retrieved2 = cache2.get(token)
        assert retrieved2 is not None
        assert retrieved2.token == token
        assert retrieved2.filename_cv == "test_cv.pdf"
        assert retrieved2.cv_pdf_bytes == b"fake pdf content"
        assert retrieved2.match.overall_score == 85.0
        assert len(retrieved2.match.matched_keywords) == 2


class TestTruncationWarnings:
    """Test that extraction and generation return warnings when content exceeds limits."""

    @pytest.mark.asyncio
    async def test_extraction_warns_on_large_documents(self, mock_llm_extract):
        """
        BEHAVIOR: When source documents exceed 64k chars, extraction returns
        truncation warning in extraction_warning field.
        """
        from happyrav.services.llm_kimi import extract_profile_from_documents

        # Create source documents that exceed 64k chars
        large_doc = "X" * 65000  # 65k chars, exceeds 64k limit
        source_documents = [large_doc]

        # Extract profile
        profile, warning, debug = await extract_profile_from_documents(
            language="en",
            source_documents=source_documents
        )

        # Should have truncation warning
        assert warning is not None
        assert "truncat" in warning.lower()
        assert "64k" in warning or "64000" in warning

    @pytest.mark.asyncio
    async def test_generation_warns_on_large_documents(self, mock_llm_generate):
        """
        BEHAVIOR: When source documents exceed 48k chars, generation returns
        truncation warning.
        """
        from happyrav.services.llm_kimi import generate_content
        from happyrav.models import ExtractedProfile

        # Create large source documents (>48k chars)
        large_doc = "Y" * 50000  # 50k chars, exceeds 48k limit
        source_documents = [large_doc]

        profile = ExtractedProfile(
            full_name="Test User",
            headline="Engineer",
            summary="Summary",
            skills=["Python"],
            languages=["English"],
        )

        # Generate content
        content, warning = await generate_content(
            language="en",
            job_ad_text="We need Python developers",
            profile=profile,
            source_documents=source_documents
        )

        # Should have truncation warning
        assert warning is not None
        assert "truncat" in warning.lower()
        assert "48k" in warning or "48000" in warning
