# GEMINI.md -- happyRAV Context

## Project Overview
happyRAV is a document-first CV/Cover Letter wizard. It emphasizes high-quality extraction from PDF/Images (using GPT-5 Vision) and structured rewriting (using Claude Sonnet).

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
    *   **Enhanced:** Now includes contextual gaps and transferable skills from semantic matching.
    *   **Cost Control:** Only triggered for low-scoring profiles (< 70%). High scores skip to save tokens.
    *   **Frontend:** Accordion UI in Review page + chat interface for follow-up questions.
    *   **Action:** Do NOT generate strategic analysis for high scores (>= 70). Threshold: `REVIEW_RECOMMEND_THRESHOLD = 70`.

## Operational Mandates
1.  **Do Not regress to volatile storage.** The `data/` directory is the source of truth.
2.  **Respect the `.gitignore`.** `data/` must not be committed.
3.  **Verify Context Limits.** If users complain of "missing experience", check the `extraction_warning` field in their session.

## Key Files
- `main.py`: Orchestration, endpoints, MD5 hashing, Hybrid matching integration, Strategic recommendations endpoint.
- `services/cache.py`: The persistence layer.
- `services/llm_kimi.py`: The "brain" (Prompts, API calls, XML injection, Strategic analysis generation, Skill ranking integration).
- `services/llm_matching.py`: Semantic matching (keyword extraction, skill ranking, achievement scoring, gap detection).
- `services/scoring.py`: Baseline ATS matching (regex-based, used in hybrid approach).
- `services/extract_documents.py`: Parsing logic (PDF/DOCX/OCR).
- `static/app.js`: Frontend logic, i18n, Strategic UI rendering + chat.
- `tests/test_semantic_matching_unit.py`: TDD test suite for semantic matching (6 tests, mocked LLM).
- `tests/test_strategic_recommendations.py`: TDD test suite for strategic features.

## User Persona
The user ("Gusty") prefers direct, high-energy ("NetworkChuck style") interaction. Uses "Deep Truth" / "Forensic" framing for audits.
