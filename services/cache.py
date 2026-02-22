"""In-memory TTL caches for sessions and generated artifacts."""
from __future__ import annotations

import json
import os
import pickle
import threading
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional

from happyrav.models import ArtifactRecord, ExtractedProfile, MonsterArtifactRecord, SessionState

DATA_DIR = Path("data")


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
        self._root = DATA_DIR / "artifacts"
        self._root.mkdir(parents=True, exist_ok=True)

    def _cleanup(self) -> None:
        now = time.time()
        for path in self._root.glob("*.pkl"):
            try:
                if path.stat().st_mtime < now - self.ttl_seconds:
                    path.unlink()
            except Exception:
                pass

    def create_token(self) -> str:
        return uuid.uuid4().hex

    def set(self, record: ArtifactRecord) -> str:
        self._cleanup()
        with self._lock:
            path = self._root / f"{record.token}.pkl"
            with open(path, "wb") as f:
                pickle.dump(record, f)
        return record.token

    def get(self, token: str) -> Optional[ArtifactRecord]:
        self._cleanup()
        path = self._root / f"{token}.pkl"
        if not path.exists():
            return None
        with self._lock:
            try:
                with open(path, "rb") as f:
                    return pickle.load(f)
            except Exception:
                return None

    def delete(self, token: str) -> None:
        path = self._root / f"{token}.pkl"
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass


class DocumentCache:
    def __init__(self) -> None:
        self._root = DATA_DIR / "documents"
        self._root.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    def get(self, content_hash: str) -> Optional[Dict[str, Any]]:
        path = self._root / f"{content_hash}.json"
        if not path.exists():
            return None
        with self._lock:
            try:
                return json.loads(path.read_text())
            except Exception:
                return None

    def set(self, content_hash: str, payload: Dict[str, Any]) -> None:
        path = self._root / f"{content_hash}.json"
        with self._lock:
            try:
                path.write_text(json.dumps(payload))
            except Exception:
                pass


class SessionCache:
    def __init__(self, ttl_seconds: int = 3600) -> None:
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._root = DATA_DIR / "sessions"
        self._root.mkdir(parents=True, exist_ok=True)

    def _cleanup(self) -> None:
        now = time.time()
        for path in self._root.glob("*.pkl"):
            try:
                if path.stat().st_mtime < now - self.ttl_seconds:
                    path.unlink()
            except Exception:
                pass

    def create_session_id(self) -> str:
        return uuid.uuid4().hex

    def set(self, record: SessionRecord) -> str:
        self._cleanup()
        with self._lock:
            path = self._root / f"{record.state.session_id}.pkl"
            with open(path, "wb") as f:
                pickle.dump(record, f)
        return record.state.session_id

    def get(self, session_id: str) -> Optional[SessionRecord]:
        self._cleanup()
        path = self._root / f"{session_id}.pkl"
        if not path.exists():
            return None
        with self._lock:
            try:
                with open(path, "rb") as f:
                    return pickle.load(f)
            except Exception:
                return None

    def touch(self, session_id: str) -> Optional[SessionRecord]:
        record = self.get(session_id)
        if not record:
            return None
        record.state.expires_at = time.time() + self.ttl_seconds
        self.set(record)
        return record

    def delete(self, session_id: str) -> None:
        path = self._root / f"{session_id}.pkl"
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass


class MonsterCache:
    def __init__(self, ttl_seconds: int = 7200) -> None:
        self.ttl_seconds = ttl_seconds
        self._lock = threading.Lock()
        self._root = DATA_DIR / "artifacts"
        self._root.mkdir(parents=True, exist_ok=True)

    def _cleanup(self) -> None:
        now = time.time()
        for path in self._root.glob("monster_*.pkl"):
            try:
                if path.stat().st_mtime < now - self.ttl_seconds:
                    path.unlink()
            except Exception:
                pass

    def create_token(self) -> str:
        return uuid.uuid4().hex

    def set(self, record: MonsterArtifactRecord) -> str:
        self._cleanup()
        with self._lock:
            path = self._root / f"monster_{record.token}.pkl"
            with open(path, "wb") as f:
                pickle.dump(record, f)
        return record.token

    def get(self, token: str) -> Optional[MonsterArtifactRecord]:
        self._cleanup()
        path = self._root / f"monster_{token}.pkl"
        if not path.exists():
            return None
        with self._lock:
            try:
                with open(path, "rb") as f:
                    return pickle.load(f)
            except Exception:
                return None

    def delete(self, token: str) -> None:
        path = self._root / f"monster_{token}.pkl"
        try:
            path.unlink(missing_ok=True)
        except Exception:
            pass
