"""
The agent team, as a LangGraph graph.

    START → planner ─┬─ (many moments) → screener × N, in parallel ─┐
                     └─ (few moments)  ─────────────────────────────┴→ supervisor → judge ─┬→ reviewer → END
                                                                                            └→ END (judge failed: the browser falls back)

Token rules: rules before models wherever rules are enough, the small model for wide work, the strong model
only for the finalists, one batched call per agent, a token budget per run, and cached answers.
"""
import operator
import time
from typing import Annotated, Any, Optional, TypedDict

from langgraph.graph import END, START, StateGraph
from langgraph.types import Send
from pydantic import ValidationError

from . import prompts
from .llm import FAST, STRONG, ModelError, Models, Reply
from .schemas import CandidateIn, JudgeRequest, Rating, Verdict

SCREEN_BATCH = 10
FUSE_SCREENER = 0.5  # weight of the screener's rating against the browser's signal score
DISAGREE_LOW = 3  # a kept clip the screener rated this low or lower goes to the person


def merge(a: dict, b: dict) -> dict:
    return {**(a or {}), **(b or {})}


class ScreenTask(TypedDict):
    batch: list
    index: int
    spent: int


class RunState(TypedDict, total=False):
    request: JudgeRequest
    plan: dict
    ratings: Annotated[dict, merge]
    finalists: list
    verdicts: list
    flags: Annotated[dict, merge]
    error: Optional[str]
    trace: Annotated[list, operator.add]
    tokens: Annotated[int, operator.add]


def step(agent: str, action: str, status: str = "ok", ms: float = 0, tool: Optional[str] = None, tokens: int = 0, detail: Optional[str] = None, attempts: int = 1) -> dict:
    out: dict[str, Any] = {"agent": agent, "action": action, "status": status, "ms": round(ms), "tokens": tokens, "attempts": attempts}
    if tool:
        out["tool"] = tool
    if detail:
        out["detail"] = detail[:160]
    return out


def model_steps(agent: str, action: str, reply: Reply) -> list[dict]:
    """One step per model the cascade had to skip, then the one that answered."""
    skipped = [step(agent, action, "fallback", tool=m, detail=why) for m, why in reply.attempts]
    note = "cached answer, 0 tokens" if reply.cached else f"{reply.tokens_in} in / {reply.tokens_out} out"
    return skipped + [step(agent, action, "ok", reply.ms, reply.model, reply.tokens, note)]


def build_graph(models: Models, max_run_tokens: int):
    async def planner(state: RunState) -> dict:
        req = state["request"]
        n, want = len(req.candidates), req.clip_count
        lo, hi = min(n, want), min(n, max(want * 2, want + 3))
        has_chat = any(c.chat is not None for c in req.candidates)
        if n <= hi:
            # Every moment fits in the judge's view, so screening would only spend tokens.
            plan = {"finalists": n, "screen": False}
            return {"plan": plan, "trace": [step("planner", f"plan: judge all {n} moments, skip screening", tool="rules", detail=f"only {n} moments for {want} clips")]}
        scores = sorted((c.score for c in req.candidates), reverse=True)
        try:
            reply = await models.ask(FAST, prompts.PLANNER_SYSTEM, prompts.planner_user(n, want, lo, hi, scores, has_chat), max_tokens=60, validate=lambda d: int(d["finalists"]))
            finalists = max(lo, min(hi, int(reply.data["finalists"])))
            plan = {"finalists": finalists, "screen": True}
            return {"plan": plan, "tokens": reply.tokens, "trace": model_steps("planner", f"plan: screen {n}, judge {finalists}", reply)}
        except ModelError as err:
            finalists = min(hi, want + 3)
            return {"plan": {"finalists": finalists, "screen": True}, "trace": [step("planner", f"plan: screen {n}, judge {finalists}", "fallback", tool="rules", detail=str(err))]}

    def fan_out(state: RunState):
        if not state["plan"]["screen"]:
            return "supervisor"
        cands = state["request"].candidates
        spent = state.get("tokens", 0)
        return [Send("screener", {"batch": cands[i : i + SCREEN_BATCH], "index": i // SCREEN_BATCH + 1, "spent": spent}) for i in range(0, len(cands), SCREEN_BATCH)]

    async def screener(payload: ScreenTask) -> dict:
        batch: list[CandidateIn] = payload["batch"]
        action = f"screen batch {payload['index']} ({len(batch)} moments)"
        if payload["spent"] > max_run_tokens * 0.5:
            return {"trace": [step("screener", action, "skipped", detail="token budget: signal scores used instead")]}
        ids = {c.id for c in batch}

        def valid(d: dict) -> None:
            rows = [Rating(**r) for r in d["r"]]
            if not {r.id for r in rows} & ids:
                raise ValueError("no rating matched a moment")

        try:
            reply = await models.ask(FAST, prompts.SCREENER_SYSTEM, prompts.screener_user(batch), max_tokens=24 * len(batch) + 40, validate=valid)
        except ModelError as err:
            return {"trace": [step("screener", action, "failed", detail=str(err))]}
        ratings = {}
        for row in reply.data["r"]:
            try:
                r = Rating(**row)
            except ValidationError:
                continue
            if r.id in ids:
                ratings[r.id] = {"s": r.s, "w": r.w[:60]}
        return {"ratings": ratings, "tokens": reply.tokens, "trace": model_steps("screener", action, reply)}

    async def supervisor(state: RunState) -> dict:
        started = time.perf_counter()
        req, ratings = state["request"], state.get("ratings", {})

        def fused(c: CandidateIn) -> float:
            r = ratings.get(c.id)
            return c.score if r is None else (1 - FUSE_SCREENER) * c.score + FUSE_SCREENER * r["s"] / 10

        ranked = sorted(req.candidates, key=fused, reverse=True)
        finalists = ranked[: state["plan"]["finalists"]]
        detail = f"{len(ratings)} screened" if ratings else "signal scores only"
        return {"finalists": finalists, "trace": [step("supervisor", f"picked {len(finalists)} finalists of {len(req.candidates)}", ms=(time.perf_counter() - started) * 1000, tool="fused score", detail=detail)]}

    async def judge(state: RunState) -> dict:
        req, finalists = state["request"], state["finalists"]
        ids = {c.id for c in finalists}

        def valid(d: dict) -> None:
            # One bad row doesn't sink the answer: it's dropped below, as long as some rows are usable.
            usable = 0
            for row in d["verdicts"]:
                try:
                    usable += Verdict(**row).id in ids
                except (ValidationError, TypeError, ValueError):
                    continue
            if not usable:
                raise ValueError("no usable verdict for any finalist")

        user = prompts.judge_user(req.source_name, finalists, state.get("ratings", {}))
        try:
            reply = await models.ask(STRONG, prompts.judge_system(req.length), user, max_tokens=110 * len(finalists) + 100, validate=valid)
        except ModelError as err:
            fails = [step("judge", f"judge {len(finalists)} finalists", "fallback", tool=m, detail=why) for m, why in err.attempts]
            return {"error": str(err), "trace": fails + [step("judge", f"judge {len(finalists)} finalists", "failed", detail=str(err))]}
        verdicts = []
        for row in reply.data["verdicts"]:
            try:
                v = Verdict(**row)
            except (ValidationError, TypeError, ValueError):
                continue
            if v.id in ids:
                verdicts.append(v.model_dump())
        kept = sum(v["keep"] for v in verdicts)
        return {"verdicts": verdicts, "tokens": reply.tokens, "trace": model_steps("judge", f"judged {len(finalists)} finalists, kept {kept}", reply)}

    def after_judge(state: RunState):
        return END if state.get("error") else "reviewer"

    async def reviewer(state: RunState) -> dict:
        verdicts, ratings = state["verdicts"], state.get("ratings", {})
        # Rules first: a clip the judge kept but the screener rated very low is the person's call.
        flags = {
            v["id"]: f"the judge kept it but the screener rated it {ratings[v['id']]['s']}/10"
            for v in verdicts
            if v["keep"] and v["id"] in ratings and ratings[v["id"]]["s"] <= DISAGREE_LOW
        }
        trace = [step("reviewer", f"checked {len(verdicts)} verdicts against the screener", tool="rules", detail=f"{len(flags)} sent to the person")]
        kept = [v for v in verdicts if v["keep"]]
        if not kept or state.get("tokens", 0) > max_run_tokens:
            return {"flags": flags, "trace": trace + [step("reviewer", "polish titles", "skipped", detail="nothing kept" if not kept else "token budget")]}
        try:
            reply = await models.ask(FAST, prompts.REVIEWER_SYSTEM, prompts.reviewer_user(verdicts), max_tokens=40 * len(kept) + 40, validate=lambda d: list(d["fix"]))
        except ModelError as err:
            return {"flags": flags, "trace": trace + [step("reviewer", "polish titles", "failed", detail=str(err))]}
        by_id = {v["id"]: v for v in verdicts}
        fixed = 0
        for fix in reply.data.get("fix", []):
            v = by_id.get(fix.get("id")) if isinstance(fix, dict) else None
            if not v:
                continue
            title, hook = str(fix.get("title") or "").strip(), str(fix.get("hook") or "").strip()
            if title and len(title) <= 70 and title != v["title"]:
                v["title"], fixed = title, fixed + 1
            if hook and len(hook.split()) <= 8 and hook != v["hook"]:
                v["hook"], fixed = hook, fixed + 1
        polished = model_steps("reviewer", f"polished {fixed} titles and hooks", reply)
        return {"verdicts": list(by_id.values()), "flags": flags, "tokens": reply.tokens, "trace": trace + polished}

    g = StateGraph(RunState)
    g.add_node("planner", planner)
    g.add_node("screener", screener)
    g.add_node("supervisor", supervisor)
    g.add_node("judge", judge)
    g.add_node("reviewer", reviewer)
    g.add_edge(START, "planner")
    g.add_conditional_edges("planner", fan_out, ["screener", "supervisor"])
    g.add_edge("screener", "supervisor")
    g.add_edge("supervisor", "judge")
    g.add_conditional_edges("judge", after_judge, ["reviewer", END])
    g.add_edge("reviewer", END)
    return g.compile()
