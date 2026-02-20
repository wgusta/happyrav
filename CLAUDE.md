# CLAUDE.md -- happyRAV

## What is this

Document-first ATS-optimized CV + cover letter generation wizard. Five-step flow: Start, Upload, Questions, Review, Result. FastAPI backend, Jinja2 templates, WeasyPrint PDF rendering, multi-provider LLM (OpenAI + Anthropic + Google).

**Domain:** `happyrav.gusty.ch`

## Stack

- **Backend:** FastAPI, Pydantic v2, Python 3.12
- **PDF:** WeasyPrint (needs system libs: pango, harfbuzz, freetype)
- **OCR:** GPT-5 Mini vision, PyMuPDF, pdfplumber
- **LLM:** Multi-provider: OpenAI (extraction/OCR), Anthropic Claude (generation), Google Gemini (crosscheck, max mode only). Quality via `HAPPYRAV_QUALITY` env (balanced/max)
- **Frontend:** Vanilla JS, single `app.js` with inline i18n (EN/DE), no framework
- **Templates:** Jinja2 for pages (`templates/`) and PDF docs (`doc_templates/`)
- **Reverse proxy:** Caddy (auto HTTPS)
- **Deploy:** Docker Compose on Infomaniak VPS

## Project Structure

```
main.py                    # FastAPI app, all routes
models.py                  # Pydantic models (SessionState, ThemeConfig, etc.)
services/
  cache.py                 # In-memory SessionCache, ArtifactCache
  llm_kimi.py              # Multi-provider LLM: OpenAI extraction, Anthropic generation, Gemini crosscheck
  extract_documents.py     # File parsing (PDF, DOCX, images via vision OCR)
  scoring.py               # ATS match scoring via parser_scanner
  question_engine.py       # Gap detection, missing questions builder
  templating.py            # HTML rendering, filename builder
  pdf_render.py            # WeasyPrint HTML to PDF
  emailer.py               # SMTP sending
  parsing.py               # Color/language helpers
doc_templates/             # Jinja2 PDF templates (3 CV + 3 cover letter variants)
templates/                 # Page fragments, wizard layout
static/
  app.js                   # All frontend logic, i18n, state management
  style.css                # App styles
```

## Key Patterns

### i18n
All UI text lives in `I18N` object inside `app.js` with `en` and `de` keys. HTML uses `data-i18n="key"` attributes. `t(key)` function resolves strings. Placeholders use `data-i18n-placeholder`. Always add both EN and DE keys.

### State Management
- Server: `SessionCache` (dict keyed by session_id), `ArtifactCache` (keyed by token)
- Client: `localStorage` with key `happyrav_v4_state`, saved on every input change
- `saveLocal()` / `restoreLocal()` handle persistence
- `applyServerState(data)` syncs server response to UI

### Theme System
`ThemeConfig` model with: `primary_hex`, `accent_hex`, `border_style`, `box_shadow`, `card_bg`, `page_bg`, `font_family`. All passed to Jinja2 doc templates as CSS custom properties (`--primary`, `--accent`, `--radius`, `--shadow`, `--panel`, `--page-bg`).

### Doc Templates
6 active templates (simple/sophisticated/friendly x CV/cover letter). Each has inline CSS with `@page` rules for A4. Font selection via Jinja2 dict lookup (`font_css_map`, `font_import_map`). Skill levels parsed from "skill (level)" format.

### ROOT_PATH
`HAPPYRAV_PREFIX` env var for reverse proxy sub-path support. All JS endpoints use `endpoint(path)` which prepends `rootPath`.

## Deploy

**VPS:** 83.228.223.48, user `ubuntu`
**SSH key:** `~/.ssh/happyrav_rsa`

```bash
# Rsync and rebuild
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' --exclude 'venv' --exclude '.env' \
  -e "ssh -i ~/.ssh/happyrav_rsa" \
  /Users/gusta/Projects/happyRAV/ ubuntu@83.228.223.48:~/ats-scanner/happyrav/

ssh -i ~/.ssh/happyrav_rsa ubuntu@83.228.223.48 \
  "cd ~/ats-scanner/happyrav && sudo docker compose up -d --build happyrav"
```

Docker compose file at `~/ats-scanner/happyrav/docker-compose.yml`. Build context is `..` (parent dir `ats-scanner/`). Dockerfile copies `happyrav/` into `/app/happyrav/`.

## Dev

```bash
cd /Users/gusta/Projects/happyRAV
# Needs OPENAI_API_KEY + ANTHROPIC_API_KEY in .env
uvicorn happyrav.main:app --reload --port 8000
```

Syntax checks:
```bash
python3 -c "import ast; ast.parse(open('main.py').read()); print('OK')"
python3 -c "import ast; ast.parse(open('models.py').read()); print('OK')"
node --check static/app.js
```

## Env Vars

| Var | Purpose |
|-----|---------|
| `OPENAI_API_KEY` | OpenAI API key (extraction, OCR) |
| `ANTHROPIC_API_KEY` | Anthropic API key (generation) |
| `GOOGLE_API_KEY` | Google AI key (crosscheck, max mode only) |
| `HAPPYRAV_QUALITY` | Quality mode: `balanced` (default) or `max` |
| `OPENAI_BASE_URL` | Custom OpenAI base URL |
| `HAPPYRAV_PREFIX` | URL prefix for reverse proxy |
| `HAPPYRAV_CACHE_TTL` | Session TTL seconds (default: 600) |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Email sending |

## Gotchas

- `app.js` is large (~1800 lines). Both agents can edit it concurrently but watch for conflicts in shared sections (DOM refs, saveLocal, restoreLocal, event binding array, generate payload)
- `node -c` for syntax check needs file path, not stdin via `$(cat ...)`
- Doc templates duplicate font maps inline (Jinja2 dicts). If adding a font, update all 6 templates plus `models.py` FONT_FAMILY_CSS/FONT_IMPORT_URL
- `sudo docker` required on VPS (docker not in ubuntu group)
- Build context for Dockerfile is parent dir (`ats-scanner/`), so paths in Dockerfile use `happyrav/` prefix
- ATS scoring uses shared `parser_scanner` from `ats-scanner/app/scanners/`
- LLM fallback: if Anthropic generation fails, falls back to local content builder. Extraction fallback returns None profile. Warning messages need both EN and DE translations in `llm_kimi.py`
- Cover letter templates use `content.cover_greeting`, `cover_opening`, `cover_body` (list), `cover_closing`
- Skills format: `"Python (Expert)"` parsed via `skill.split(' (')` in templates

## API Endpoints

Key routes (all prefixed with ROOT_PATH):
- `POST /api/session` -- create session
- `PATCH /api/session/{id}/intake` -- update company/position/jobad
- `POST /api/session/{id}/upload` -- upload documents
- `POST /api/session/{id}/paste` -- paste text as document
- `POST /api/session/{id}/extract` -- trigger LLM extraction
- `POST /api/session/{id}/answers` -- submit question answers
- `POST /api/session/{id}/generate` -- generate CV + cover letter
- `GET /api/result/{token}/cv` -- download CV PDF
- `GET /api/result/{token}/cover` -- download cover letter PDF
- `GET /api/result/{token}/comparison` -- lazy-loaded comparison table
- `GET /api/session/{id}/state` -- full session state
