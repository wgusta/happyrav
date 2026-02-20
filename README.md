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
- ATS score + missing keywords + ATS issues in review and result
- PDF generation from HTML templates via WeasyPrint
- Optional SMTP email with both generated PDFs
- Ephemeral only:
  - in-memory session cache with TTL
  - in-memory artifact cache with TTL
  - no DB persistence

## API (v2)

- `POST /api/session/start`
- `POST /api/session/{session_id}/intake`
- `POST /api/session/{session_id}/upload`
- `POST /api/session/{session_id}/photo`
- `POST /api/session/{session_id}/extract`
- `POST /api/session/{session_id}/answer`
- `GET /api/session/{session_id}/state`
- `POST /api/session/{session_id}/generate`
- `DELETE /api/session/{session_id}` (clear session)
- `GET /download/{token}/{file_id}`
- `POST /email`

## Limits

- max 20 documents / session
- max 12 MB / file
- max 25 MB / session

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
