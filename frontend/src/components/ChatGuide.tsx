"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { parseYouTubeId } from "@/lib/highlights/youtube";
import { Browser, Step, subscribeToHash, Target } from "./GuideParts";
import { CopyButton, PillLink, RadioTabs, useStage } from "./ui";
import app from "./app.module.css";
import styles from "./keys.module.css";

const TABS = [
  { id: "youtube", label: "YouTube" },
  { id: "twitch", label: "Twitch" },
] as const;

const INSTALL_WINDOWS = "winget install --source winget --id yt-dlp.yt-dlp";
const INSTALL_MAC = "brew install yt-dlp";
const TWITCH_RELEASES = "https://github.com/lay295/TwitchDownloader/releases/";
const YT_DLP_INSTALL = "https://github.com/yt-dlp/yt-dlp/wiki/Installation";

function CopyCommand({ command, label }: { command: string; label: string }) {
  return (
    <div className={styles.command}>
      <code>{command}</code>
      <CopyButton text={command} label={label} />
    </div>
  );
}

const fileMock = (name: string) => (
  <Browser url="viralbits.xyz">
    <span className={styles.mockLabel}>chat replay (optional)</span>
    <span className={styles.mockInput}>{name}</span>
    <span className={styles.mockOk}>Added.</span>
  </Browser>
);

function YouTubeSteps() {
  const [link, setLink] = useState("");
  const id = parseYouTubeId(link);
  const command = `yt-dlp --skip-download --write-subs --sub-langs live_chat "https://www.youtube.com/watch?v=${id ?? "YOUR_VIDEO_ID"}"`;
  return (
    <ol className={styles.steps}>
      <Step number={1} title="Install yt-dlp once" mock={<Browser url="your terminal"><span className={styles.keyRow}><code>{INSTALL_WINDOWS}</code></span></Browser>}>
        <p>It’s a free tool that runs on your computer. Open <b>Terminal</b>, paste this and press Enter.</p>
        <p>On Windows:</p>
        <CopyCommand command={INSTALL_WINDOWS} label="Windows install command" />
        <p>On a Mac with Homebrew:</p>
        <CopyCommand command={INSTALL_MAC} label="Mac install command" />
        <PillLink variant="ghost" href={YT_DLP_INSTALL} target="_blank" rel="noreferrer">other ways to install</PillLink>
      </Step>
      <Step number={2} title="Paste your stream link" mock={<Browser url="youtube.com/live/…"><span className={styles.mockLine}>Your finished stream</span><Target>Copy link</Target></Browser>}>
        <p>Use a finished stream on your own channel. We’ll build the command for you.</p>
        <label className={app.setting}>
          <span>YouTube link</span>
          <input className={app.line} type="url" inputMode="url" autoComplete="off" spellCheck={false} placeholder="https://youtu.be/…" value={link} onChange={(e) => setLink(e.target.value)} />
        </label>
        {link && !id && <p className={app.errorLine} role="alert">Paste a link to one video.</p>}
      </Step>
      <Step number={3} title="Run the command" mock={<Browser url="your terminal"><span className={styles.keyRow}><code>[download] Finished</code></span></Browser>}>
        <p>Paste this into Terminal and press Enter. Long streams can take a few minutes.</p>
        <CopyCommand command={command} label="chat download command" />
      </Step>
      <Step number={4} title="Find the file" mock={<Browser url="your folder"><Target>stream.live_chat.json</Target></Browser>}>
        <p>It lands in the folder Terminal is using, usually your home folder. The name ends in <code>.live_chat.json</code>.</p>
      </Step>
      <Step number={5} title="Add it to viralbits" mock={fileMock("stream.live_chat.json")}>
        <p>Open <b>settings</b> and choose the file under <b>chat replay</b>. Add it before you press make clips.</p>
      </Step>
    </ol>
  );
}

function TwitchSteps() {
  return (
    <ol className={styles.steps}>
      <Step number={1} title="Get TwitchDownloader" mock={<Browser url="github.com/lay295/TwitchDownloader"><span className={styles.mockLine}>Releases</span><Target>TwitchDownloaderGUI</Target></Browser>}>
        <p>It’s a free Windows app. Download the latest <b>GUI</b> zip, unzip it and open the app.</p>
        <PillLink variant="orange" href={TWITCH_RELEASES} target="_blank" rel="noreferrer">open the releases page</PillLink>
      </Step>
      <Step number={2} title="Open Chat Download" mock={<Browser url="TwitchDownloader"><span className={styles.mockLine}>Link or ID</span><Target>Chat Download</Target></Browser>}>
        <p>Go to <b>Chat Download</b> and paste the link to your past broadcast. Twitch deletes these after a while, so do this soon after streaming.</p>
      </Step>
      <Step number={3} title="Choose JSON" mock={<Browser url="TwitchDownloader"><span className={styles.mockLine}>Download Format</span><Target>JSON</Target></Browser>}>
        <p>Set <b>Download Format</b> to <b>JSON</b>, and leave <b>Compression</b> off.</p>
      </Step>
      <Step number={4} title="Download it" mock={<Browser url="TwitchDownloader"><Target>Download</Target></Browser>}>
        <p>Press <b>Download</b> and save the file somewhere easy to find.</p>
        <p>On a Mac or Linux, use the command-line version from the same page:</p>
        <CopyCommand command="TwitchDownloaderCLI chatdownload --id YOUR_VOD_ID -o chat.json" label="Twitch command" />
      </Step>
      <Step number={5} title="Add it to viralbits" mock={fileMock("chat.json")}>
        <p>Open <b>settings</b> and choose the file under <b>chat replay</b>. Add it before you press make clips.</p>
      </Step>
    </ol>
  );
}

export default function ChatGuide() {
  const hash = useSyncExternalStore(subscribeToHash, () => window.location.hash.slice(1), () => "");
  const tab = hash === "twitch" ? "twitch" : "youtube";
  const { item, screen } = useStage();

  return (
    <MotionConfig reducedMotion="user">
      <div className={styles.page}>
        <header className={styles.header}>
          <Link href="/" className={app.wordmark}>viralbits</Link>
          <Link href="/" className={app.link}>back to the app</Link>
        </header>

        <motion.main initial="hidden" animate="visible" variants={screen} className={styles.main}>
          <motion.h1 variants={item} className={styles.title}>Add your chat.</motion.h1>
          <motion.p variants={item} className={app.lead}>Optional. When chat goes wild, we find the moment faster. Where did you stream?</motion.p>

          <RadioTabs
            variants={item}
            className={styles.tabs}
            label="Platform"
            name="chat"
            value={tab}
            options={TABS}
            onChange={(id) => {
              window.location.hash = id;
            }}
          />

          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18, ease: "easeOut" }}>
              {tab === "youtube" ? <YouTubeSteps /> : <TwitchSteps />}

              <section className={styles.trust} aria-labelledby="chat-trust-title">
                <h2 id="chat-trust-title" className={styles.trustTitle}>Your chat stays with you.</h2>
                <ul className={styles.trustList}>
                  <li><b>Read in this browser.</b> The file isn’t uploaded to viralbits, and we have no server that could receive it.</li>
                  <li><b>Runs on your computer.</b> These are free third-party tools. viralbits doesn’t run them for you.</li>
                  <li><b>With an AI key,</b> the most repeated chat lines around each moment go to the provider you picked.</li>
                  <li><b>Use your own streams.</b> Only download chat from videos you have the right to use.</li>
                </ul>
              </section>

              <p className={`${app.caption} ${styles.foot}`}>{tab === "youtube" ? "Stuck? No file usually means the stream has no chat replay. If YouTube errors, update yt-dlp, or install Deno." : "Stuck? Check the link is a past broadcast, not a live channel."} Kick isn’t supported yet.</p>
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </MotionConfig>
  );
}
