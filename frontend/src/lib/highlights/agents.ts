/**
 * The agent layer of a run: a Planner decides which agents and tools a run needs, every agent's work is
 * recorded in one trace, tools are called through contracts with retries and fallbacks, and a Router
 * decides which clips can be kept automatically and which need a person to look.
 */
import type { Candidate, LlmProvider, SelectedMoment, SttProvider } from "./types";
import { signalsOf } from "./selection.ts";

/** The last four after "judge" run in the LangGraph backend when it is up. */
export type AgentName = "planner" | "listener" | "chat" | "reactions" | "transcriber" | "watcher" | "ranker" | "judge" | "router" | "editor" | "screener" | "supervisor" | "reviewer";

export const AGENT_LABELS: Record<AgentName, string> = {
  planner: "Planner",
  listener: "Listener",
  chat: "Chat reader",
  reactions: "Reaction detector",
  transcriber: "Transcriber",
  watcher: "Watcher",
  ranker: "Ranker",
  judge: "Judge",
  router: "Router",
  editor: "Editor",
  screener: "Screener",
  supervisor: "Supervisor",
  reviewer: "Reviewer",
};

// ---------------------------------------------------------------- trace (observability)

export type StepStatus = "ok" | "retried" | "fallback" | "failed" | "skipped";

export interface TraceStep {
  agent: AgentName;
  action: string;
  status: StepStatus;
  /** Milliseconds the step took. */
  ms: number;
  tool?: string;
  attempts?: number;
  detail?: string;
  /** Model tokens the step spent (backend agents only). */
  tokens?: number;
}

/** Every agent step in one run, in order. Never holds keys, file names or transcripts. */
export class Trace {
  readonly steps: TraceStep[] = [];
  private readonly onStep?: (step: TraceStep) => void;
  constructor(onStep?: (step: TraceStep) => void) {
    this.onStep = onStep;
  }

  add(step: TraceStep): void {
    const clean = { ...step, ms: Math.round(step.ms), ...(step.detail ? { detail: step.detail.slice(0, 160) } : {}) };
    this.steps.push(clean);
    this.onStep?.(clean);
  }

  /** Runs one agent step and records how long it took and whether it failed. */
  async time<T>(agent: AgentName, action: string, work: () => Promise<T>, tool?: string): Promise<T> {
    const started = performance.now();
    try {
      const out = await work();
      this.add({ agent, action, tool, status: "ok", ms: performance.now() - started });
      return out;
    } catch (err) {
      this.add({ agent, action, tool, status: "failed", ms: performance.now() - started, detail: errorText(err) });
      throw err;
    }
  }
}

export interface TraceTotals {
  steps: number;
  toolCalls: number;
  retries: number;
  fallbacks: number;
  failures: number;
  tokens: number;
  msByAgent: Partial<Record<AgentName, number>>;
}

export function summarizeTrace(steps: TraceStep[]): TraceTotals {
  const msByAgent: Partial<Record<AgentName, number>> = {};
  for (const s of steps) msByAgent[s.agent] = (msByAgent[s.agent] ?? 0) + s.ms;
  return {
    steps: steps.length,
    toolCalls: steps.filter((s) => s.tool).length,
    retries: steps.reduce((n, s) => n + Math.max(0, (s.attempts ?? 1) - 1), 0),
    fallbacks: steps.filter((s) => s.status === "fallback").length,
    failures: steps.filter((s) => s.status === "failed").length,
    tokens: steps.reduce((n, s) => n + (s.tokens ?? 0), 0),
    msByAgent,
  };
}

// ---------------------------------------------------------------- tool contracts, retries and fallbacks

export type ErrorKind = "auth" | "rate-limit" | "network" | "unavailable" | "bad-output" | "unknown";

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

/** Sorts a failure into a kind, so the chain knows whether trying again can help. */
export function classifyError(err: unknown): ErrorKind {
  const text = errorText(err);
  if (/rejected the API key|invalid.{0,20}key|unauthori[sz]ed|\b40[13]\b/i.test(text)) return "auth";
  if (/\b429\b|rate.?limit|quota/i.test(text)) return "rate-limit";
  if (/failed to fetch|networkerror|network error|load failed|timed? ?out|offline/i.test(text)) return "network";
  if (/\b5\d\d\b|overloaded|unavailable/i.test(text)) return "unavailable";
  if (/json|couldn.t be read|didn.t (return|approve)|unexpected token/i.test(text)) return "bad-output";
  return "unknown";
}

/**
 * Only a dropped connection is retried here. Busy servers (429, 5xx) are already retried with backoff by
 * the HTTP layer in providers.ts, so retrying them again would multiply the waits. A bad key or a bad
 * answer would fail the same way again, so those go straight to the fallback.
 */
export const RETRYABLE: ReadonlySet<ErrorKind> = new Set(["network"]);
/** After one of these, the tool is left out for the rest of the run instead of failing on every moment. */
const BREAKS_CIRCUIT: ReadonlySet<ErrorKind> = new Set(["auth", "rate-limit"]);

export const MAX_ATTEMPTS = 3;

/** One tool an agent can use. `run` must throw on failure; an answer that can't be used counts as a failure. */
export interface Tool<I, O> {
  name: string;
  run: (input: I) => Promise<O>;
}

export interface ChainOptions {
  maxAttempts?: number;
  /** Waits between attempts; replaceable so tests don't sleep. */
  wait?: (ms: number) => Promise<void>;
  baseDelayMs?: number;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Tries each tool in order. A tool is retried (exponential backoff, at most `maxAttempts` tries) only for
 * errors that can pass; otherwise the chain falls back to the next tool. A tool that fails on its key or
 * its quota is switched off for the rest of the run.
 */
export class ToolChain<I, O> {
  private readonly broken = new Set<string>();
  readonly agent: AgentName;
  private readonly tools: Tool<I, O>[];
  private readonly trace: Trace;
  private readonly options: ChainOptions;
  constructor(agent: AgentName, tools: Tool<I, O>[], trace: Trace, options: ChainOptions = {}) {
    this.agent = agent;
    this.tools = tools;
    this.trace = trace;
    this.options = options;
  }

  get names(): string[] {
    return this.tools.map((t) => t.name);
  }

  async call(action: string, input: I): Promise<{ output: O; tool: string }> {
    const { maxAttempts = MAX_ATTEMPTS, wait = sleep, baseDelayMs = 1000 } = this.options;
    const usable = this.tools.filter((t) => !this.broken.has(t.name));
    let lastError: unknown = new Error(`No ${AGENT_LABELS[this.agent].toLowerCase()} tool is available.`);
    for (const [i, tool] of usable.entries()) {
      const started = performance.now();
      for (let attempt = 1; ; attempt++) {
        try {
          const output = await tool.run(input);
          this.trace.add({ agent: this.agent, action, tool: tool.name, status: attempt > 1 ? "retried" : "ok", attempts: attempt, ms: performance.now() - started });
          return { output, tool: tool.name };
        } catch (err) {
          lastError = err;
          const kind = classifyError(err);
          if (RETRYABLE.has(kind) && attempt < maxAttempts) {
            await wait(baseDelayMs * 2 ** (attempt - 1));
            continue;
          }
          if (BREAKS_CIRCUIT.has(kind)) this.broken.add(tool.name);
          const next = usable[i + 1];
          this.trace.add({
            agent: this.agent,
            action,
            tool: tool.name,
            status: next ? "fallback" : "failed",
            attempts: attempt,
            ms: performance.now() - started,
            detail: `${kind}: ${errorText(err)}${next ? ` → ${next.name}` : ""}`,
          });
          break;
        }
      }
    }
    throw lastError;
  }
}

// ---------------------------------------------------------------- planner

export interface PlanStep {
  agent: AgentName;
  task: string;
  /** Tools in the order they'll be tried. */
  tools: string[];
  why: string;
}

export interface PlanInput {
  hasChat: boolean;
  stt: SttProvider;
  llm?: { provider: LlmProvider; model: string };
  watchVideo: boolean;
  clipCount: number;
  /** The LangGraph agents backend answered its health check. */
  backend?: boolean;
}

const STT_NAMES: Record<SttProvider, string> = { local: "whisper (on this device)", groq: "groq whisper", openai: "openai whisper" };
export const LOCAL_STT = STT_NAMES.local;
export const sttToolName = (provider: SttProvider) => STT_NAMES[provider];
export const SIGNAL_RANKER = "signal ranker";
export const BACKEND_AGENTS = "langgraph agents";

/** Decides, before any work starts, which agents run and which tools each one tries. The same settings always give the same plan. */
export function planRun(input: PlanInput): PlanStep[] {
  const steps: PlanStep[] = [
    { agent: "listener", task: "measure voice, loudness and pitch every second", tools: ["audio analysis (on this device)"], why: "every run starts from the sound" },
  ];
  if (input.hasChat) steps.push({ agent: "chat", task: "score chat surges and repeated lines", tools: ["chat replay parser"], why: "a chat replay was added" });
  steps.push({ agent: "reactions", task: "listen for laughter and shouting at each peak", tools: ["audioset model (on this device)"], why: "reactions separate real moments from loud gameplay" });
  steps.push({
    agent: "transcriber",
    task: "write down the words around each moment",
    tools: input.stt === "local" ? [LOCAL_STT] : [STT_NAMES[input.stt], LOCAL_STT],
    why: input.stt === "local" ? "no transcription key, so the free English model is used" : `${input.stt} handles any language; the local model is the fallback`,
  });
  if (input.watchVideo) steps.push({ agent: "watcher", task: "look at the picture around the strongest moments", tools: ["face and motion model", "screen text reader"], why: "watching the video is turned on" });
  steps.push({ agent: "ranker", task: "fuse every signal and your past ratings into one ranking", tools: ["weighted signal fusion"], why: "keeps the strongest moments as finalists" });
  const judgeTools = [...(input.backend ? [BACKEND_AGENTS] : []), ...(input.llm ? [input.llm.model] : []), SIGNAL_RANKER];
  steps.push(
    input.backend
      ? { agent: "judge", task: `hand the finalists to the agent team (planner, screeners, judge, reviewer) and pick ${input.clipCount}`, tools: judgeTools, why: "the LangGraph backend is running; the in-browser judges are the fallback" }
      : input.llm
        ? { agent: "judge", task: `review the finalists and pick ${input.clipCount}`, tools: judgeTools, why: "an AI key was added; the signal ranker is the fallback" }
        : { agent: "judge", task: `pick the top ${input.clipCount}`, tools: judgeTools, why: "no AI key, so picks come from the signals alone" }
  );
  steps.push({ agent: "router", task: "score confidence and send unsure clips to you", tools: ["confidence rules"], why: "a person decides when the agents disagree" });
  steps.push({ agent: "editor", task: "cut, frame and caption each clip", tools: ["webcodecs renderer"], why: "clips are made on this device" });
  return steps;
}

// ---------------------------------------------------------------- router (confidence and human review)

export type Route = "keep" | "review" | "drop";
export type Confidence = "high" | "medium" | "low";

export interface RouteDecision {
  route: Route;
  confidence: Confidence;
  why: string;
}

/** A signal this strong counts as evidence on its own. */
const STRONG_SIGNAL = 0.6;
const HIGH_SCORE = 70;
const LOW_SCORE = 45;
/** Below this, a clip is dropped, as long as another clip is left. */
export const DROP_SCORE = 30;
/** How far the AI judge's score may sit from the signals' own score before a person is asked. */
export const DISAGREEMENT = 35;

function strongSignals(c: Candidate): string[] {
  return signalsOf(c).filter((s) => s.value >= STRONG_SIGNAL).map((s) => s.label);
}

/** Rule-based: the same moment always gets the same decision, with a reason a person can check. */
export function routeMoment(m: SelectedMoment): RouteDecision {
  const strong = strongSignals(m.candidate);
  const signalScore = Math.round(m.candidate.score * 100);
  if (m.score < DROP_SCORE) return { route: "drop", confidence: "low", why: `scored ${m.score}/100, below the ${DROP_SCORE} floor` };
  if (m.selectedBy === "llm" && Math.abs(m.score - signalScore) > DISAGREEMENT) {
    return { route: "review", confidence: "low", why: `the AI judge gave ${m.score}/100 but the signals gave ${signalScore}/100` };
  }
  if (m.score >= HIGH_SCORE && strong.length >= 2) return { route: "keep", confidence: "high", why: `${m.score}/100, backed by ${strong.slice(0, 3).join(", ")}` };
  if (m.score < LOW_SCORE || !strong.length) {
    return { route: "review", confidence: "low", why: strong.length ? `only ${m.score}/100` : "no single signal was strong" };
  }
  return { route: "keep", confidence: "medium", why: `${m.score}/100, backed by ${strong.join(", ")}` };
}

export interface Routed {
  moment: SelectedMoment;
  decision: RouteDecision;
}

/**
 * Routes every moment. Drops are only carried out while at least one clip remains.
 * `flags` are moments the backend Reviewer wants a person to look at; they go to review whatever their score.
 */
export function routeMoments(moments: SelectedMoment[], flags: ReadonlyMap<number, string> = new Map()): { kept: Routed[]; dropped: Routed[] } {
  const all = moments.map((moment): Routed => {
    const flagged = flags.get(moment.candidate.id);
    return { moment, decision: flagged ? { route: "review", confidence: "low", why: flagged } : routeMoment(moment) };
  });
  const survivors = all.filter((r) => r.decision.route !== "drop");
  if (!survivors.length) return { kept: all.map((r) => ({ ...r, decision: { route: "review", confidence: "low", why: r.decision.why } })), dropped: [] };
  return { kept: survivors, dropped: all.filter((r) => r.decision.route === "drop") };
}
