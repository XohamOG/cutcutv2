import sqlite3
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).parent / "database.db"

def init_db(db_path: Path = DB_PATH):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS interactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            question TEXT NOT NULL,
            detected_intent TEXT NOT NULL,
            response_time_ms REAL NOT NULL,
            response_returned TEXT NOT NULL,
            status TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def log_interaction(
    question: str,
    detected_intent: str,
    response_time_ms: float,
    response_returned: str,
    status: str = "SUCCESS",
    db_path: Path = DB_PATH
):
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO interactions (timestamp, question, detected_intent, response_time_ms, response_returned, status)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        datetime.utcnow().isoformat(),
        question,
        detected_intent,
        round(response_time_ms, 2),
        response_returned,
        status
    ))
    conn.commit()
    conn.close()

def get_interaction_count(db_path: Path = DB_PATH) -> int:
    init_db(db_path)
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM interactions")
    count = cur.fetchone()[0]
    conn.close()
    return count
