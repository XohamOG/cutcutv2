"use client";

import { AGENT_LABELS, summarizeTrace, type AgentName, type PlanStep, type TraceStep } from "@/lib/highlights/agents";
import styles from "./app.module.css";

type AgentState = "waiting" | "working" | "done" | "fell back" | "skipped" | "failed";

/** Which agent owns each progress stage the worker reports. */
const STAGE_AGENT: Record<string, AgentName> = {
  measuring: "listener",
  reactions: "reactions",
  transcribing: "transcriber",
  watching: "watcher",
  judging: "judge",
  rendering: "editor",
};

function stateOf(agent: AgentName, trace: TraceStep[], working: boolean): AgentState {
  if (working) return "working";
  const steps = trace.filter((s) => s.agent === agent);
  if (!steps.length) return "waiting";
  if (steps.some((s) => s.status === "fallback")) return "fell back";
  if (steps.every((s) => s.status === "skipped")) return "skipped";
  if (steps.every((s) => s.status === "failed")) return "failed";
  return "done";
}

/** The tool an agent is using now: after a fallback, the next one in its plan. */
function toolOf(step: PlanStep, trace: TraceStep[]): string {
  const last = [...trace].reverse().find((s) => s.agent === step.agent && s.tool);
  if (!last) return step.tools[0];
  if (last.status !== "fallback") return last.tool ?? step.tools[0];
  return step.tools[step.tools.indexOf(last.tool ?? "") + 1] ?? last.tool ?? step.tools[0];
}

/** Live view of the Planner's agents while a run is going. */
export function AgentBoard({ plan, trace, stage }: { plan: PlanStep[]; trace: TraceStep[]; stage: string | null }) {
  if (!plan.length) return null;
  const working = stage ? STAGE_AGENT[stage] : undefined;
  return (
    <ol className={styles.agentList} aria-label="Agents in this run">
      {plan.map((step) => {
        const state = stateOf(step.agent, trace, step.agent === working);
        const fellBack = trace.some((s) => s.agent === step.agent && s.status === "fallback");
        return (
          <li key={step.agent} className={styles.agentRow} data-state={state}>
            <span className={styles.agentDot} aria-hidden />
            <span className={styles.agentName}>{AGENT_LABELS[step.agent]}</span>
            <span className={styles.agentTool}>{toolOf(step, trace)}</span>
            <span className={styles.agentState}>{state === "working" && fellBack ? "working, fell back" : state}</span>
          </li>
        );
      })}
    </ol>
  );
}

const seconds = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`);

/** The whole run as the agents saw it: the plan, the totals and every step. */
export function RunTraceView({ plan, trace }: { plan: PlanStep[]; trace: TraceStep[] }) {
  const totals = summarizeTrace(trace);
  const slowest = Object.entries(totals.msByAgent).sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className={styles.group}>
      <p className={styles.caption}>
        {totals.steps} steps · {totals.toolCalls} tool calls · {totals.retries} retries · {totals.fallbacks} fallbacks · {totals.failures} failures
      </p>
      {slowest.length > 0 && (
        <p className={styles.caption}>Most time: {slowest.map(([agent, ms]) => `${AGENT_LABELS[agent as AgentName]} ${seconds(ms)}`).join(", ")}</p>
      )}
      <span className={styles.settingTitle}>plan</span>
      <ol className={styles.traceList}>
        {plan.map((p) => (
          <li key={p.agent}>
            <b>{AGENT_LABELS[p.agent]}</b> {p.task}. Tools: {p.tools.join(" → ")}. <span className={styles.traceWhy}>{p.why}</span>
          </li>
        ))}
      </ol>
      <span className={styles.settingTitle}>steps</span>
      <ol className={styles.traceList}>
        {trace.map((s, i) => (
          <li key={i} data-status={s.status}>
            <b>{AGENT_LABELS[s.agent]}</b> {s.action}
            {s.tool ? ` · ${s.tool}` : ""} · <span className={styles.traceStatus}>{s.status}{s.attempts && s.attempts > 1 ? ` after ${s.attempts} tries` : ""}</span> · {seconds(s.ms)}
            {s.detail && <span className={styles.traceWhy}> {s.detail}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
