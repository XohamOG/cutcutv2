"use client";

import React, { useState, useEffect } from "react";
import {
  Radio,
  Zap,
  Activity,
  MessageSquare,
  Volume2,
  Send,
  Sparkles,
  Play,
  CheckCircle,
  Clock,
  Flame,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function LiveStreamMonitor() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [chatRate, setChatRate] = useState(14); // msgs/sec
  const [pitchHz, setPitchHz] = useState(210);
  const [liveEvents, setLiveEvents] = useState<string[]>([
    "[10:14:02] Stream connected (Twitch ingest @ 1080p60)",
    "[10:14:15] Baseline chat rate calibrated: 5.4 msgs/sec",
    "[10:14:28] Streamer vocal range baseline calibrated: 180-240Hz",
  ]);
  const [liveClipsGenerated, setLiveClipsGenerated] = useState<
    { id: string; time: string; tag: string; score: number; status: string }[]
  >([]);

  // Simulation tick for real-time telemetry fluctuations
  useEffect(() => {
    if (!isMonitoring) return;
    const timer = setInterval(() => {
      setChatRate((prev) => {
        const delta = (Math.random() - 0.48) * 3;
        return Math.max(8, Math.min(30, +(prev + delta).toFixed(1)));
      });
      setPitchHz((prev) => {
        const delta = (Math.random() - 0.5) * 15;
        return Math.max(180, Math.min(320, Math.round(prev + delta)));
      });
    }, 1200);
    return () => clearInterval(timer);
  }, [isMonitoring]);

  // Simulate an explosive live clutch moment
  const triggerLiveClutch = () => {
    // Spike the telemetry
    setChatRate(68.5); // 12x baseline!
    setPitchHz(510);   // High pitch scream!

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.7 },
    });

    const now = new Date().toLocaleTimeString();
    setLiveEvents((prev) => [
      `[${now}] 🚨 LIVE SPIKE: Chat velocity hit 68.5 msgs/s (12.6x baseline)!`,
      `[${now}] 🎙️ Streamer pitch surged to 510Hz + Triple Kill on HUD!`,
      `[${now}] ✂️ Auto-Clipping 20s window [T-14s to T+6s]...`,
      `[${now}] 📱 Reframed to 9:16 + Hook: "HE ACTUALLY HIT THAT?! 💀"`,
      `[${now}] 🚀 Auto-Published to YouTube Shorts & TikTok (Latency: 38s)!`,
      ...prev.slice(0, 8),
    ]);

    setLiveClipsGenerated((prev) => [
      {
        id: `live_clip_${Date.now()}`,
        time: now,
        tag: "Live 1v3 Ascent Ace",
        score: 95,
        status: "Auto-Published (Shorts + TikTok)",
      },
      ...prev,
    ]);

    // Return to normal gradually
    setTimeout(() => {
      setChatRate(18);
      setPitchHz(230);
    }, 4000);
  };

  return (
    <section className="glass-panel" style={{ padding: "24px", marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span className="badge-neon badge-pink">
              <Radio size={12} /> LIVE CLIP-WHILE-STREAMING MODE
            </span>
            <span className="badge-neon badge-cyan">ADVANCED FEATURE 1</span>
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            Real-Time Stream Ingestion & Sub-Minute Publishing
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Autonomous agent continuously buffers live feed, cuts clips within 45 seconds of a live clutch, and publishes to Shorts/TikTok before the match ends.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className="cyber-btn cyber-btn-secondary"
            style={{ padding: "8px 14px", fontSize: "0.8rem" }}
          >
            <Activity size={15} />
            <span>{isMonitoring ? "Stream Ingest: Active" : "Stream Ingest: Paused"}</span>
          </button>

          <button
            onClick={triggerLiveClutch}
            className="cyber-btn cyber-btn-hype"
            style={{ padding: "8px 18px", fontSize: "0.825rem" }}
          >
            <Flame size={16} />
            <span>Simulate Live Clutch Spike</span>
          </button>
        </div>
      </div>

      {/* Live Telemetry Gauges Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Chat Rate Gauge */}
        <div
          style={{
            padding: "16px",
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            border: chatRate > 35 ? "1px solid #f43f5e" : "1px solid rgba(255, 255, 255, 0.08)",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <MessageSquare size={16} color="#00f2fe" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#cbd5e1" }}>
                Live Chat Velocity
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Baseline: 5.4 msgs/s</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                color: chatRate > 35 ? "#f43f5e" : "#00f2fe",
              }}
            >
              {chatRate}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>msgs/second</span>
            <span
              className={`badge-neon ${chatRate > 35 ? "badge-pink" : "badge-cyan"}`}
              style={{ marginLeft: "auto", fontSize: "0.7rem" }}
            >
              {(chatRate / 5.4).toFixed(1)}x BASELINE
            </span>
          </div>

          {/* Mini pulse bar */}
          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (chatRate / 70) * 100)}%`,
                background: chatRate > 35 ? "linear-gradient(90deg, #ec4899, #f43f5e)" : "linear-gradient(90deg, #00f2fe, #3b82f6)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Streamer Vocal Pitch Gauge */}
        <div
          style={{
            padding: "16px",
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            border: pitchHz > 380 ? "1px solid #ec4899" : "1px solid rgba(255, 255, 255, 0.08)",
            transition: "all 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Volume2 size={16} color="#ec4899" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#cbd5e1" }}>
                Streamer Vocal Frequency (FFT)
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Resting: 210 Hz</span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span
              style={{
                fontSize: "1.8rem",
                fontWeight: 900,
                color: pitchHz > 380 ? "#ec4899" : "#c084fc",
              }}
            >
              {pitchHz}
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>Hz (Excitement Peak)</span>
            <span
              className={`badge-neon ${pitchHz > 380 ? "badge-pink" : "badge-purple"}`}
              style={{ marginLeft: "auto", fontSize: "0.7rem" }}
            >
              {pitchHz > 380 ? "HYPE REACTION" : "NORMAL DIALOG"}
            </span>
          </div>

          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (pitchHz / 550) * 100)}%`,
                background: pitchHz > 380 ? "linear-gradient(90deg, #ec4899, #8b5cf6)" : "linear-gradient(90deg, #8b5cf6, #3b82f6)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Auto-Clipper Pipeline Latency Gauge */}
        <div
          style={{
            padding: "16px",
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Zap size={16} color="#10b981" />
              <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#cbd5e1" }}>
                Auto-Publish Latency
              </span>
            </div>
            <span className="badge-neon badge-emerald" style={{ fontSize: "0.68rem" }}>
              SUB-MINUTE
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
            <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "#10b981" }}>
              38.2
            </span>
            <span style={{ fontSize: "0.8rem", color: "#64748b" }}>seconds</span>
            <span style={{ fontSize: "0.72rem", color: "#94a3b8", marginLeft: "auto" }}>
              From Kill to YouTube Shorts
            </span>
          </div>

          <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: "85%", background: "linear-gradient(90deg, #10b981, #00f2fe)" }} />
          </div>
        </div>
      </div>

      {/* Real-Time Live Feed Console & Published Clips Log */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
        {/* Real-Time Live Stream Events */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#00f2fe" }}>
              Live Telemetry Event Log
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span className="pulse-dot" />
              <span style={{ fontSize: "0.72rem", color: "#f43f5e", fontWeight: 700 }}>
                LISTENING TO STREAM FEED
              </span>
            </div>
          </div>

          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.74rem",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              maxHeight: "180px",
              overflowY: "auto",
            }}
          >
            {liveEvents.map((evt, i) => (
              <div
                key={i}
                style={{
                  color: evt.includes("🚨") || evt.includes("🚀") ? "#34d399" : "#94a3b8",
                  padding: "2px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.02)",
                }}
              >
                {evt}
              </div>
            ))}
          </div>
        </div>

        {/* Live Clips Published During Stream */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            padding: "16px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#ec4899" }}>
              Live Clips Published This Stream ({liveClipsGenerated.length})
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>Auto-Dispatched</span>
          </div>

          {liveClipsGenerated.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "0.75rem", fontStyle: "italic" }}>
              No live clips triggered yet. Click "Simulate Live Clutch Spike" above to see the autonomous agent clip and publish in real time!
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {liveClipsGenerated.map((clip) => (
                <div
                  key={clip.id}
                  style={{
                    padding: "8px 12px",
                    borderRadius: "8px",
                    background: "rgba(236, 72, 153, 0.1)",
                    border: "1px solid rgba(236, 72, 153, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                      {clip.tag}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#10b981" }}>
                      {clip.status} • {clip.time}
                    </div>
                  </div>

                  <span className="badge-neon badge-cyan">{clip.score}/100 VIRAL</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
