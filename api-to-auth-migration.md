# API-to-Auth Migration Plan: BYOK + ChatGPT Session Auth

## Problem

happyRAV currently uses server-side API keys (OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY) for all LLM calls. This means:
- Every user session costs the operator money
- No way to leverage users' existing ChatGPT Plus/Pro subscriptions
- Single point of failure if keys are revoked or rate-limited

## Vision (inspired by T3 Code)

Like T3 Code wraps official lab harnesses instead of building its own, happyRAV should let users bring their own credentials. Two modes:

1. **BYOK (Bring Your Own Key)** — user pastes their API key in the UI, stored in localStorage, sent per-request
2. **ChatGPT Session Auth** — user logs into OpenAI via OAuth, app uses their subscription quota

Priority: BYOK first (simpler, works today), OAuth later.

## Current LLM Call Inventory

| Function | Provider | Model | Purpose | File |
|----------|----------|-------|---------|------|
| `_chat_json_openai()` | OpenAI | gpt-4.1-mini / gpt-5.2 | Profile extraction | llm_kimi.py:277 |
| `vision_ocr()` | OpenAI | gpt-5-mini | Image OCR | llm_kimi.py:309 |
| `_chat_json_anthropic()` | Anthropic | claude-sonnet-4-6 / opus | CV/cover generation, refinement, strategic analysis | llm_kimi.py:292 |
| `_chat_json_google()` | Google | gemini-3.1-pro | Crosscheck (max mode only) | llm_kimi.py:303 |
| `_chat_json_openai_async()` | OpenAI | gpt-5.2 + fallbacks | Semantic matching (5 functions) | llm_matching.py:54 |
| `_extract_monster_timeline_sync()` | OpenAI | gpt-4.1-mini / gpt-5.2 | Monster CV extraction | llm_kimi.py:956 |

**Total: 6 call sites across 2 files, 3 providers.**

## Architecture

### New Module: `services/llm_credentials.py`

Central credential resolver. All LLM client builders (`_build_client`, `_build_anthropic_client`, `_build_google_client`, `_build_async_openai_client`) call this instead of reading env vars directly.

```
Credential resolution order:
1. Per-request user key (from X-OpenAI-Key / X-Anthropic-Key header)
2. Server-side env var (OPENAI_API_KEY, ANTHROPIC_API_KEY)
3. Codex OAuth token (existing fallback)
```

### Request Flow

```
Browser                    FastAPI                     LLM Provider
  │                          │                              │
  │  X-OpenAI-Key: sk-...    │                              │
  │  X-Anthropic-Key: sk-... │                              │
  ├─────────────────────────>│                              │
  │                          │  resolve_credentials(req)    │
  │                          │  → picks user key or env key │
  │                          │                              │
  │                          │  _build_client(api_key=...)  │
  │                          ├─────────────────────────────>│
  │                          │<─────────────────────────────│
  │  result                  │                              │
  │<─────────────────────────│                              │
```

### Frontend: Key Entry UI

- Settings panel (gear icon) with fields for OpenAI + Anthropic API keys
- Keys stored in `localStorage` (key: `happyrav_api_keys`)
- Sent as custom headers on every fetch call
- Visual indicator: "Using your keys" vs "Using server keys"
- Keys never logged or persisted server-side

### Data Model

No model changes needed. Keys are transient per-request, not stored in SessionState.

## Implementation Plan (TDD, tiny commits)

### Phase 1: Backend Credential Layer

#### Commit 1: `services/llm_credentials.py` + tests
**Test first:** `tests/test_credentials.py`
```python
# RED tests:
def test_resolve_openai_key_from_header():
    """User-provided key in X-OpenAI-Key header takes priority."""
    creds = resolve_credentials(openai_header="sk-user-123", env_key="sk-server-456")
    assert creds.openai_key == "sk-user-123"
    assert creds.source == "user"

def test_resolve_openai_key_fallback_to_env():
    """Falls back to env var when no header."""
    creds = resolve_credentials(openai_header="", env_key="sk-server-456")
    assert creds.openai_key == "sk-server-456"
    assert creds.source == "server"

def test_resolve_openai_key_fallback_to_codex():
    """Falls back to Codex OAuth when no header and no env."""
    # mock _load_codex_oauth_token returning "codex-token"
    creds = resolve_credentials(openai_header="", env_key="")
    assert creds.openai_key == "codex-token"
    assert creds.source == "codex"

def test_resolve_no_key_raises():
    """Raises clear error when no key available from any source."""
    with pytest.raises(MissingCredentialError):
        resolve_credentials(openai_header="", env_key="")
        # with codex also returning ""

def test_resolve_anthropic_key_from_header():
    creds = resolve_credentials(anthropic_header="sk-ant-user")
    assert creds.anthropic_key == "sk-ant-user"

def test_key_validation_rejects_empty():
    """Empty/whitespace keys are treated as absent."""
    creds = resolve_credentials(openai_header="   ", env_key="sk-real")
    assert creds.openai_key == "sk-real"

def test_credentials_model_fields():
    """LLMCredentials has openai_key, anthropic_key, google_key, source."""
    creds = LLMCredentials(openai_key="a", anthropic_key="b", source="user")
    assert creds.openai_key == "a"
```

**GREEN:** Implement `LLMCredentials` dataclass and `resolve_credentials()` function.

#### Commit 2: Wire credentials into `_build_client()` + tests
**Test first:** `tests/test_client_builders.py`
```python
def test_build_client_with_user_key(monkeypatch):
    """OpenAI client uses user-provided key when available."""
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    client = _build_client(api_key="sk-user-key")
    assert client.api_key == "sk-user-key"

def test_build_anthropic_with_user_key(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    client = _build_anthropic_client(api_key="sk-ant-user")
    # verify client was created (no ValueError)

def test_build_client_no_key_raises():
    with pytest.raises(ValueError, match="API key"):
        _build_client(api_key="")
```

**GREEN:** Add optional `api_key` parameter to all `_build_*` client functions. When provided, skip env var lookup.

#### Commit 3: FastAPI dependency for credential extraction + tests
**Test first:** `tests/test_credential_dependency.py`
```python
def test_extract_keys_from_headers():
    """Middleware extracts API keys from request headers."""
    headers = {"x-openai-key": "sk-user", "x-anthropic-key": "sk-ant"}
    creds = extract_request_credentials(headers)
    assert creds.openai_key == "sk-user"
    assert creds.anthropic_key == "sk-ant"

def test_extract_keys_missing_headers_uses_env(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "sk-env")
    creds = extract_request_credentials({})
    assert creds.openai_key == "sk-env"

def test_has_api_key_with_user_keys():
    """has_api_key works when user provides keys (no env vars)."""
    creds = LLMCredentials(openai_key="sk-u", anthropic_key="sk-a", source="user")
    assert has_api_key_for(creds) is True

def test_key_source_indicator():
    """API response includes key source for UI display."""
    creds = LLMCredentials(openai_key="sk-u", source="user")
    assert creds.source == "user"
```

**GREEN:** Create `get_credentials` FastAPI dependency that reads headers + falls back to env. Thread `LLMCredentials` through endpoint → service calls.

#### Commit 4: Thread credentials through all LLM call sites
**Test first:** `tests/test_credentials_threading.py`
```python
def test_extract_profile_uses_request_credentials(mock_openai):
    """extract_profile_from_documents uses provided credentials, not env."""
    creds = LLMCredentials(openai_key="sk-user-test", source="user")
    profile, _, _ = await extract_profile_from_documents("en", ["doc text"], credentials=creds)
    # assert mock_openai was called with api_key="sk-user-test"

def test_generate_content_uses_request_credentials(mock_anthropic):
    """generate_content uses provided Anthropic key."""
    creds = LLMCredentials(anthropic_key="sk-ant-user", source="user")
    content, _ = await generate_content("en", "job ad", profile, credentials=creds)
    # assert mock_anthropic was called with api_key="sk-ant-user"

def test_semantic_matching_uses_request_credentials(mock_openai):
    """Semantic matching functions use provided credentials."""
    creds = LLMCredentials(openai_key="sk-user-match", source="user")
    result = await extract_semantic_keywords("job text", "en", credentials=creds)
    # assert correct key used
```

**GREEN:** Add `credentials: Optional[LLMCredentials] = None` parameter to:
- `extract_profile_from_documents()`
- `generate_content()`
- `refine_content()`
- `generate_strategic_analysis()`
- `extract_monster_timeline()`
- All functions in `llm_matching.py`
- `vision_ocr()`

Pass credentials down to `_build_client()` / `_build_anthropic_client()`.

#### Commit 5: Wire credentials through all FastAPI endpoints
Update all endpoints that call LLM functions to extract credentials from request headers via the dependency and pass them through.

**Affected endpoints:**
- `POST /api/session/{id}/upload` (OCR + extraction)
- `POST /api/session/{id}/preview-match` (semantic matching)
- `POST /api/session/{id}/generate` (generation)
- `POST /api/session/{id}/chat` (refinement)
- `POST /api/session/{id}/generate-cover` (cover letter)
- `POST /api/session/{id}/ask-recommendation` (strategic chat)
- `POST /api/session/{id}/monster-cv` (monster extraction)

### Phase 2: Frontend Key Entry

#### Commit 6: API key settings panel in UI + localStorage
**Changes:**
- `app.js`: Add settings gear icon, modal with OpenAI + Anthropic key inputs
- `app.js`: `saveApiKeys()` / `loadApiKeys()` using localStorage key `happyrav_api_keys`
- `app.js`: Modify all `fetch()` calls to include `X-OpenAI-Key` and `X-Anthropic-Key` headers when keys are set
- `style.css`: Settings modal styles
- i18n keys for both EN and DE

**Test:** Manual + existing smoke tests still pass (no keys = server fallback)

#### Commit 7: Key status indicator
- Show "Using your API keys" (green) vs "Using server keys" (gray) in header
- Key validation: test API key with a minimal completion call before storing
- i18n for status messages

#### Commit 8: Key validation endpoint
**Test first:** `tests/test_key_validation.py`
```python
def test_validate_valid_openai_key(mock_openai_success):
    resp = client.post("/api/validate-key", json={"provider": "openai", "key": "sk-valid"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True

def test_validate_invalid_key(mock_openai_auth_error):
    resp = client.post("/api/validate-key", json={"provider": "openai", "key": "sk-bad"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is False
    assert "error" in resp.json()

def test_validate_anthropic_key(mock_anthropic_success):
    resp = client.post("/api/validate-key", json={"provider": "anthropic", "key": "sk-ant-valid"})
    assert resp.status_code == 200
    assert resp.json()["valid"] is True
```

**GREEN:** `POST /api/validate-key` endpoint that makes a minimal API call to verify key validity.

### Phase 3: API Response Metadata

#### Commit 9: Add credential source to API responses
**Test first:** `tests/test_credential_source_response.py`
```python
def test_generate_response_includes_key_source():
    """Generate response includes which key source was used."""
    resp = client.post("/api/session/{id}/generate", headers={"X-OpenAI-Key": "sk-u"})
    assert resp.json()["key_source"] == "user"

def test_generate_response_server_keys():
    resp = client.post("/api/session/{id}/generate")
    assert resp.json()["key_source"] == "server"
```

### Phase 4: Future — OpenAI OAuth (not in this PR)

For ChatGPT subscription auth via OAuth:
- OpenAI OAuth 2.0 flow (authorization code grant)
- Store refresh token in encrypted session cookie
- Exchange for access token per-request
- Use access token as bearer for API calls
- Scope: model access tied to user's subscription tier

This requires OpenAI to support OAuth for API access via subscription, which may not be publicly available yet. Defer until confirmed.

## Security Considerations

- **Keys in transit:** HTTPS only (Caddy handles TLS). Keys sent as headers, never in URL params.
- **Keys at rest:** localStorage only (client-side). Never stored server-side, never logged, never in SessionState/pickle files.
- **Key masking:** UI shows `sk-...xxxx` (first 3 + last 4 chars). Full key never displayed after entry.
- **No key forwarding:** Keys are used only for the immediate LLM call, never forwarded to third parties.
- **Header sanitization:** Strip whitespace, validate format (`sk-` prefix for OpenAI, `sk-ant-` for Anthropic).
- **Rate limiting:** Per-session rate limits still apply regardless of key source.

## Cost Impact

| Mode | Who pays | Approximate cost/session |
|------|----------|------------------------|
| Server keys (current) | Operator | ~$0.15-0.50 |
| User BYOK | User | ~$0.15-0.50 |
| Future OAuth | User's subscription | $0 marginal |

## Migration Strategy

- **No breaking changes.** Server keys continue to work as fallback.
- **Gradual rollout:** Start with optional BYOK, keep server keys as default.
- **Future:** Can make BYOK required and remove server keys entirely if desired.
- **Environment variable:** `HAPPYRAV_REQUIRE_USER_KEYS=true` to disable server-key fallback (forces BYOK).

## Files to Modify

| File | Changes |
|------|---------|
| `services/llm_credentials.py` | **NEW** — credential resolver |
| `services/llm_kimi.py` | Add `credentials` param to all public functions + client builders |
| `services/llm_matching.py` | Add `credentials` param to all public functions + client builder |
| `main.py` | Add `get_credentials` dependency, thread through endpoints |
| `models.py` | No changes (keys are transient) |
| `static/app.js` | Settings panel, key storage, header injection |
| `static/style.css` | Settings modal styles |
| `templates/` | Settings gear icon in header |

## Test Plan

| Test File | Tests | Phase |
|-----------|-------|-------|
| `tests/test_credentials.py` | 7 | 1 |
| `tests/test_client_builders.py` | 3 | 1 |
| `tests/test_credential_dependency.py` | 4 | 1 |
| `tests/test_credentials_threading.py` | 3 | 1 |
| `tests/test_key_validation.py` | 3 | 2 |
| `tests/test_credential_source_response.py` | 2 | 3 |
| **Total** | **22** | |

Existing tests must continue passing (they use mocks or env vars, which remain the fallback path).
