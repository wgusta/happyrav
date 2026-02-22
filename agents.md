# AGENTS.md -- happyRAV Agent Guide

## Mission
happyRAV is a high-performance CV/Cover Letter wizard. Your goal is to maintain its robust architecture while optimizing for user experience and token economy.

## Core Mandates
1.  **Persistence First:**
    - **Never** store critical state in memory-only structures.
    - Check `data/sessions/` and `data/artifacts/` before assuming data loss.
    - When debugging, check if `pickle` files exist for a session ID.

2.  **Token Thrift:**
    - **Avoid** `json.dumps()` for large text blobs. Use `<DOCUMENTS>` XML tags.
    - **Compress** where possible, but never silently truncate.
    - Always propagate truncation warnings to the user.

3.  **Integrity:**
    - Respect the `extraction_warning` field in `SessionState`.
    - If a user reports missing data, check if their document exceeded 64k chars.

4.  **OCR Economy:**
    - **Never** call `vision_ocr` without first checking the `DocumentCache` (MD5 hash).
    - If modifying `extract_documents.py`, ensure the MD5 check remains in `main.py`.

5.  **Semantic Matching (NEW):**
    - **Hybrid Approach:** 40% baseline (regex) + 60% semantic (LLM). Never remove baseline - it's the reliability fallback.
    - **Module:** `services/llm_matching.py` uses OpenAI GPT-4.1-mini (~$0.008/match).
    - **Error Handling:** All LLM calls wrapped in try/except. Falls back to baseline on API errors.
    - **Integration Points:**
      - `main.py` preview-match endpoint: Calls semantic matching, merges scores
      - `llm_kimi.py` generate_content: Pre-processes with skill ranking + achievement scoring
      - Strategic analysis: Enhanced with contextual gaps and transferable skills
    - **Testing:** Unit tests with mocked LLM responses in `tests/test_semantic_matching_unit.py`.

6.  **Strategic Guidance:**
    - **Only** generate strategic analysis when match score < 70 (`REVIEW_RECOMMEND_THRESHOLD`).
    - **Cost-aware:** Strategic generation costs ~$0.07 per analysis. Don't trigger for high-scoring profiles.
    - **Enhanced:** Now includes contextual gaps (critical/important/nice-to-have) and transferable skills from semantic matching.
    - **Context:** Strategic chat uses `state.server.strategic_analysis` and `state.server.review_match` for context.
    - **Testing:** Use TDD approach. Tests in `tests/test_strategic_recommendations.py`.

## Key Files
- `main.py`: The API orchestration layer. Handles MD5 hashing, persistent cache interaction, hybrid matching integration, strategic endpoints.
- `services/cache.py`: The persistence engine. Uses `pickle` and file locks.
- `services/llm_kimi.py`: The LLM integration layer. Handles prompts, token optimization, strategic analysis generation, skill ranking integration.
- `services/llm_matching.py`: Semantic matching engine. Keyword extraction, skill ranking, achievement scoring, gap detection (OpenAI GPT-4.1-mini).
- `services/scoring.py`: Baseline ATS matching (regex-based via parser_scanner). Used in hybrid approach.
- `static/app.js`: Frontend state management, i18n, strategic UI + chat rendering.
- `tests/`: TDD integration tests for persistence, caching, semantic matching, strategic features.

## Workflow
1.  **Read:** Check `README.md` and `CLAUDE.md` for architectural context.
2.  **Think:** Before modifying code, verify if the change impacts persistence or token usage.
3.  **Act:** Make targeted changes.
4.  **Verify:** Check if the system still persists state after a restart.

## Troubleshooting
- **Missing Data:** Check `data/sessions/` for the session file.
- **OCR Failures:** Check `data/documents/` for cached OCR results.
- **Truncation:** Check `llm_warning` in the `SessionRecord`.
