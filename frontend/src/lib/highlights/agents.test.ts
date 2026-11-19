import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_ATTEMPTS, ToolChain, Trace, classifyError, planRun, routeMoment, routeMoments, summarizeTrace, type Tool } from "./agents.ts";
import type { Candidate, SelectedMoment } from "./types";

const noWait = { wait: async () => undefined };

function moment(score: number, signals: Partial<Candidate> = {}, selectedBy: SelectedMoment["selectedBy"] = "signals"): SelectedMoment {
  const candidate: Candidate = { id: 0, peakSec: 100, windowStart: 80, windowEnd: 140, score: score / 100, voice: 0, loudness: 0, chat: null, laughter: null, shout: null, chatSample: [], words: [], ...signals };
  return { candidate, startSec: 90, endSec: 120, score, momentType: "funny", title: "t", hook: "h", reason: "r", selectedBy };
}

test("errors are sorted into kinds the chain can act on", () => {
  assert.equal(classifyError(new Error("Groq rejected the API key.")), "auth");
  assert.equal(classifyError(new Error("Gemini returned 429: quota")), "rate-limit");
  assert.equal(classifyError(new TypeError("Failed to fetch")), "network");
  assert.equal(classifyError(new Error("OpenAI returned 503: overloaded")), "unavailable");
  assert.equal(classifyError(new Error("The model didn’t approve any moment.")), "bad-output");
  assert.equal(classifyError(new Error("something odd")), "unknown");
});

test("a dropped connection is retried at most three times, then the chain falls back", async () => {
  const trace = new Trace();
  let calls = 0;
  const flaky: Tool<number, string> = { name: "cloud", run: async () => { calls++; throw new TypeError("Failed to fetch"); } };
  const local: Tool<number, string> = { name: "local", run: async (n) => `local ${n}` };
  const out = await new ToolChain("transcriber", [flaky, local], trace, noWait).call("moment 1", 7);
  assert.deepEqual(out, { output: "local 7", tool: "local" });
  assert.equal(calls, MAX_ATTEMPTS);
  assert.deepEqual(trace.steps.map((s) => [s.tool, s.status, s.attempts]), [["cloud", "fallback", 3], ["local", "ok", 1]]);
});

test("a retry that works is recorded as retried, with its attempt count", async () => {
  const trace = new Trace();
  let calls = 0;
  const tool: Tool<null, string> = { name: "cloud", run: async () => { if (++calls < 2) throw new TypeError("Failed to fetch"); return "words"; } };
  await new ToolChain("transcriber", [tool], trace, noWait).call("moment", null);
  assert.equal(trace.steps[0].status, "retried");
  assert.equal(trace.steps[0].attempts, 2);
  assert.equal(summarizeTrace(trace.steps).retries, 1);
});

test("a bad key is never retried, and the tool is switched off for the rest of the run", async () => {
  const trace = new Trace();
  let calls = 0;
  const cloud: Tool<null, string> = { name: "cloud", run: async () => { calls++; throw new Error("Groq rejected the API key."); } };
  const local: Tool<null, string> = { name: "local", run: async () => "ok" };
  const chain = new ToolChain("transcriber", [cloud, local], trace, noWait);
  await chain.call("moment 1", null);
  await chain.call("moment 2", null);
  assert.equal(calls, 1);
  assert.deepEqual(trace.steps.map((s) => s.tool), ["cloud", "local", "local"]);
});

test("when every tool fails, the last error comes back and the trace says failed", async () => {
  const trace = new Trace();
  const bad: Tool<null, string> = { name: "only", run: async () => { throw new Error("broken"); } };
  await assert.rejects(new ToolChain("judge", [bad], trace, noWait).call("pick", null), /broken/);
  assert.equal(trace.steps[0].status, "failed");
});

test("the planner adds agents only when the settings call for them, and always the same way", () => {
  const free = planRun({ hasChat: false, stt: "local", watchVideo: false, clipCount: 5 });
  assert.deepEqual(free.map((s) => s.agent), ["listener", "reactions", "transcriber", "ranker", "judge", "router", "editor"]);
  assert.deepEqual(free.find((s) => s.agent === "judge")?.tools, ["signal ranker"]);
  const full = planRun({ hasChat: true, stt: "groq", llm: { provider: "gemini", model: "gemini-flash-latest" }, watchVideo: true, clipCount: 5 });
  assert.ok(full.some((s) => s.agent === "chat") && full.some((s) => s.agent === "watcher"));
  assert.deepEqual(full.find((s) => s.agent === "transcriber")?.tools, ["groq whisper", "whisper (on this device)"]);
  assert.deepEqual(full.find((s) => s.agent === "judge")?.tools, ["gemini-flash-latest", "signal ranker"]);
  assert.deepEqual(planRun({ hasChat: true, stt: "groq", watchVideo: true, clipCount: 3 }), planRun({ hasChat: true, stt: "groq", watchVideo: true, clipCount: 3 }));
});

test("the router keeps well-backed clips and sends unsure ones to the person", () => {
  assert.deepEqual(routeMoment(moment(85, { voice: 0.9, laughter: 0.8 })), { route: "keep", confidence: "high", why: "85/100, backed by voice excitement, laughter" });
  assert.equal(routeMoment(moment(60, { voice: 0.7 })).confidence, "medium");
  assert.equal(routeMoment(moment(60, { voice: 0.3 })).route, "review");
  assert.equal(routeMoment(moment(20, { voice: 0.9 })).route, "drop");
});

test("when the AI judge and the signals disagree, a person decides", () => {
  const decision = routeMoment(moment(90, { voice: 0.9, laughter: 0.9, score: 0.4 }, "llm"));
  assert.equal(decision.route, "review");
  assert.match(decision.why, /AI judge gave 90\/100 but the signals gave 40\/100/);
});

test("drops never leave a run with no clips", () => {
  const all = routeMoments([moment(10), moment(20)]);
  assert.equal(all.dropped.length, 0);
  assert.ok(all.kept.every((r) => r.decision.route === "review"));
  const some = routeMoments([moment(85, { voice: 0.9, laughter: 0.8 }), moment(10)]);
  assert.equal(some.kept.length, 1);
  assert.equal(some.dropped.length, 1);
});

test("with the agents backend up, the judge tries the agent team first and keeps the in-browser judges as fallbacks", () => {
  const plan = planRun({ hasChat: false, stt: "local", llm: { provider: "gemini", model: "gemini-flash-latest" }, watchVideo: false, clipCount: 5, backend: true });
  assert.deepEqual(plan.find((s) => s.agent === "judge")?.tools, ["langgraph agents", "gemini-flash-latest", "signal ranker"]);
  const off = planRun({ hasChat: false, stt: "local", watchVideo: false, clipCount: 5, backend: false });
  assert.deepEqual(off.find((s) => s.agent === "judge")?.tools, ["signal ranker"]);
});

test("a moment the backend reviewer flagged goes to the person even with a high score", () => {
  const strong = moment(90, { voice: 0.9, laughter: 0.9 });
  assert.equal(routeMoments([strong]).kept[0].decision.route, "keep");
  const flagged = routeMoments([strong], new Map([[0, "the judge kept it but the screener rated it 2/10"]]));
  assert.deepEqual(flagged.kept[0].decision, { route: "review", confidence: "low", why: "the judge kept it but the screener rated it 2/10" });
});

test("model tokens from backend steps add up in the trace totals", () => {
  const totals = summarizeTrace([
    { agent: "screener", action: "a", status: "ok", ms: 5, tokens: 300 },
    { agent: "judge", action: "b", status: "ok", ms: 9, tokens: 1200 },
    { agent: "editor", action: "c", status: "ok", ms: 1 },
  ]);
  assert.equal(totals.tokens, 1500);
});
