"use client";

import { useRef, useState } from "react";
import { buildReport, needsMessage, sendReport, type ReportInput, type ReportKind } from "@/lib/report";
import Sheet from "./Sheet";
import { Bars, Pill, RadioTabs } from "./ui";
import styles from "./app.module.css";

type Status = "idle" | "sending" | "done" | "failed";

const KINDS: { id: ReportKind; label: string }[] = [
  { id: "problem", label: "problem" },
  { id: "feedback", label: "idea" },
];

export default function ReportSheet({ open, onClose, details }: { open: boolean; onClose: () => void; details: Omit<ReportInput, "note" | "name" | "kind"> }) {
  const [chosen, setChosen] = useState<ReportKind | null>(null);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [missing, setMissing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const noteField = useRef<HTMLTextAreaElement>(null);
  const kind = chosen ?? (details.error ? "problem" : "feedback");

  const close = () => {
    onClose();
    setStatus("idle");
    setNote("");
    setName("");
    setChosen(null);
    setMissing(false);
  };

  const send = async () => {
    if (needsMessage(kind, note, details.error)) {
      setMissing(true);
      noteField.current?.focus();
      return;
    }
    setMissing(false);
    setStatus("sending");
    try {
      await sendReport(buildReport({ ...details, kind, name, note }), honeypot);
      setStatus("done");
    } catch {
      setStatus("failed");
    }
  };

  return (
    <Sheet open={open} onClose={close} label="Send feedback" desktop="center">
      {status === "done" ? (
        <>
          <h2 className={styles.title}>sent, thank you</h2>
          <Pill onClick={close}>close</Pill>
        </>
      ) : (
        <>
          <h2 className={styles.title}>send feedback</h2>
          <RadioTabs label="Type" name="kind" value={kind} options={KINDS} onChange={setChosen} />
          <label className={styles.setting}>
            <span>name (optional)</span>
            <input className={styles.line} value={name} maxLength={80} placeholder="Anonymous" autoComplete="off" onChange={(e) => setName(e.target.value)} />
          </label>
          <label className={styles.setting}>
            <span>{kind === "problem" ? "what happened?" : "your idea"}</span>
            <textarea ref={noteField} className={styles.area} rows={3} value={note} aria-invalid={missing} aria-describedby={missing ? "feedback-missing" : undefined} onChange={(e) => setNote(e.target.value)} />
          </label>
          {missing && <p id="feedback-missing" className={styles.errorLine}>Write a short message first.</p>}
          <input className={styles.honeypot} tabIndex={-1} aria-hidden autoComplete="off" name="botcheck" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          {status === "failed" && <p className={styles.errorLine} role="alert">That didn’t send. Check your connection and try again.</p>}
          <div className={styles.row}>
            <Pill variant="orange" disabled={status === "sending"} onClick={send}>
              {status === "sending" ? <Bars label="Sending" /> : "send"}
            </Pill>
            <Pill variant="ghost" onClick={close}>cancel</Pill>
          </div>
          <p className={styles.caption}>No account needed. Your video is never included.</p>
        </>
      )}
    </Sheet>
  );
}
