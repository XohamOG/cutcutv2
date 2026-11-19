"""Settings read once from backend/.env. Keys never leave this process and are never logged."""
import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")


@dataclass(frozen=True)
class Settings:
    groq_key: str
    gemini_key: str
    model_fast: str
    model_strong: str
    model_strong_backup: str
    model_strong_fallback: str
    max_run_tokens: int
    cache_path: Path


def load_settings() -> Settings:
    return Settings(
        groq_key=os.getenv("GROQ_API_KEY", "").strip(),
        gemini_key=os.getenv("GEMINI_API_KEY", "").strip(),
        model_fast=os.getenv("MODEL_FAST", "openai/gpt-oss-20b"),
        model_strong=os.getenv("MODEL_STRONG", "gemini-flash-latest"),
        model_strong_backup=os.getenv("MODEL_STRONG_BACKUP", "gemini-flash-lite-latest"),
        model_strong_fallback=os.getenv("MODEL_STRONG_FALLBACK", "openai/gpt-oss-120b"),
        max_run_tokens=int(os.getenv("MAX_RUN_TOKENS", "24000")),
        cache_path=ROOT / ".cache" / "llm.sqlite",
    )
