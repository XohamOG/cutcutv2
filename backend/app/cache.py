"""Answers keyed by a hash of model + prompt. The same question costs zero tokens the second time."""
import hashlib
import json
import sqlite3
import threading
from pathlib import Path
from typing import Any, Optional


class AnswerCache:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._db = sqlite3.connect(path, check_same_thread=False)
        self._db.execute("CREATE TABLE IF NOT EXISTS answers (key TEXT PRIMARY KEY, value TEXT NOT NULL)")
        self._lock = threading.Lock()

    @staticmethod
    def key(*parts: Any) -> str:
        return hashlib.sha256(json.dumps(parts, sort_keys=True, ensure_ascii=False).encode()).hexdigest()

    def get(self, key: str) -> Optional[dict]:
        with self._lock:
            row = self._db.execute("SELECT value FROM answers WHERE key = ?", (key,)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, key: str, value: dict) -> None:
        with self._lock:
            self._db.execute("INSERT OR REPLACE INTO answers (key, value) VALUES (?, ?)", (key, json.dumps(value, ensure_ascii=False)))
            self._db.commit()
