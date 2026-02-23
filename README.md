# happyRAV

Document-first ATS CV + cover letter app for `gusty.ch/happyrav`.

## What it does

- 3-phase wizard:
  - Phase 1: Document Intake + Extraction
  - Phase 2: Gap Questions + Clarification
  - Phase 3: Review + Template/Color + Generate
- Session auto-starts as soon as intake input is entered or documents are selected
- Separate optional profile-photo upload field
- Inputs: CV, cover letters, Arbeitszeugnisse, certificates, other documents
- OCR/text extraction:
  - PDF (`pdfplumber` + OCR fallback via `PyMuPDF` + `pytesseract`)
  - DOCX (`python-docx`)
  - image OCR (`pytesseract`, `deu+eng`)
- OpenAI extraction + generation (`OPENAI_API_KEY`, default model `gpt-4.1-mini`)
- Optional Codex OAuth token fallback (`~/.codex/auth.json`) when `OPENAI_API_KEY` is not set
- Templates: `simple`, `sophisticated`, `friendly` (+ advanced color options)
- Required gaps block generation (`422`) until resolved
- **Hybrid ATS Matching (40% baseline + 60% semantic):**
  - Semantic keyword extraction with alternatives/synonyms
  - Transferable skills detection (e.g., "React" → "frontend framework")
  - Contextual gap analysis with severity classification (critical/important/nice-to-have)
  - Skill ranking by job relevance (0-1 scores)
  - Achievement optimization with metric-rich rewrite suggestions
  - Fallback to baseline regex matching on LLM errors
- **Strategic recommendations:** LLM-generated application advice when match score < 70 (strengths, gaps, recommendations, transferable skills)
- **Interactive chat:** Ask follow-up questions about application strategy
- PDF generation from HTML templates via WeasyPrint
- Optional SMTP email with both generated PDFs

## Architecture & Reliability

- **Persistence:** Sessions and artifacts are saved to disk (`data/sessions`, `data/artifacts`) using pickle. The system is resilient to server restarts.
- **Token Efficiency:** Source documents are injected using raw `<DOCUMENTS>` XML tags to avoid JSON escaping overhead.
- **OCR Economy:** Uploaded files are hashed (MD5). If a file is re-uploaded (even in a new session), the system retrieves the extracted text/OCR result from `data/documents` instead of re-billing for Vision tokens.
- **Data Integrity:** Explicit truncation warnings if input exceeds 64k chars (extraction) or 48k chars (generation).
- **Semantic Matching:** Multi-provider LLM approach:
  - OpenAI GPT-4.1-mini for semantic keyword extraction, skill ranking, achievement scoring (~$0.008/match)
  - Anthropic Claude Sonnet 4.6 for CV/cover letter generation (Swiss German calibrated) and strategic analysis (~$0.07, only if score <70%)
  - Hybrid scoring: 40% baseline (regex) + 60% semantic (LLM) with graceful fallback

## API (v2)

- `POST /api/session/start`
- `POST /api/session/{session_id}/intake`
- `POST /api/session/{session_id}/upload`
- `POST /api/session/{session_id}/photo`
- `POST /api/session/{session_id}/extract`
- `POST /api/session/{session_id}/answer`
- `GET /api/session/{session_id}/state`
- `POST /api/session/{session_id}/preview-match` (includes strategic_analysis if score < 70)
- `POST /api/session/{session_id}/ask-recommendation` (interactive strategic chat)
- `POST /api/session/{session_id}/generate`
- `DELETE /api/session/{session_id}` (clear session)
- `GET /download/{token}/{file_id}`
- `POST /email`

## Limits

- max 20 documents / session
- max 12 MB / file
- max 25 MB / session
- Context Window: 64k chars (Extraction), 48k chars (Generation)

## Testing

Run integration tests:

```bash
# Install package in editable mode (first time only)
pip install -e .

# Run all tests
pytest tests/

# Run specific test
pytest tests/test_integration.py::TestOCRCache::test_same_file_uploaded_twice_uses_cache -v
```

Test coverage:
- **Smoke Tests:** Start page intake flows (basic + advanced profile with telos)
- **OCR Cache:** Duplicate file uploads use cached extraction
- **Disk Persistence:** Sessions/artifacts survive restarts
- **Truncation Warnings:** >64k (extraction), >48k (generation)
- **Strategic Recommendations:** Analysis generation, chat endpoint, score thresholds
- **Semantic Matching:** Keyword extraction, transferable skills, gap severity, hybrid scoring, skill ranking, achievement optimization (unit tests with mocked LLM)

Run tests:
```bash
# Smoke tests (visual output)
pytest tests/test_smoke_start_page.py -v -s

# All tests
pytest tests/ -v
```

## Run locally

```bash
cd /Users/gusta/4_Archive/ats-scanner
python3 -m venv .venv-happyrav
source .venv-happyrav/bin/activate
pip install -r happyrav/requirements.txt
export $(grep -v '^#' happyrav/.env.example | xargs)
uvicorn happyrav.main:app --reload --port 8010
```

Open:

- `http://localhost:8010/`

OAuth note:

- For local Codex desktop usage, keep `OPENAI_USE_CODEX_OAUTH=true` and leave `OPENAI_API_KEY` empty.
- If token scope is insufficient, set `OPENAI_API_KEY` explicitly.

## Run in Docker

```bash
cd /Users/gusta/4_Archive/ats-scanner
docker build -t happyrav -f happyrav/Dockerfile .
docker run --rm -p 8010:8000 \
  -e OPENAI_API_KEY=your_key \
  -e HAPPYRAV_PREFIX=/happyrav \
  -v $(pwd)/happyrav/data:/app/happyrav/data \
  happyrav
```

## Run behind `/happyrav`

```bash
cd /Users/gusta/4_Archive/ats-scanner/happyrav
docker compose up --build -d
```

Open:

- `http://localhost:8080/happyrav/`

## Reverse proxy

Route `/happyrav/*` to the container and forward headers.
App reads prefix from `HAPPYRAV_PREFIX`.

- Caddy: `/Users/gusta/4_Archive/ats-scanner/happyrav/Caddyfile`
- Caddy domain snippet: `/Users/gusta/4_Archive/ats-scanner/happyrav/Caddyfile.gusty.snippet`
- Nginx snippet: `/Users/gusta/4_Archive/ats-scanner/happyrav/nginx.happyrav.conf`
