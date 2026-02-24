"""Pytest fixtures for happyRAV integration tests."""
import os
import shutil
import sys
import tempfile
from pathlib import Path
from typing import Generator
from unittest.mock import MagicMock, patch

import pytest

# Mock external dependencies before any imports
sys.modules['app'] = MagicMock()
sys.modules['app.scanners'] = MagicMock()
sys.modules['app.scanners.parser_scanner'] = MagicMock()


from fastapi.testclient import TestClient


@pytest.fixture(scope="function", autouse=True)
def temp_data_dir(monkeypatch) -> Generator[Path, None, None]:
    """Create temporary data directory for test isolation."""
    temp_dir = Path(tempfile.mkdtemp(prefix="happyrav_test_"))
    (temp_dir / "sessions").mkdir()
    (temp_dir / "artifacts").mkdir()
    (temp_dir / "documents").mkdir()

    # Patch DATA_DIR before any imports happen
    from happyrav.services import cache as cache_module
    monkeypatch.setattr(cache_module, "DATA_DIR", temp_dir)

    yield temp_dir

    # Cleanup
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def test_client(temp_data_dir: Path) -> TestClient:
    """Create FastAPI test client with temp data dir."""
    # Set env vars
    os.environ["OPENAI_API_KEY"] = "test-key-openai"
    os.environ["ANTHROPIC_API_KEY"] = "test-key-anthropic"
    os.environ["HAPPYRAV_QUALITY"] = "balanced"

    # Import app AFTER patching DATA_DIR
    from happyrav import main
    from happyrav.services.cache import SessionCache, ArtifactCache, DocumentCache

    # Reinitialize caches with new temp directory
    main.session_cache = SessionCache(ttl_seconds=3600)
    main.artifact_cache = ArtifactCache()
    main.document_cache = DocumentCache()

    return TestClient(main.app)


@pytest.fixture
def mock_llm_extract():
    """Mock OpenAI extraction call."""
    with patch("happyrav.services.llm_kimi._chat_json_openai") as mock:
        mock.return_value = {
            "full_name": "Test User",
            "headline": "Software Engineer",
            "contact": {"email": "test@example.com", "phone": "123-456-7890"},
            "languages": ["English", "German"],
            "skills": ["Python", "FastAPI"],
            "summary": "Experienced developer",
            "experience": [],
            "education": []
        }
        yield mock


@pytest.fixture
def mock_llm_generate():
    """Mock Anthropic generation call."""
    with patch("happyrav.services.llm_kimi._chat_json_anthropic") as mock:
        mock.return_value = {
            "summary": "Generated summary",
            "skills": ["Python", "Testing"],
            "experience": [],
            "education": [],
            "cover_greeting": "Dear Hiring Manager",
            "cover_opening": "I am writing to apply...",
            "cover_body": ["First paragraph", "Second paragraph"],
            "cover_closing": "Sincerely",
            "matched_keywords": ["python", "testing"]
        }
        yield mock


@pytest.fixture
def mock_ocr():
    """Mock document OCR/extraction at point of use in main.py."""
    with patch("happyrav.main.extract_text_from_bytes") as mock:
        mock.return_value = ("Extracted CV text content", "pdf_text", 0.95)
        yield mock


@pytest.fixture
def sample_cv_data() -> dict:
    """Full CVData dict for builder tests."""
    return {
        "language": "de",
        "template_id": "green",
        "full_name": "Max Muster",
        "headline": "Software Engineer",
        "address": "Bahnhofstrasse 1, 8001 Zürich",
        "email": "max@example.com",
        "phone": "+41 79 123 45 67",
        "linkedin": "linkedin.com/in/maxmuster",
        "portfolio": "maxmuster.ch",
        "github": "github.com/maxmuster",
        "birthdate": "01.01.1990",
        "photo_data_url": "data:image/png;base64,iVBORw0KGgo=",
        "kpis": [
            {"value": "10+", "label": "Jahre Erfahrung"},
            {"value": "5", "label": "Sprachen"},
        ],
        "summary": "Erfahrener Software Engineer mit Fokus auf Web-Applikationen.",
        "skills": [
            {"name": "Python", "level": "Expert", "description": "FastAPI, Django", "category": "Backend"},
            {"name": "TypeScript", "level": "Advanced", "description": "React, Next.js", "category": "Frontend"},
            {"name": "SQL", "level": "Advanced", "description": "PostgreSQL, MySQL", "category": "Data"},
        ],
        "languages": [
            {"language": "Deutsch", "proficiency": "Muttersprache"},
            {"language": "English", "proficiency": "C2"},
        ],
        "experience": [
            {
                "role": "Senior Developer",
                "company": "Tech AG",
                "location": "Zürich",
                "period": "2020 – Heute",
                "achievements": ["Led team of 5", "Shipped 3 products"],
            },
            {
                "role": "Junior Developer",
                "company": "Startup GmbH",
                "location": "Baden",
                "period": "2018 – 2020",
                "achievements": ["Built REST APIs"],
            },
        ],
        "education": [
            {"degree": "MSc Computer Science", "school": "ETH Zürich", "period": "2016 – 2018"},
            {"degree": "BSc Informatik", "school": "ZHAW", "period": "2013 – 2016"},
        ],
        "certifications": [
            {"name": "AWS Solutions Architect", "issuer": "Amazon", "date": "2023"},
        ],
        "military": [
            {"rank": "Leutnant", "period": "2016 – 2020", "description": "Zugführer Infanterie"},
        ],
        "projects": [
            {"name": "Open Source Tool", "description": "CLI for data processing", "url": "https://github.com/example"},
        ],
        "references": [
            {"quote": "Excellent engineer", "name": "Jane Doe", "title": "CTO, Tech AG", "contact": "079 123 45 67"},
        ],
        "references_on_request": False,
    }


@pytest.fixture
def minimal_cv_data() -> dict:
    """Minimal CVData dict for builder tests."""
    return {
        "language": "de",
        "template_id": "green",
        "full_name": "Test User",
        "headline": "Developer",
        "summary": "A developer.",
        "experience": [
            {"role": "Dev", "company": "Co", "period": "2020 – 2024", "achievements": ["Did stuff"]},
        ],
        "education": [
            {"degree": "BSc", "school": "Uni", "period": "2016 – 2020"},
        ],
    }
