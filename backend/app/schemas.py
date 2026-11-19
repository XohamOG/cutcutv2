"""The contract between the browser and the agents. Short field names keep payloads and prompts small."""
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field, field_validator


class CandidateIn(BaseModel):
    id: int
    score: float = Field(ge=0, le=1, description="the browser's fused signal score")
    voice: float = 0
    chat: Optional[float] = None
    laughter: Optional[float] = None
    shout: Optional[float] = None
    window: float = Field(gt=0, description="window length in seconds")
    peak: float = Field(ge=0, description="peak, seconds from window start")
    notes: list[str] = []
    screen: list[str] = []
    words: list[tuple[float, str]] = Field(default=[], description="(seconds from window start, word)")
    chat_sample: list[str] = []


class JudgeRequest(BaseModel):
    clip_count: int = Field(ge=1, le=20)
    length: Union[Literal["auto"], int] = "auto"
    source_name: str = "stream"
    candidates: list[CandidateIn] = Field(min_length=1, max_length=80)


class Verdict(BaseModel):
    """Same shape as the browser's own judge (selection.ts Verdict), so applyVerdicts works unchanged."""
    id: int
    keep: bool
    score: int = Field(ge=0, le=100)
    moment_type: str
    start_offset: float = Field(ge=0)
    end_offset: float = Field(gt=0)
    title: str
    hook: str
    reason: str

    @field_validator("moment_type", "title", "hook", "reason", mode="before")
    @classmethod
    def trim(cls, v) -> str:
        return str(v if v is not None else "").strip()

    # Models sometimes miss a range by a little (a score of 105, a start of -0.5). Those are corrected, not rejected.
    @field_validator("score", mode="before")
    @classmethod
    def clamp_score(cls, v) -> int:
        return max(0, min(100, round(float(v))))

    @field_validator("start_offset", mode="before")
    @classmethod
    def not_negative(cls, v) -> float:
        return max(0.0, float(v))


class Rating(BaseModel):
    id: int
    s: int = Field(ge=0, le=10)
    w: str = ""
