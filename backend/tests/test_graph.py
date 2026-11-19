"""Graph behaviour with fake models: no keys, no network."""
import asyncio
import json
from pathlib import Path

from app.cache import AnswerCache
from app.config import Settings
from app.graph import build_graph
from app.llm import Models, parse_json
from app.schemas import JudgeRequest


def settings(tmp: Path, budget: int = 24000) -> Settings:
    return Settings("", "", "fast-model", "strong-model", "unused-backup", "strong-backup", budget, tmp / "cache.sqlite")


def request(n: int, clip_count: int = 3) -> JudgeRequest:
    return JudgeRequest(
        clip_count=clip_count,
        candidates=[
            {"id": i, "score": round(1 - i / (n + 1), 2), "voice": 0.5, "window": 60, "peak": 30, "words": [[29.0 + k, w] for k, w in enumerate(["no", "way", "bro"])]}
            for i in range(n)
        ],
    )


class Fake:
    """Answers like each agent would, and counts calls per model."""

    def __init__(self, broken: set = frozenset(), finalists: int = 4):
        self.calls: dict[str, int] = {}
        self.broken = broken
        self.finalists = finalists

    def __call__(self, provider: str, model: str):
        async def chat(system: str, user: str, max_tokens: int):
            self.calls[model] = self.calls.get(model, 0) + 1
            if model in self.broken:
                raise RuntimeError("401 invalid api key")
            if system.startswith("You plan"):
                return json.dumps({"finalists": self.finalists, "why": "clear leaders"}), 50, 10
            if system.startswith("You screen"):
                ids = [int(line.split("|")[0]) for line in user.splitlines()]
                return json.dumps({"r": [{"id": i, "s": 9 if i < 3 else (1 if i == 3 else 4), "w": "ok"} for i in ids]}), 300, 80
            if system.startswith("You are a short-form editor"):
                ids = [int(part.split('"')[0]) for part in user.split('<candidate id="')[1:]]
                return json.dumps({"verdicts": [{"id": i, "keep": True, "score": 80, "moment_type": "funny", "start_offset": 10, "end_offset": 40, "title": f"Clip {i}", "hook": "no way", "reason": "he shouts"} for i in ids]}), 900, 300
            if system.startswith("You review"):
                return json.dumps({"fix": [{"id": 0, "title": "A better title"}]}), 100, 20
            raise AssertionError("unknown agent")

        return chat


def run(models: Models, req: JudgeRequest, budget: int = 24000) -> dict:
    graph = build_graph(models, budget)
    return asyncio.run(graph.ainvoke({"request": req}))


def test_many_moments_are_screened_in_parallel_batches_then_judged_and_reviewed(tmp_path):
    fake = Fake()
    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=fake)
    out = run(models, request(25))
    agents = [s["agent"] for s in out["trace"]]
    assert agents.count("screener") == 3  # 25 moments in batches of 10
    assert len(out["finalists"]) == 4  # the planner's choice, within the allowed range
    assert out["verdicts"] and out["verdicts"][0]["title"] == "A better title"  # reviewer fix applied
    assert out["tokens"] > 0
    assert fake.calls["strong-model"] == 1  # one batched judge call, not one per moment


def test_few_moments_skip_the_planner_model_and_the_screener(tmp_path):
    fake = Fake()
    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=fake)
    out = run(models, request(4))
    assert not any(s["agent"] == "screener" for s in out["trace"])
    assert out["trace"][0]["tool"] == "rules"
    assert "fast-model" in fake.calls  # only the reviewer used it
    assert fake.calls["fast-model"] == 1


def test_a_broken_judge_model_falls_back_to_the_next_one(tmp_path):
    fake = Fake(broken={"strong-model"})
    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=fake)
    out = run(models, request(4))
    judge = [s for s in out["trace"] if s["agent"] == "judge"]
    assert [s["status"] for s in judge] == ["fallback", "ok"]
    assert judge[0]["detail"].startswith("auth")
    assert judge[1]["tool"] == "strong-backup"


def test_when_every_judge_fails_the_graph_stops_with_an_error_for_the_browser(tmp_path):
    fake = Fake(broken={"strong-model", "strong-backup"})
    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=fake)
    out = run(models, request(4))
    assert out.get("error")
    assert not any(s["agent"] == "reviewer" for s in out["trace"])


def test_a_repeated_run_is_answered_from_the_cache_with_zero_tokens(tmp_path):
    fake = Fake()
    cache = AnswerCache(tmp_path / "c.sqlite")
    run(Models(settings(tmp_path), cache, chat_factory=fake), request(25))
    first = dict(fake.calls)
    out = run(Models(settings(tmp_path), cache, chat_factory=fake), request(25))
    assert fake.calls == first
    assert out.get("tokens", 0) == 0


def test_a_kept_clip_the_screener_rated_very_low_goes_to_the_person(tmp_path):
    fake = Fake(finalists=8)
    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=fake)
    out = run(models, request(12, clip_count=4))
    # Moment 3 is rated 1/10 by the screener but still makes the 8 finalists on its signal score, and the judge keeps it.
    assert 3 in [c.id for c in out["finalists"]]
    assert "screener rated it 1/10" in out["flags"][3]
    assert all(i not in out["flags"] for i in (0, 1, 2))


def test_one_bad_verdict_is_dropped_and_near_misses_are_corrected(tmp_path):
    from app.schemas import Verdict

    v = Verdict(id=1, keep=True, score=105, moment_type="funny", start_offset=-0.4, end_offset=30, title=" Hi ", hook="no way", reason="r")
    assert (v.score, v.start_offset, v.title) == (100, 0.0, "Hi")

    class HalfBad(Fake):
        def __call__(self, provider, model):
            inner = super().__call__(provider, model)

            async def chat(system, user, max_tokens):
                text, a, b = await inner(system, user, max_tokens)
                if system.startswith("You are a short-form editor"):
                    data = json.loads(text)
                    data["verdicts"][0]["end_offset"] = "soon"  # unusable row
                    text = json.dumps(data)
                return text, a, b

            return chat

    models = Models(settings(tmp_path), AnswerCache(tmp_path / "c.sqlite"), chat_factory=HalfBad())
    out = run(models, request(4))
    assert len(out["verdicts"]) == 3 and not out.get("error")


def test_answers_wrapped_in_fences_or_sentences_still_parse():
    assert parse_json('```json\n{"a": 1}\n```') == {"a": 1}
    assert parse_json('Here you go: {"a": {"b": 2}} thanks') == {"a": {"b": 2}}
