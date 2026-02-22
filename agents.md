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

5.  **Strategic Guidance (NEW):**
    - **Only** generate strategic analysis when match score < 70 (`REVIEW_RECOMMEND_THRESHOLD`).
    - **Cost-aware:** Strategic generation costs ~$0.07 per analysis. Don't trigger for high-scoring profiles.
    - **Context:** Strategic chat uses `state.server.strategic_analysis` and `state.server.review_match` for context.
    - **Testing:** Use TDD approach. Tests in `tests/test_strategic_recommendations.py`.

## Key Files
- `main.py`: The API orchestration layer. Handles MD5 hashing, persistent cache interaction, strategic endpoints.
- `services/cache.py`: The persistence engine. Uses `pickle` and file locks.
- `services/llm_kimi.py`: The LLM integration layer. Handles prompts, token optimization, strategic analysis generation.
- `static/app.js`: Frontend state management, i18n, strategic UI + chat rendering.
- `tests/`: TDD integration tests for persistence, caching, strategic features.

## Workflow
1.  **Read:** Check `README.md` and `CLAUDE.md` for architectural context.
2.  **Think:** Before modifying code, verify if the change impacts persistence or token usage.
3.  **Act:** Make targeted changes.
4.  **Verify:** Check if the system still persists state after a restart.

## Troubleshooting
- **Missing Data:** Check `data/sessions/` for the session file.
- **OCR Failures:** Check `data/documents/` for cached OCR results.
- **Truncation:** Check `llm_warning` in the `SessionRecord`.
