import { SITE } from "./site.ts";

const ENDPOINT = "https://api.web3forms.com/submit";
const ANONYMOUS = "Anonymous";

export type ReportKind = "problem" | "feedback";

export interface ReportInput {
  kind: ReportKind;
  name: string;
  note: string;
  error: string | null;
  stage: string | null;
  warnings: string[];
  fileSizeMb: number | null;
  template: string | null;
  userAgent: string;
  hasGpu: boolean;
  /** API keys the user entered, scrubbed from anything sent. */
  secrets: string[];
}

export interface Report {
  site: string;
  kind: ReportKind;
  name: string;
  note: string;
  error: string | null;
  stage: string | null;
  warnings: string[];
  fileSizeMb: number | null;
  template: string | null;
  userAgent: string;
  hasGpu: boolean;
}

/** Only what's needed to act on it: never the video, its name, or any API key. */
export function buildReport(input: ReportInput): Report {
  const scrub = (text: string) => input.secrets.filter(Boolean).reduce((out, secret) => out.split(secret).join("[removed]"), text);
  const isProblem = input.kind === "problem";
  return {
    site: SITE.domain,
    kind: input.kind,
    name: scrub(input.name.trim()).slice(0, 80) || ANONYMOUS,
    note: scrub(input.note.trim()).slice(0, 2000),
    error: isProblem && input.error !== null ? scrub(input.error).slice(0, 1000) : null,
    stage: isProblem ? input.stage : null,
    warnings: isProblem ? input.warnings.map(scrub).slice(0, 5) : [],
    fileSizeMb: isProblem ? input.fileSizeMb : null,
    template: isProblem ? input.template : null,
    userAgent: isProblem ? input.userAgent : "",
    hasGpu: input.hasGpu,
  };
}

export function reportToText(r: Report): string {
  if (r.kind === "feedback") return r.note;
  return [
    r.note && `What happened: ${r.note}`,
    r.error && `Error: ${r.error}`,
    r.stage && `Stage: ${r.stage}`,
    r.warnings.length ? `Warnings: ${r.warnings.join(" | ")}` : "",
    r.fileSizeMb !== null && `File size: ${r.fileSizeMb} MB`,
    r.template && `Template: ${r.template}`,
    `GPU: ${r.hasGpu ? "yes" : "no"}`,
    `Browser: ${r.userAgent}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** A problem can be sent with no message, because the error itself says what happened. */
export function needsMessage(kind: ReportKind, note: string, error: string | null): boolean {
  return !note.trim() && !(kind === "problem" && error);
}

/** Sends anonymously to the site owner's inbox. `honeypot` is a field only bots fill in. */
export async function sendReport(report: Report, honeypot: string): Promise<void> {
  if (!SITE.feedbackKey) throw new Error("Feedback isn't configured.");
  // Form data, not JSON: browsers send it without a CORS preflight.
  const form = new FormData();
  form.append("access_key", SITE.feedbackKey);
  form.append("subject", `${SITE.name} ${report.kind}`);
  form.append("from_name", report.name);
  form.append("name", report.name);
  form.append("message", reportToText(report));
  form.append("botcheck", honeypot);
  const res = await fetch(ENDPOINT, { method: "POST", headers: { Accept: "application/json" }, body: form });
  const body = (await res.json().catch(() => null)) as { success?: boolean } | null;
  if (!res.ok || !body?.success) throw new Error(`Feedback failed (${res.status})`);
}
