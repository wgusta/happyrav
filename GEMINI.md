# GEMINI.md -- happyRAV Context

## Project Overview
happyRAV is a document-first CV/Cover Letter wizard. It emphasizes high-quality extraction from PDF/Images (using GPT-5 Vision) and structured rewriting (using Claude Sonnet 4.6 with Swiss German calibration).

## Forensic Audit Status (Feb 2026)
**BRIAN ROEMMELE DEEP TRUTH MODE (v37.9001)** Audit Completed.
Result: **Hardened Chassis**.

### Critical Upgrades Implemented
1.  **Persistence Pillar:**
    *   **Old:** In-memory `dict` (lost on restart).
    *   **New:** `services/cache.py` uses `pickle` + `lock` to save sessions to `data/sessions/` and artifacts to `data/artifacts/`.
    *   **Action:** Never modify `cache.py` to revert to memory-only without explicit reason.

2.  **Token Efficiency Pillar:**
    *   **Old:** `json.dumps(source_blob)` inside the JSON payload (Double Escaping).
    *   **New:** `<DOCUMENTS>
{raw_text}
</DOCUMENTS>` XML injection.
    *   **Action:** When modifying prompts in `llm_kimi.py`, maintain this XML tagging pattern. Do NOT put large text blobs inside JSON values.

3.  **Data Integrity Pillar:**
    *   **Old:** Silent truncation at 28k chars.
    *   **New:** Context limit raised to 64k (Extraction) / 48k (Generation). Returns `(content, warning)` tuple.
    *   **Action:** Always propagate `warning` strings to the frontend `SessionState`.

4.  **OCR Economy Pillar:**
    *   **Old:** Re-running Vision API on every upload/page reload.
    *   **New:** `main.py` calculates MD5 hash of uploads. Checks persistent `DocumentCache` (`data/documents/`) before calling extraction.

5.  **Semantic Matching Pillar (Feb 2026):**
    *   **Old:** Rigid regex keyword matching via `parser_scanner` (baseline only).
    *   **New:** Hybrid approach - 40% baseline (regex) + 60% semantic (LLM contextual understanding).
    *   **Module:** `services/llm_matching.py` (OpenAI GPT-4.1-mini).
    *   **Features:**
        - Synonym resolution: "React" matches "frontend framework"
        - Transferable skills: "SQL" matches "data modeling"
        - Contextual gaps: Severity classification (critical/important/nice-to-have)
        - Skill ranking: 0-1 relevance scores for CV skills
        - Achievement optimization: Flags vague achievements, suggests metric-rich rewrites
    *   **Integration:** `preview-match` endpoint uses hybrid scoring. `generate_content()` pre-processes with skill ranking.
    *   **Fallback:** Gracefully falls back to baseline regex if LLM unavailable.
    *   **Cost:** ~$0.008 per match (GPT-4.1-mini).
    *   **Action:** Do NOT remove baseline matching. It's the fallback for reliability.

6.  **Strategic Guidance Pillar (Feb 2026):**
    *   **Feature:** LLM-generated application advice when match score < 70.
    *   **Backend:** `generate_strategic_analysis()` in `llm_kimi.py` generates strengths, gaps, actionable recommendations.
    *   **Chat:** `ask-recommendation` endpoint allows interactive Q&A about application strategy.

7.  **Quality in Preview Pillar (Feb 2026):**
    *   **Old:** Quality metrics (Inhaltsoptimierung, Qualitätsanalyse) only available after generation.
    *   **New:** Preview-match endpoint computes quality_metrics + preview_comparison_sections.
    *   **Fix:** `cv_quality.py` now accepts `generated=None` for preview mode validation.
    *   **Action:** Frontend displays quality accordions in preview with show/hide logic based on data.

8.  **Data Model Cleanup (Feb 2026):**
    *   **Removed:** Obsolete `ats_issues` field from MatchPayload model.
    *   **Replaced:** All references now use `quality_warnings` instead.
    *   **Impact:** Cleaner UI, better UX with actionable quality feedback.
    *   **Test Coverage:** `test_no_ats_issues.py` validates complete removal.

9.  **Keyword Matching Sync Fix (Feb 2026):**
    *   **Bug:** Preview-match was comparing CV against itself (CV self-comparison).
    *   **Root Cause:** Frontend didn't sync job_ad_text to server before calling preview API.
    *   **Fix:** Added `await syncIntake()` in `app.js` previewMatch() function.
    *   **Test Coverage:** `test_keyword_matching_fix.py` validates correct job_ad_text parameter passing.
10. **Job Summary + Output Shift (Feb 2026):**
    * **Job Summary:** `preview-match` now produces `job_summary` (LLM + baseline) stored in `SessionState.job_summary`, shown in review/result, fed into generation match_context.
    * **Guardrails:** Generation/refinement prompts explicitly “expert HR & CV designer”, “no fabrication; leave blanks if absent”.
    * **Outputs:** Result UI now offers CV HTML/Markdown only; cover letters provide HTML/Markdown with PDF fallback (email/download). New endpoint: `GET /api/result/{token}/cover-markdown`.

### Test Suite (Feb 2026)
**Comprehensive TDD coverage** for production fixes:
- `test_keyword_matching_fix.py` - Job ad text sync validation
- `test_quality_preview.py` - Quality metrics in preview endpoint
- `test_no_ats_issues.py` - ATS-Probleme removal (3 tests)
- `test_api_key_errors.py` - API key validation + error messaging (3 tests)

**Total:** 8 tests, all passing. Integration-style tests through public APIs with minimal mocking.
    *   **Enhanced:** Now includes contextual gaps and transferable skills from semantic matching.
    *   **Cost Control:** Only triggered for low-scoring profiles (< 70%). High scores skip to save tokens.
    *   **Frontend:** Accordion UI in Review page + chat interface for follow-up questions.
    *   **Action:** Do NOT generate strategic analysis for high scores (>= 70). Threshold: `REVIEW_RECOMMEND_THRESHOLD = 70`.

7.  **Swiss German Generation Pillar (Feb 2026):**
    *   **Old:** Generic JSON-only system prompt for all languages.
    *   **New:** Language-specific system prompts via `_build_generation_system_prompt(language)` in `llm_kimi.py`.
    *   **German:** Schweizer Standarddeutsch, Swiss date formats (DD.MM.YYYY), Swiss terminology, cultural calibration (precision, multilingual context, direct communication).
    *   **English:** Swiss job market context, professional yet warm tone.
    *   **Model:** Claude Sonnet 4.6 (`claude-sonnet-4-6` balanced, `claude-opus-4-5` max).
    *   **Action:** Maintain separate system prompts for DE/EN. Do NOT merge into generic prompt.

8.  **Smoke Testing Pillar (Feb 2026):**
    *   **Old:** Manual testing, no automated intake flow validation.
    *   **New:** `tests/test_smoke_start_page.py` with 2 comprehensive smoke tests.
    *   **Tests:**
        - **Basic Flow:** Minimal intake (company, position, job_ad, consent), verifies phase advancement, empty profile.
        - **Advanced Flow:** Full preseed profile (5 contact, 2 experience, 2 education, 5 skills, 3 languages) + 8 telos fields.
    *   **Visual Output:** Detailed summaries for manual inspection (session_id, profile, telos).
    *   **Fixtures:** `test_client` with cache reinitialization fix (prevents FileNotFoundError), `temp_data_dir`, mocks.
    *   **Action:** Run `pytest tests/test_smoke_start_page.py -v -s` for visual verification before deploy.

## Operational Mandates
1.  **Do Not regress to volatile storage.** The `data/` directory is the source of truth.
2.  **Respect the `.gitignore`.** `data/` must not be committed.
3.  **Verify Context Limits.** If users complain of "missing experience", check the `extraction_warning` field in their session.

## Key Files
- `main.py`: Orchestration, endpoints, MD5 hashing, Hybrid matching integration, Strategic recommendations endpoint.
- `services/cache.py`: The persistence layer.
- `services/llm_kimi.py`: The "brain" (Prompts, API calls, XML injection, Swiss German system prompts, Strategic analysis, Skill ranking integration).
- `services/llm_matching.py`: Semantic matching (keyword extraction, skill ranking, achievement scoring, gap detection).
- `services/scoring.py`: Baseline ATS matching (regex-based, used in hybrid approach).
- `services/cv_quality.py`: Quality validation (readability, action verbs, quantification, buzzwords). Now supports preview mode (generated=None).
- `services/extract_documents.py`: Parsing logic (PDF/DOCX/OCR).
- `static/app.js`: Frontend logic, i18n, Strategic UI rendering + chat, intake syncing.
- `tests/conftest.py`: Test fixtures (test_client with cache reinitialization, temp_data_dir, mocks).
- `tests/test_smoke_start_page.py`: Smoke tests for start page intake flows (2 tests: basic + advanced).
- `tests/test_integration.py`: Integration tests (OCR cache, disk persistence, truncation warnings).
- `tests/test_semantic_matching_unit.py`: TDD test suite for semantic matching (6 tests, mocked LLM).
- `tests/test_strategic_recommendations.py`: TDD test suite for strategic features.
- `tests/test_keyword_matching_fix.py`: TDD test for job ad text sync fix.
- `tests/test_quality_preview.py`: TDD test for quality metrics in preview endpoint.
- `tests/test_no_ats_issues.py`: TDD tests for ATS-Probleme removal (3 tests).
- `tests/test_api_key_errors.py`: TDD tests for API key validation (3 tests).

## User Persona
The user ("Gusty") prefers direct, high-energy ("NetworkChuck style") interaction. Uses "Deep Truth" / "Forensic" framing for audits.
