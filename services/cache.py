"""In-memory TTL caches for sessions and generated artifacts."""
from __future__ import annotations

import threading
import time
import uuid
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from happyrav.models import ArtifactRecord, ExtractedProfile, SessionState

@dataclass
class SessionRecord:
    state: SessionState
    document_texts: Dict[str, str] = field(default_factory=dict)
    photo_data_url: str = ""
    signature_data_url: str = ""
    extraction_signature: str = ""
    llm_profile: Optional[ExtractedProfile] = None
    llm_warning: str = ""
    llm_debug: Dict[str, Any] = field(default_factory=dict)
    chat_history: List[Dict[str, str]] = field(default_factory=list)
    preseed_profile: Optional[ExtractedProfile] = None


class ArtifactCache:
    def __init__(self, ttl_seconds: int = 600) -> None:
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._records: Dict[str, ArtifactRecord] = {}

    def cleanup(self) -> None:
        now = time.time()
        with self._lock:
            expired = [key for key, record in self._records.items() if record.expires_at <= now]
            for key in expired:
                self._records.pop(key, None)

    def create_token(self) -> str:
        return uuid.uuid4().hex

    def set(self, record: ArtifactRecord) -> str:
        self.cleanup()
        with self._lock:
            self._records[record.token] = record
        return record.token

    def get(self, token: str) -> Optional[ArtifactRecord]:
        self.cleanup()
        with self._lock:
            return self._records.get(token)

    def delete(self, token: str) -> None:
        with self._lock:
            self._records.pop(token, None)


class SessionCache:
    def __init__(self, ttl_seconds: int = 3600) -> None:
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._records: Dict[str, SessionRecord] = {}

    def cleanup(self) -> None:
        now = time.time()
        with self._lock:
            expired = [sid for sid, rec in self._records.items() if rec.state.expires_at <= now]
            for sid in expired:
                self._records.pop(sid, None)

    def create_session_id(self) -> str:
        return uuid.uuid4().hex

    def set(self, record: SessionRecord) -> str:
        self.cleanup()
        with self._lock:
            self._records[record.state.session_id] = record
        return record.state.session_id

    def get(self, session_id: str) -> Optional[SessionRecord]:
        self.cleanup()
        with self._lock:
            return self._records.get(session_id)

    def touch(self, session_id: str) -> Optional[SessionRecord]:
        self.cleanup()
        with self._lock:
            record = self._records.get(session_id)
            if not record:
                return None
            record.state.expires_at = time.time() + self.ttl_seconds
            return record

    def delete(self, session_id: str) -> None:
        with self._lock:
            self._records.pop(session_id, None)
