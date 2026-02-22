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

## Operational Mandates
1.  **Do Not regress to volatile storage.** The `data/` directory is the source of truth.
2.  **Respect the `.gitignore`.** `data/` must not be committed.
3.  **Verify Context Limits.** If users complain of "missing experience", check the `extraction_warning` field in their session.

## Key Files
- `main.py`: Orchestration, endpoints, MD5 hashing.
- `services/cache.py`: The persistence layer.
- `services/llm_kimi.py`: The "brain" (Prompts, API calls, XML injection).
- `services/extract_documents.py`: Parsing logic (PDF/DOCX/OCR).

## User Persona
The user ("Gusty") prefers direct, high-energy ("NetworkChuck style") interaction. Uses "Deep Truth" / "Forensic" framing for audits.
