"""
Every agent talks to models through here.

- Roles map to a cascade of models: if the first fails (bad key, outage, unreadable answer) the next is tried.
- Answers must be JSON; anything else counts as a failure, so the cascade moves on.
- Answers are cached, so a repeated run spends no tokens.
- Token use is read from the provider's own usage report.
"""
import json
import re
import time
from dataclasses import dataclass
from typing import Any, Callable, Optional, Protocol

from .cache import AnswerCache
from .config import Settings

FAST = "fast"
STRONG = "strong"
# Groq's current models reason before answering; this much room is left for that on top of each answer's cap.
REASONING_ROOM = 600


@dataclass
class Reply:
    data: dict
    model: str
    tokens_in: int
    tokens_out: int
    cached: bool
    ms: float
    attempts: list  # [(model, error)] for models that failed before this one

    @property
    def tokens(self) -> int:
        return self.tokens_in + self.tokens_out


class ModelError(Exception):
    def __init__(self, message: str, attempts: list):
        super().__init__(message)
        self.attempts = attempts


def parse_json(text: str) -> dict:
    """Models sometimes wrap JSON in code fences or a sentence; take the outermost object."""
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.M).strip()
    start, end = cleaned.find("{"), cleaned.rfind("}")
    if start < 0 or end <= start:
        raise ValueError("answer was not JSON")
    value = json.loads(cleaned[start : end + 1])
    if not isinstance(value, dict):
        raise ValueError("answer was not a JSON object")
    return value


class ChatFn(Protocol):
    async def __call__(self, system: str, user: str, max_tokens: int) -> tuple[str, int, int]: ...


def _groq(settings: Settings, model: str) -> ChatFn:
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_groq import ChatGroq

    async def call(system: str, user: str, max_tokens: int) -> tuple[str, int, int]:
        llm = ChatGroq(model=model, api_key=settings.groq_key, temperature=0, max_tokens=max_tokens + REASONING_ROOM, max_retries=2, timeout=45)
        # Low reasoning effort: the tasks are structured, so long chains of thought only cost tokens and time.
        msg = await llm.bind(response_format={"type": "json_object"}, reasoning_effort="low", include_reasoning=False).ainvoke([SystemMessage(system), HumanMessage(user)])
        usage = msg.usage_metadata or {}
        return str(msg.content), usage.get("input_tokens", 0), usage.get("output_tokens", 0)

    return call


def _gemini(settings: Settings, model: str) -> ChatFn:
    from langchain_core.messages import HumanMessage, SystemMessage
    from langchain_google_genai import ChatGoogleGenerativeAI

    async def call(system: str, user: str, max_tokens: int) -> tuple[str, int, int]:
        # Low thinking: the task is structured and the prompt says exactly what to return. Current Gemini
        # models take a thinking level (not a budget), and hidden thinking counts against the output cap.
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=settings.gemini_key,
            temperature=0,
            max_output_tokens=max_tokens + REASONING_ROOM,
            max_retries=1,
            timeout=60,
            response_mime_type="application/json",
            thinking_level="low",
        )
        msg = await llm.ainvoke([SystemMessage(system), HumanMessage(user)])
        usage = msg.usage_metadata or {}
        content = msg.content if isinstance(msg.content, str) else "".join(p.get("text", "") if isinstance(p, dict) else str(p) for p in msg.content)
        return content, usage.get("input_tokens", 0), usage.get("output_tokens", 0)

    return call


class Models:
    """Role → ordered models. `chat_factory` can be replaced in tests so no network is used."""

    def __init__(self, settings: Settings, cache: AnswerCache, chat_factory: Optional[Callable[[str, str], ChatFn]] = None):
        self.settings = settings
        self.cache = cache
        self._factory = chat_factory or self._real_factory
        self.cascades: dict[str, list[tuple[str, str]]] = {FAST: [], STRONG: []}
        if settings.groq_key or chat_factory:
            self.cascades[FAST].append(("groq", settings.model_fast))
        if settings.gemini_key or chat_factory:
            self.cascades[STRONG].append(("gemini", settings.model_strong))
        if settings.gemini_key and not chat_factory:
            self.cascades[STRONG].append(("gemini", settings.model_strong_backup))
        if settings.groq_key or chat_factory:
            self.cascades[STRONG].append(("groq", settings.model_strong_fallback))

    def _real_factory(self, provider: str, model: str) -> ChatFn:
        return _gemini(self.settings, model) if provider == "gemini" else _groq(self.settings, model)

    def available(self, role: str) -> list[str]:
        return [m for _, m in self.cascades[role]]

    async def ask(self, role: str, system: str, user: str, max_tokens: int, validate: Callable[[dict], Any] = lambda d: d) -> Reply:
        attempts: list = []
        started = time.perf_counter()
        for provider, model in self.cascades[role]:
            key = AnswerCache.key(model, system, user, max_tokens)
            hit = self.cache.get(key)
            if hit is not None:
                return Reply(hit, model, 0, 0, True, (time.perf_counter() - started) * 1000, attempts)
            try:
                text, tin, tout = await self._factory(provider, model)(system, user, max_tokens)
                data = parse_json(text)
                validate(data)
            except Exception as err:  # noqa: BLE001 - any failure moves to the next model
                attempts.append((model, _short(err)))
                continue
            self.cache.put(key, data)
            return Reply(data, model, tin, tout, False, (time.perf_counter() - started) * 1000, attempts)
        if not attempts:
            raise ModelError(f"no {role} model is configured", attempts)
        raise ModelError(f"no {role} model gave a usable answer ({attempts[-1][0]}: {attempts[-1][1]})", attempts)


def _short(err: Exception) -> str:
    text = str(err) or err.__class__.__name__
    if re.search(r"401|invalid.{0,20}api.?key|api key not valid", text, re.I):
        return "auth: the key was rejected"
    if re.search(r"429|rate.?limit|quota", text, re.I):
        return "rate-limit"
    return text.splitlines()[0][:140]
