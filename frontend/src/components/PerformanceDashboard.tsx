"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Share2,
  Heart,
  Eye,
  RotateCcw,
  Sparkles,
  Sliders,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import { CandidateClip } from "@/lib/types/pipeline";

interface PerformanceDashboardProps {
  clip: CandidateClip | null;
}

export default function PerformanceDashboard({ clip }: PerformanceDashboardProps) {
  const [weights, setWeights] = useState({
    voicePitch: 0.38,
    chatSpike: 0.34,
    killFeedEvent: 0.18,
    hookRetention: 0.10,
  });
  const [recalibrated, setRecalibrated] = useState(true);

  const retentionPoints = clip?.actualPerformance?.retentionCurve || [
    { second: 0, retentionPct: 100 },
    { second: 2, retentionPct: 94 },
    { second: 5, retentionPct: 89 },
    { second: 10, retentionPct: 84 },
    { second: 15, retentionPct: 81 },
    { second: 20, retentionPct: 76 },
    { second: 22, retentionPct: 72 },
  ];

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
            <span className="badge-neon badge-emerald">
              <BarChart3 size={12} /> CROSS-PLATFORM ANALYTICS & FEEDBACK LOOP
            </span>
            <span className="badge-neon badge-cyan">AGENT 9 & FEATURE 5</span>
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            Cross-Platform Performance & Model Weight Recalibration
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Tracks real post-publish retention curves across YouTube Shorts, TikTok, and Reels to train future virality weighting.
          </p>
        </div>

        <button
          onClick={() => {
            setWeights({
              voicePitch: 0.40,
              chatSpike: 0.36,
              killFeedEvent: 0.15,
              hookRetention: 0.09,
            });
            setRecalibrated(true);
          }}
          className="cyber-btn cyber-btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.8rem" }}
        >
          <RotateCcw size={15} />
          <span>Recalibrate Future Model Weights</span>
        </button>
      </div>

      {/* Platform Comparison Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {/* YouTube Shorts */}
        <div
          style={{
            background: "rgba(255, 0, 0, 0.04)",
            border: "1px solid rgba(255, 0, 0, 0.2)",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ff4d4d" }}>
                YouTube Shorts
              </span>
            </div>
            <span className="badge-neon badge-pink" style={{ fontSize: "0.68rem" }}>
              TOP SEARCH RANK
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Total Views</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>
                215,400 <span style={{ fontSize: "0.75rem", color: "#10b981" }}>+18% vs avg</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Avg % Viewed</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#00f2fe" }}>94.2%</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Like Ratio</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#ec4899" }}>11.8%</div>
              </div>
            </div>
          </div>
        </div>

        {/* TikTok */}
        <div
          style={{
            background: "rgba(0, 242, 254, 0.04)",
            border: "1px solid rgba(0, 242, 254, 0.2)",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#00f2fe" }}>
                TikTok Feed
              </span>
            </div>
            <span className="badge-neon badge-cyan" style={{ fontSize: "0.68rem" }}>
              HIGHEST VIRAL SHARES
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Total Views</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>
                198,200 <span style={{ fontSize: "0.75rem", color: "#10b981" }}>+34% FYP</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Completion Rate</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#00f2fe" }}>78.5%</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Shares / Saves</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#a855f7" }}>14,920</div>
              </div>
            </div>
          </div>
        </div>

        {/* Instagram Reels */}
        <div
          style={{
            background: "rgba(236, 72, 153, 0.04)",
            border: "1px solid rgba(236, 72, 153, 0.2)",
            borderRadius: "14px",
            padding: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#ec4899" }}>
                Instagram Reels
              </span>
            </div>
            <span className="badge-neon badge-purple" style={{ fontSize: "0.68rem" }}>
              PEAK 7PM POST
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Total Views</div>
              <div style={{ fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>
                68,400 <span style={{ fontSize: "0.75rem", color: "#10b981" }}>Peak Queue</span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Avg Watch Time</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#ec4899" }}>18.4s</div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.3)", padding: "8px", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>Comments</div>
                <div style={{ fontSize: "1rem", fontWeight: 800, color: "#f59e0b" }}>842</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Retention Curve Graph + Model Weight Recalibration */}
      <div style={{ display: "grid", gridTemplateColumns: "1.25fr 1fr", gap: "20px" }}>
        {/* Retention Curve Visualizer */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
              Second-by-Second Viewer Retention Curve (22s Clip)
            </span>
            <span style={{ fontSize: "0.72rem", color: "#10b981", fontWeight: 700 }}>
              94% Hook Hold at 2.0s
            </span>
          </div>

          {/* Retention SVG Chart */}
          <div style={{ height: "140px", display: "flex", alignItems: "flex-end", gap: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            {retentionPoints.map((pt, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontSize: "0.65rem", color: "#00f2fe", fontWeight: 700, marginBottom: "4px" }}>
                  {pt.retentionPct}%
                </div>
                <div
                  style={{
                    width: "100%",
                    height: `${(pt.retentionPct / 100) * 100}%`,
                    background:
                      i <= 1
                        ? "linear-gradient(180deg, #00f2fe 0%, #3b82f6 100%)"
                        : "linear-gradient(180deg, #ec4899 0%, #8b5cf6 100%)",
                    borderRadius: "4px 4px 0 0",
                  }}
                />
                <div style={{ fontSize: "0.65rem", color: "#64748b", marginTop: "4px" }}>
                  {pt.second}s
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "0.72rem", color: "#94a3b8", marginTop: "8px" }}>
            💡 Insight: The 2.5s bold uppercase hook ("3 BULLETS. 1 v 3. GAME POINT.") held 94% of scrolling viewers through the crucial 3-second algorithm decision boundary.
          </p>
        </div>

        {/* Dynamic Model Weights Recalibration Feedback */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Sliders size={16} color="#a855f7" />
              <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                Reinforced Signal Weight Calibration
              </span>
            </div>
            <span className="badge-neon badge-emerald" style={{ fontSize: "0.68rem" }}>
              FEEDBACK APPLIED
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#cbd5e1" }}>
                <span>Streamer Voice Pitch Spike:</span>
                <strong style={{ color: "#00f2fe" }}>{(weights.voicePitch * 100).toFixed(0)}% (+18% boost)</strong>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "4px" }}>
                <div style={{ height: "100%", width: `${weights.voicePitch * 100}%`, background: "#00f2fe", borderRadius: "3px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#cbd5e1" }}>
                <span>Twitch Chat Message Surge Ratio:</span>
                <strong style={{ color: "#ec4899" }}>{(weights.chatSpike * 100).toFixed(0)}% (+21% boost)</strong>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "4px" }}>
                <div style={{ height: "100%", width: `${weights.chatSpike * 100}%`, background: "#ec4899", borderRadius: "3px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#cbd5e1" }}>
                <span>HUD Killfeed Event Significance:</span>
                <strong style={{ color: "#a855f7" }}>{(weights.killFeedEvent * 100).toFixed(0)}%</strong>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "4px" }}>
                <div style={{ height: "100%", width: `${weights.killFeedEvent * 100}%`, background: "#a855f7", borderRadius: "3px" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#cbd5e1" }}>
                <span>Opening Hook Visual Retention Factor:</span>
                <strong style={{ color: "#10b981" }}>{(weights.hookRetention * 100).toFixed(0)}%</strong>
              </div>
              <div style={{ height: "6px", background: "rgba(255,255,255,0.06)", borderRadius: "3px", marginTop: "4px" }}>
                <div style={{ height: "100%", width: `${weights.hookRetention * 100}%`, background: "#10b981", borderRadius: "3px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
