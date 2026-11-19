"""
HTTP front door for the agents. The browser sends text only (signal numbers and transcripts, never video)
and reads back one JSON line per agent step, then the result.

Run: uvicorn app.main:app --port 8000   (from the backend folder)
"""
import json
import time
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from .cache import AnswerCache
from .config import load_settings
from .graph import build_graph
from .llm import FAST, STRONG, Models
from .schemas import JudgeRequest

settings = load_settings()
models = Models(settings, AnswerCache(settings.cache_path))
graph = build_graph(models, settings.max_run_tokens)

app = FastAPI(title="viralbits agents")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": bool(models.available(FAST) and models.available(STRONG)), "models": {"fast": models.available(FAST), "strong": models.available(STRONG)}}


async def run_graph(req: JudgeRequest) -> AsyncIterator[str]:
    started = time.perf_counter()
    final: dict = {"verdicts": [], "flags": {}, "error": None}
    tokens = 0
    try:
        async for update in graph.astream({"request": req}, stream_mode="updates"):
            for change in update.values():
                if not change:
                    continue
                for s in change.get("trace", []):
                    yield json.dumps({"type": "step", "step": s}) + "\n"
                tokens += change.get("tokens", 0)
                for key in ("verdicts", "error"):
                    if key in change:
                        final[key] = change[key]
                final["flags"].update(change.get("flags", {}))
    except Exception as err:  # noqa: BLE001 - the browser falls back on any error line
        final["error"] = f"agent graph failed: {str(err)[:200]}"
    if final["error"] or not final["verdicts"]:
        yield json.dumps({"type": "error", "message": final["error"] or "the agents returned no verdicts"}) + "\n"
        return
    yield json.dumps({"type": "result", "verdicts": final["verdicts"], "flags": final["flags"], "tokens": tokens, "ms": round((time.perf_counter() - started) * 1000)}) + "\n"


@app.post("/agents/judge")
async def judge(req: JudgeRequest) -> StreamingResponse:
    return StreamingResponse(run_graph(req), media_type="application/x-ndjson")
