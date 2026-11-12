import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { PillLink } from "@/components/ui";
import { FAQ } from "@/lib/seo";
import app from "@/components/app.module.css";
import styles from "@/components/keys.module.css";

export const metadata: Metadata = {
  title: "How it works: free stream to Shorts clipper",
  description:
    "How viralbits turns a Twitch or YouTube stream recording into vertical clips with captions: what it listens for, why your video stays on your computer, and answers to common questions.",
  alternates: { canonical: "/how-it-works" },
};

const FAQ_DATA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

const STEPS = [
  { title: "Drop it.", body: "Drop in your stream recording: an OBS file, or your own Twitch or YouTube stream downloaded from your dashboard. Add your chat replay too, if you have it." },
  { title: "Frame it.", body: "Mark where your facecam and gameplay are, pick a layout and a caption style. Clips come out 9:16 for Shorts, Reels and TikTok." },
  { title: "Post it.", body: "viralbits finds your best moments, cuts them with word-by-word captions, and tells you why it picked each one. Trim, fix a caption, then download." },
];

export default function HowItWorksPage() {
  return (
    <div className={styles.page}>
      <JsonLd data={FAQ_DATA} />
      <header className={styles.header}>
        <Link href="/" className={app.wordmark}>viralbits</Link>
        <Link href="/" className={app.link}>back to the app</Link>
      </header>

      <main className={styles.main}>
        <h1 className={styles.title}>Your stream, cut into Shorts.</h1>
        <p className={app.lead}>Free, in your browser. No sign-up, no watermark, and your video never leaves your computer.</p>

        <section className={styles.revoke} aria-labelledby="steps-title">
          <h2 id="steps-title" className={styles.revokeTitle}>Three steps</h2>
          <ol className={styles.revokeSteps}>
            {STEPS.map((s) => (
              <li key={s.title}><b>{s.title}</b> {s.body}</li>
            ))}
          </ol>
        </section>

        <section className={styles.trust} aria-labelledby="listens-title">
          <h2 id="listens-title" className={styles.trustTitle}>What it listens for</h2>
          <ul className={styles.trustList}>
            <li><b>Your voice jumping</b> above your own normal, not just loud game audio.</li>
            <li><b>Laughter and shouting,</b> picked out from gunfire and music.</li>
            <li><b>What you said:</b> &ldquo;no way&rdquo;, &ldquo;clip that&rdquo;, &ldquo;bhai kya tha&rdquo; and thousands more, in English and Hindi. Hindi speech needs a free Groq key.</li>
            <li><b>Chat going off,</b> if you add your chat replay.</li>
            <li><b>The picture:</b> a reaction on your facecam, sudden action, words like VICTORY on screen.</li>
          </ul>
        </section>

        <section className={styles.revoke} aria-labelledby="faq-title">
          <h2 id="faq-title" className={styles.revokeTitle}>Questions</h2>
          <dl className={styles.faq}>
            {FAQ.map(({ q, a }) => (
              <div key={q}>
                <dt><b>{q}</b></dt>
                <dd>{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <p className={styles.cta}>
          <PillLink variant="orange" href="/">try it on your stream</PillLink>
        </p>
        <p className={`${app.caption} ${styles.foot}`}>
          Want better picks? <Link href="/keys">Add a free AI key</Link> or <Link href="/chat">add your chat replay</Link>.
        </p>
      </main>
    </div>
  );
}
