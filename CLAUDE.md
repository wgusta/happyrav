# CLAUDE.md -- happyRAV

## What is this

Document-first ATS-optimized CV + cover letter generation wizard. Five-step flow: Start, Upload, Questions, Review, Result. Plus a stateless **CV Builder** (`/builder`) for direct-input CV creation without LLM. FastAPI backend, Jinja2 templates, WeasyPrint PDF rendering, multi-provider LLM (OpenAI + Anthropic + Google).

**Domain:** `happyrav.gusty.ch`

## Stack

- **Backend:** FastAPI, Pydantic v2, Python 3.12
- **Persistence:** Disk-backed pickle storage (`data/sessions`, `data/artifacts`, `data/documents`).
- **PDF:** WeasyPrint (needs system libs: pango, harfbuzz, freetype). Only used for Monster CV; wizard CV/cover letter serve HTML directly.
- **OCR:** GPT-5 Mini vision, PyMuPDF, pdfplumber
- **LLM:** Multi-provider: OpenAI (extraction/OCR/semantic matching), Anthropic Claude Sonnet 4.6 (generation with Swiss German calibration), Google Gemini (crosscheck, max mode only). Quality via `HAPPYRAV_QUALITY` env (balanced/max)
- **Semantic Matching:** LLM-based contextual CV-job alignment (GPT-4.1-mini). Hybrid scoring: 40% baseline regex + 60% semantic understanding. Detects transferable skills, contextual gaps, ranks skills by relevance.
- **Token Optimization:** Source documents injected via raw XML `<DOCUMENTS>` tags (no JSON escaping).
- **Outputs:** Wizard result: CV HTML/Markdown (no CV PDF buttons). Cover letter: HTML/Markdown + PDF fallback for email/download. Endpoint: `/api/result/{token}/cover-markdown`.
- **Frontend:** Vanilla JS, single `app.js` with inline i18n (EN/DE), no framework
- **Templates:** Jinja2 for pages (`templates/`) and PDF docs (`doc_templates/`)
- **Reverse proxy:** Caddy (auto HTTPS)
- **Deploy:** Docker Compose on Infomaniak VPS

## Project Structure

```
main.py                    # FastAPI app, all routes, OCR Caching, Strategic recommendations
models.py                  # Pydantic models (SessionState, ThemeConfig, ExperienceItem w/ start_month/end_month/description_html/achievements_html, EducationItem w/ learned_html, ExtractedProfile w/ hobbies)
services/
  cache.py                 # File-based persistent caches (Session/Artifact/Document)
  llm_kimi.py              # Multi-provider LLM: OpenAI extraction, Anthropic generation (Sonnet 4.6 + Swiss German system prompt), Gemini crosscheck, Strategic analysis
  llm_matching.py          # Semantic matching: keyword extraction, skill ranking, achievement scoring, gap detection (OpenAI GPT-4.1-mini)
  extract_documents.py     # File parsing (PDF, DOCX, images via vision OCR)
  scoring.py               # ATS match scoring via parser_scanner (baseline)
  question_engine.py       # Gap detection, missing questions builder
  templating.py            # HTML rendering, filename builder
  pdf_render.py            # WeasyPrint HTML to PDF
  emailer.py               # SMTP sending
  parsing.py               # Color/language helpers
doc_templates/             # Jinja2 PDF templates (3 CV + 3 cover letter variants + 4 builder CV templates)
templates/                 # Page fragments, wizard layout
  _page_builder.html       # CV Builder form page (direct-input, no LLM)
static/
  app.js                   # All frontend logic, i18n, state management, Strategic chat, CV Builder
  style.css                # App styles
data/                      # Persistent storage (sessions, artifacts, doc text cache)
tests/
  conftest.py              # Fixtures: test_client with cache reinitialization, temp_data_dir, mocks
  test_smoke_start_page.py # Smoke tests: Basic + Advanced profile intake flows
  test_integration.py      # Integration tests: OCR cache, disk persistence, truncation warnings
  test_semantic_matching_unit.py  # TDD tests: semantic matching with mocked LLM
  test_strategic_recommendations.py  # TDD tests: strategic analysis
  test_keyword_matching_fix.py     # TDD tests: job ad text sync to compute_match
  test_quality_preview.py           # TDD tests: quality metrics in preview endpoint
  test_no_ats_issues.py             # TDD tests: ATS-Probleme removal, quality_warnings replacement
  test_api_key_errors.py            # TDD tests: API key validation + error messaging
  test_builder_render.py            # TDD tests: builder render endpoint + markdown export (20 tests)
  test_builder_templates.py         # TDD tests: 4 builder templates rendering (20 tests)
```

## Key Patterns

### i18n
All UI text lives in `I18N` object inside `app.js` with `en` and `de` keys. HTML uses `data-i18n="key"` attributes. `t(key)` function resolves strings. Placeholders use `data-i18n-placeholder`. Always add both EN and DE keys.

### State Management
- Server: `SessionCache` (persistent pickle files), `ArtifactCache` (persistent), `DocumentCache` (MD5-based text store).
- Client: `localStorage` with key `happyrav_v4_state`, saved on every input change.
- `saveLocal()` / `restoreLocal()` handle persistence.
- `applyServerState(data)` syncs server response to UI.

### Theme System
`ThemeConfig` model with: `primary_hex`, `accent_hex`, `border_style`, `box_shadow`, `card_bg`, `page_bg`, `font_family`. All passed to Jinja2 doc templates as CSS custom properties (`--primary`, `--accent`, `--radius`, `--shadow`, `--panel`, `--page-bg`).

### Doc Templates
6 active wizard templates (simple/sophisticated/friendly x CV/cover letter) + 4 builder CV templates (green/cutset/business/freundlich). Each has inline CSS with `@page` rules for A4. Font selection via Jinja2 dict lookup (`font_css_map`, `font_import_map`). Skill levels parsed from "skill (level)" format.

### Token Economy
- **Source Injection:** Documents are concatenated with `\n\n` and wrapped in `<DOCUMENTS>...</DOCUMENTS>`. No `json.dumps()` of source text.
- **Context Limits:** 64k chars (Extraction), 48k chars (Generation). Explicit `llm_warning` returned if truncated.
- **OCR Cache:** `main.py` checks `document_cache` (MD5 of bytes) before calling `extract_text_from_bytes`.
- **Guardrails + Job Summary:** `preview-match` produces `job_summary` (LLM + baseline) saved on SessionState and passed into generation; generation/refinement prompts state “expert HR & CV designer, no fabrication, leave blanks if missing.”

### Semantic Matching
LLM-based contextual CV-job alignment replaces rigid regex matching:
- **Module:** `services/llm_matching.py` (OpenAI GPT-4.1-mini)
- **Functions:**
  - `extract_semantic_keywords()` - Job ad → keywords with alternatives/synonyms and criticality scores
  - `match_skills_semantic()` - CV skills + keywords → semantic match with transferable skills detection
  - `rank_skills_by_relevance()` - Rank CV skills by job relevance (0-1 scores)
  - `score_achievement_relevance()` - Score achievements, suggest metric-rich rewrites
  - `detect_contextual_gaps()` - Identify gaps with severity (critical/important/nice-to-have)
  - `merge_match_scores()` - Combine baseline + semantic scores (40/60 weighting)
- **Integration:**
  - **Preview-match:** Hybrid scoring with fallback to baseline on LLM errors
  - **Generation:** Pre-processes with skill ranking + achievement scoring, injects optimization hints into prompts
  - **Strategic analysis:** Enhanced with contextual gaps and transferable skills
- **Features:**
  - Synonym resolution: "React" matches "frontend framework"
  - Transferable skills: "SQL database design" matches "data modeling"
  - Gap substitutability: Identifies which gaps can be compensated
  - Achievement optimization: Flags vague achievements, suggests adding metrics
- **Cost:** ~$0.008 per match (GPT-4.1-mini)
- **Tests:** 6 unit tests with mocked LLM responses (`tests/test_semantic_matching_unit.py`)

### Swiss German Generation
CV/cover letter generation calibrated for Swiss job market:
- **System Prompt:** Language-specific via `_build_generation_system_prompt(language)` in `llm_kimi.py`
- **German (914 chars):** Schweizer Standarddeutsch, Swiss date formats (DD.MM.YYYY), Swiss terminology ("Arbeitgeber", "Arbeitnehmende"), cultural context (precision, multilingual, direct communication)
- **English (573 chars):** Swiss job market context, professional yet warm tone
- **Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6` in balanced mode, `claude-opus-4-5` in max mode)
- **Applied:** Both initial generation (`_generate_sync`) and refinement (`_refine_sync`)

### Smoke Tests
Automated visual tests for start page intake flows:
- **Basic Flow (`test_basic_intake_flow`):** Minimal required fields (company, position, job_ad, consent), verifies phase advancement to "upload", confirms empty profile
- **Advanced Flow (`test_advanced_profile_and_telos`):** Full profile via preseed (5 contact fields, 2 experience, 2 education, 5 skills, 3 languages) + 8 telos career goal fields
- **Visual Output:** Both tests print detailed summaries for manual inspection (session_id, profile data, telos context)
- **Fixtures:** `test_client` with cache reinitialization (fixes FileNotFoundError between tests), `temp_data_dir`, `mock_llm_extract`
- **File:** `tests/test_smoke_start_page.py` (7 tests pass: 2 smoke + 5 integration)

### CV Builder (Stateless)
Direct-input CV creation at `/builder`. No upload, no LLM, no sessions.
- **Route:** `GET /builder` serves form page, `POST /api/builder/render` returns HTML, `POST /api/builder/markdown` returns LLM-friendly Markdown
- **Data Model:** `CVData` in `models.py` with sub-models: `KPIItem`, `SkillItem`, `LanguageItem`, `ExperienceEntry`, `EducationEntry`, `CertificationItem`, `MilitaryItem`, `ProjectItem`, `ReferenceItem`
- **Templates:** 4 variants in `doc_templates/cv-builder-*.html.j2`:
  - `green`: Compact 11px, single-column cards, green #6B8E4E, Inter+Manrope
  - `cutset`: Dark red #9A2A2A, dark body bg, KPIs, visual skill tags, 2-col sidebar
  - `business`: Dark red, categorized skill grid, right-column education+certs+military
  - `freundlich`: Warm, ThemeConfig CSS vars, adapted from existing friendly
- **Frontend:** `_page_builder.html` with `<details>` sections, template selector, dynamic add/remove lists
- **JS:** `collectBuilderData()`, `saveBuilderLocal()`/`restoreBuilderLocal()` (localStorage key `happyrav_builder_v1`), preview (iframe srcdoc), download HTML, export/import JSON, export Markdown
- **Markdown Export:** Structured `.md` output with `# Name`, `## Section` headers, skill metadata `(level) [category]: description`, experience with `### Role | Company | Location`. Designed for LLM consumption to generate CVs.
- **PDF-ready:** All templates include `@page`, `@media print`, `break-inside: avoid`. Future `POST /api/builder/pdf` can pipe same HTML through WeasyPrint.
- **Tests:** 40 tests in `test_builder_render.py` (20) + `test_builder_templates.py` (20)

### Mini Rich Editor
Zero-dependency contentEditable rich text editor for experience/education fields:
- **Function:** `createMiniEditor(container, initialHtml, placeholder, onInput)` in `app.js`
- **Toolbar:** Bold, Italic, Underline, Bullet list, Numbered list
- **Sanitization:** `sanitizeEditorHtml()` strips scripts/iframes, allows only safe tags (b, i, u, strong, em, ul, ol, li, br, p)
- **Used in:** Experience rows (Stellenbeschrieb + Leistungen editors), Education rows (Learned editor)
- **Storage:** HTML string in `description_html`, `achievements_html`, `learned_html` model fields
- **LLM safety:** `stripHtmlTags()` converts to plain text before preseed (populates backward-compat `duties`/`successes`/`learned` fields)
- **CSS:** `.mini-editor-wrap`, `.mini-editor-toolbar`, `.mini-editor-content` in `style.css`

### Duration Split
Experience and education rows use separate month fields instead of single period text:
- **Fields:** `start_month` + `end_month` (format: MM/YYYY)
- **Period construction:** `buildPreseedFromUploadProfile()` joins as `"start – end"` for backward compat
- **CSS:** `.duration-row` grid (2 equal columns)

### Skill Level Free Text
Skill level uses `<input type="text">` with `<datalist>` suggestions (Expert, Advanced, Intermediate, Beginner) instead of `<select>` dropdown. Allows custom entries like "5+ Jahre", "Fortgeschritten".

### Strategic Recommendations
LLM-generated application advice when match score < 70:
- **Backend:** `generate_strategic_analysis()` in `llm_kimi.py` generates strengths, gaps, recommendations
- **Endpoint:** `POST /api/session/{session_id}/preview-match` includes `strategic_analysis` field
- **Chat:** `POST /api/session/{session_id}/ask-recommendation` for follow-up questions
- **Frontend:** Strategic accordion in Review page (after keyword comparison), interactive chat interface
- **Threshold:** `REVIEW_RECOMMEND_THRESHOLD = 70` in `main.py`
- **Cost:** ~$0.07 per analysis, ~$0.04 per chat message (Claude Sonnet)
- **Enhanced:** Now includes contextual gaps and transferable skills from semantic matching
- **i18n:** Full EN/DE support for all strategic UI text

## Deploy

**VPS:** 83.228.223.48, user `ubuntu`
**SSH key:** `~/.ssh/happyrav_rsa`

```bash
# Rsync and rebuild (excluding data/ to preserve server state if needed, though usually volume is better)
rsync -avz --exclude '__pycache__' --exclude '*.pyc' --exclude '.git' --exclude 'venv' --exclude '.env' --exclude 'data' \
  -e "ssh -i ~/.ssh/happyrav_rsa" \
  /Users/gusta/Projects/happyRAV/ ubuntu@83.228.223.48:~/ats-scanner/happyrav/

ssh -i ~/.ssh/happyrav_rsa ubuntu@83.228.223.48 \
  "cd ~/ats-scanner/happyrav && sudo docker compose up -d --build happyrav"
```

Docker compose file at `~/ats-scanner/happyrav/docker-compose.yml`. Build context is `..` (parent dir `ats-scanner/`). Dockerfile copies `happyrav/` into `/app/happyrav/`. **Ensure `data/` volume is mounted.**

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

## Recent Fixes (Feb 2026)

### Keyword Matching Fix
**Problem:** Preview-match was comparing CV against itself instead of job ad keywords.
**Fix:** Added `await syncIntake()` in `app.js` before preview API call to ensure job_ad_text syncs to server.
**Test:** `test_keyword_matching_fix.py` validates compute_match receives correct job_ad_text parameter.

### Quality Display in Preview
**Problem:** Quality metrics (Inhaltsoptimierung, Qualitätsanalyse) were empty in preview, only populated after generation.
**Fix:**
- Backend: Added quality_metrics computation + preview_comparison_sections to preview-match endpoint
- Frontend: Display quality accordions with show/hide logic based on data availability
- `cv_quality.py`: Made `generated` parameter optional to support preview mode
**Test:** `test_quality_preview.py` validates quality_metrics in preview response.

### ATS-Probleme Removal
**Problem:** Obsolete `ats_issues` field cluttering UI, not providing value.
**Fix:**
- Removed `ats_issues` from MatchPayload model
- Replaced with `quality_warnings` in suggestions, frontend display, result template
- Updated all references (main.py, scoring.py, app.js, _result.html)
**Test:** `test_no_ats_issues.py` (3 tests) validates complete removal + quality_warnings replacement.

### API Key Error Messaging
**Problem:** Unclear 503 errors when API keys missing.
**Fix:** Updated error message to mention environment variables + administrator contact.
**Test:** `test_api_key_errors.py` (3 tests) validates 503 status + helpful error messaging.

### UX Polish (Feb 2026)
- **Mini rich editor:** contentEditable with toolbar (B/I/U/bullets) for experience Stellenbeschrieb, Leistungen, education Learned fields
- **Duration split:** Separate start_month/end_month inputs replace single period text field
- **Skill level free text:** Datalist suggestions instead of rigid select dropdown
- **Hobbies field:** Replaces standalone achievements list; titled "only if relevant to job or early career"
- **Photo filename:** Shows uploaded filename with checkmark after successful upload
- **PDF dead code removal:** Removed `render_pdf()` from generate/chat/generate-cover endpoints (kept for Monster CV only)

## Gotchas

- `app.js` is large (~3200 lines). Both agents can edit it concurrently but watch for conflicts in shared sections. Builder code starts after `// ===== CV BUILDER =====` comment.
- **Persistence:** Deleting `data/` wipes all active sessions.
- **OCR Costs:** Testing image uploads consumes tokens unless the file is already in `data/documents`.
- **Truncation:** If a user uploads >64k chars, the `extraction_warning` field in `SessionState` will be populated. The UI should display this.
- **ATS Scoring:** Hybrid approach - 40% baseline (parser_scanner from `ats-scanner/app/scanners/`) + 60% semantic (LLM-based). Falls back to baseline if LLM unavailable.
- **Semantic matching costs:** ~$0.008 per preview-match (GPT-4.1-mini). All LLM calls have error handling with fallback to baseline.
- **Strategic analysis:** Only generated when match score < 70. High-scoring profiles skip this step to save costs.
