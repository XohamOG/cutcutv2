"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { ReactNode, useSyncExternalStore } from "react";
import { Browser, Step, subscribeToHash, Target } from "./GuideParts";
import { PillLink, RadioTabs, useStage } from "./ui";
import app from "./app.module.css";
import styles from "./keys.module.css";

type GuideId = "gemini" | "groq" | "claude" | "openai";

interface Guide {
  id: GuideId;
  name: string;
  site: string;
  url: string;
  account: string;
  cost: string;
  jobs: string;
  transcribes: boolean;
  revoke: ReactNode;
  prefix: string;
  createLabel: string;
  create: ReactNode;
}

const GUIDES: Guide[] = [
  {
    id: "gemini",
    name: "Gemini",
    site: "Google AI Studio",
    url: "https://aistudio.google.com/apikey",
    account: "Google account",
    cost: "Free tier, no card needed",
    jobs: "AI judge and post text",
    transcribes: false,
    revoke: <>Find the key in the list and use the <b>delete</b> option beside it, then confirm.</>,
    prefix: "AIza",
    createLabel: "Create API key",
    create: <>Click <b>Create API key</b>. If it asks about a project, choose to create a new one.</>,
  },
  {
    id: "groq",
    name: "Groq",
    site: "Groq Console",
    url: "https://console.groq.com/keys",
    account: "email or Google account",
    cost: "Free tier, no card needed",
    jobs: "AI judge, post text and transcription, with one key",
    transcribes: true,
    revoke: <>Find <b>viralbits</b> in the list and use the <b>delete</b> option beside it, then confirm.</>,
    prefix: "gsk_",
    createLabel: "Create API Key",
    create: <>Click <b>Create API Key</b>, type any name such as <b>viralbits</b>, and confirm.</>,
  },
  {
    id: "claude",
    name: "Claude",
    site: "Claude Console",
    url: "https://platform.claude.com/settings/keys",
    account: "Claude Console account",
    cost: "Paid, with prepaid credits",
    jobs: "AI judge and post text",
    transcribes: false,
    revoke: <>Find <b>viralbits</b> in the list, open the menu beside it, choose <b>Delete</b>, then confirm.</>,
    prefix: "sk-ant-",
    createLabel: "Create Key",
    create: <>Claude needs prepaid credits, so add some under <b>Billing</b> if asked. Then click <b>Create Key</b> and name it <b>viralbits</b>.</>,
  },
  {
    id: "openai",
    name: "OpenAI",
    site: "OpenAI Platform",
    url: "https://platform.openai.com/api-keys",
    account: "OpenAI account",
    cost: "Paid, needs billing set up",
    jobs: "AI judge, post text and transcription, with one key",
    transcribes: true,
    revoke: <>Find <b>viralbits</b> in the list and use the <b>Revoke</b> option beside it, then confirm.</>,
    prefix: "sk-",
    createLabel: "Create new secret key",
    create: <>Click <b>Create new secret key</b>, name it <b>viralbits</b>, and confirm.</>,
  },
];

function Steps({ guide }: { guide: Guide }) {
  const masked = `${guide.prefix}••••••••••••••••`;
  return (
    <ol className={styles.steps}>
      <Step number={1} title={`Open ${guide.site}`} mock={<Browser url={guide.url}><span className={styles.mockLine}>Sign in</span><Target>Continue</Target></Browser>}>
        <p>Open the page and sign in with your {guide.account}.</p>
        <PillLink variant="orange" href={guide.url} target="_blank" rel="noreferrer">open {guide.site}</PillLink>
      </Step>
      <Step number={2} title="Create a key" mock={<Browser url={guide.url}><span className={styles.mockLine}>API keys</span><Target>{guide.createLabel}</Target></Browser>}>
        <p>{guide.create}</p>
      </Step>
      <Step number={3} title="Copy it" mock={<Browser url={guide.url}><span className={styles.keyRow}><code>{masked}</code><Target>Copy</Target></span></Browser>}>
        <p>Click <b>Copy</b>. Your key starts with <code>{guide.prefix}</code>.</p>
        <p>Copy it right away, because some sites only show a key once.</p>
      </Step>
      <Step number={4} title="Paste it into viralbits" mock={<Browser url="https://viralbits.xyz"><span className={styles.mockLabel}>ai key</span><span className={styles.mockInput}>{masked}</span><span className={styles.mockOk}>Key works.</span></Browser>}>
        <p>Go back to viralbits, open <b>settings</b>, and paste it into <b>ai key</b>.</p>
        <p>That’s it. We work out the provider and pick the best model for you.</p>
      </Step>
    </ol>
  );
}

export default function KeyGuide() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash.slice(1), () => "");
  const guide = GUIDES.find((g) => g.id === hash) ?? GUIDES[0];
  const { item, screen } = useStage();

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={app.wordmark}>viralbits</Link>
          <Link href="/" className={app.link}>back to the app</Link>
        </header>

        <motion.main initial="hidden" animate="visible" variants={screen} className={styles.main}>
          <motion.h1 variants={item} className={styles.title}>Get your AI key.</motion.h1>
          <motion.p variants={item} className={app.lead}>Optional, and it takes about two minutes. Pick one:</motion.p>

          <RadioTabs
            variants={item}
            className={styles.tabs}
            label="Provider"
            name="guide"
            value={guide.id}
            options={GUIDES.map((g) => ({ id: g.id, label: g.name }))}
            onChange={(id) => {
              window.location.hash = id;
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div key={guide.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              <p className={styles.summary}><b>{guide.cost}.</b> Used for: {guide.jobs}.</p>
              <Steps guide={guide} />

              <section className={styles.trust} aria-labelledby="trust-title">
                <h2 id="trust-title" className={styles.trustTitle}>Your key stays with you.</h2>
                <ul className={styles.trustList}>
                  <li><b>Saved only in this browser.</b> It’s gone when you close the tab, unless you turn on “remember keys”.</li>
                  <li><b>Sent only to {guide.name}.</b> viralbits has no server that could receive it, so we never see your key.</li>
                  <li><b>Your video stays too.</b> {guide.name} only gets short {guide.transcribes ? "text or audio snippets" : "text snippets"} to do its job.</li>
                </ul>
              </section>

              <section className={styles.revoke} aria-labelledby="revoke-title">
                <h2 id="revoke-title" className={styles.revokeTitle}>Changed your mind? Revoke it.</h2>
                <p>A revoked key stops working everywhere, and you can always make a new one.</p>
                <ol className={styles.revokeSteps}>
                  <li>Open your <a href={guide.url} target="_blank" rel="noreferrer">{guide.site} keys page</a>.</li>
                  <li>{guide.revoke}</li>
                  <li>In viralbits, clear the <b>ai key</b> field in settings.</li>
                </ol>
              </section>

              <p className={`${app.caption} ${styles.foot}`}>Stuck? Paste the key again with no extra spaces. Button names can change a little as these sites update.</p>
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </MotionConfig>
  );
}
