/**
 * Client for the LangGraph agents backend (backend/ in this repo). Only text is sent: signal numbers,
 * transcripts and chat lines, never audio or video. When the backend isn't running, the run uses the
 * agents that live in the browser, exactly as before.
 */
import type { Candidate, ClipLength } from "./types";
import type { AgentName, TraceStep } from "./agents.ts";
import type { Verdict } from "./selection.ts";
import { noticed } from "./moments.ts";

// Guarded: a worker has no `process` unless the bundler inlined the value.
export const AGENT_API = ((typeof process !== "undefined" ? process.env.NEXT_PUBLIC_AGENT_API : undefined) ?? "http://localhost:8000").replace(/\/$/, "");
const HEALTH_TIMEOUT_MS = 1500;

/** True when the backend answers and has its model keys. Never throws. */
export async function backendReady(): Promise<boolean> {
  try {
    const res = await fetch(`${AGENT_API}/health`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    return res.ok && Boolean(((await res.json()) as { ok?: boolean }).ok);
  } catch {
    return false;
  }
}

const round = (n: number, places = 2) => Math.round(n * 10 ** places) / 10 ** places;

/** The compact form the agents read: rounded numbers, times relative to the window. */
export function toAgentCandidate(c: Candidate) {
  return {
    id: c.id,
    score: round(Math.min(1, Math.max(0, c.score))),
    voice: round(c.voice),
    chat: c.chat === null ? null : round(c.chat),
    laughter: c.laughter === null ? null : round(c.laughter),
    shout: c.shout === null ? null : round(c.shout),
    window: round(Math.max(0.1, c.windowEnd - c.windowStart), 1),
    peak: round(Math.max(0, c.peakSec - c.windowStart), 1),
    notes: noticed(c.extra).filter((n) => !n.startsWith("heard") && !n.startsWith("on screen")),
    screen: c.extra?.screenWords ?? [],
    words: c.words.map((w) => [round(Math.max(0, w.start - c.windowStart), 1), w.text] as [number, string]),
    chat_sample: c.chatSample,
  };
}

const AGENTS: ReadonlySet<string> = new Set<AgentName>(["planner", "screener", "supervisor", "judge", "reviewer"]);

export interface AgentVerdicts {
  verdicts: Verdict[];
  /** Moment id → why the reviewer wants a person to look. */
  flags: Map<number, string>;
  tokens: number;
}

/** Runs the agent graph, reporting each agent step as it finishes. Throws if the graph fails, so the caller can fall back. */
export async function judgeWithAgents(candidates: Candidate[], clipCount: number, length: ClipLength, sourceName: string, onStep: (step: TraceStep) => void): Promise<AgentVerdicts> {
  const res = await fetch(`${AGENT_API}/agents/judge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clip_count: clipCount, length, source_name: sourceName, candidates: candidates.map(toAgentCandidate) }),
  });
  if (!res.ok || !res.body) throw new Error(`The agents backend returned ${res.status}.`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (value) buffer += value;
    const lines = buffer.split("\n");
    buffer = done ? "" : (lines.pop() ?? "");
    for (const line of lines) {
      if (!line.trim()) continue;
      const event = JSON.parse(line) as
        | { type: "step"; step: TraceStep }
        | { type: "result"; verdicts: Verdict[]; flags: Record<string, string>; tokens: number }
        | { type: "error"; message: string };
      if (event.type === "step") {
        if (AGENTS.has(event.step.agent)) onStep(event.step);
      } else if (event.type === "error") {
        throw new Error(`The agents couldn’t judge: ${event.message}`);
      } else {
        return { verdicts: event.verdicts, flags: new Map(Object.entries(event.flags).map(([id, why]) => [Number(id), why])), tokens: event.tokens };
      }
    }
    if (done) throw new Error("The agents backend closed without an answer.");
  }
}
