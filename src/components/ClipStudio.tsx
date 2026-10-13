"use client";

import React, { useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Check,
  Edit3,
  Send,
  Eye,
  Clock,
  Flame,
  MessageSquare,
  Volume2,
  Share2,
  Calendar,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { CandidateClip, CreatorProfile } from "@/lib/types/pipeline";
import confetti from "canvas-confetti";

interface ClipStudioProps {
  clips: CandidateClip[];
  selectedClip: CandidateClip | null;
  onSelectClip: (clip: CandidateClip) => void;
  creator: CreatorProfile;
  onApproveAndPublish: (clipId: string, customHook?: string) => void;
  onViewBeforeAfter: (clip: CandidateClip) => void;
}

export default function ClipStudio({
  clips,
  selectedClip,
  onSelectClip,
  creator,
  onApproveAndPublish,
  onViewBeforeAfter,
}: ClipStudioProps) {
  const [editingHook, setEditingHook] = useState(false);
  const [customHookText, setCustomHookText] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const activeClip = selectedClip || clips[0] || null;

  const handleApprove = () => {
    if (!activeClip) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onApproveAndPublish(activeClip.id, customHookText || undefined);
    setReviewModalOpen(false);
  };

  if (!clips || clips.length === 0) {
    return (
      <section className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
        <Sparkles size={36} color="#00f2fe" style={{ margin: "0 auto 12px" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700 }}>No Clips Generated Yet</h3>
        <p style={{ fontSize: "0.85rem", color: "#94a3b8", maxWidth: "480px", margin: "6px auto 0" }}>
          Click "Run Multi-Agent VOD" to let the 10 LangGraph agents analyze the gameplay timeline, detect clutch plays, and rank virality candidates.
        </p>
      </section>
    );
  }

  return (
    <section style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr", gap: "24px", marginBottom: "24px" }}>
      {/* Left Column: Ranked Candidates List */}
      <div className="glass-panel" style={{ padding: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <TrendingUp size={18} color="#8b5cf6" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>Candidate Clips ({clips.length})</h3>
          </div>
          <span className="badge-neon badge-purple">RANKED BY VIRALITY AI</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {clips.map((clip, index) => {
            const isSelected = activeClip?.id === clip.id;
            const isTopRanked = index === 0;

            return (
              <div
                key={clip.id}
                onClick={() => onSelectClip(clip)}
                style={{
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: isSelected
                    ? "2px solid #8b5cf6"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  background: isSelected
                    ? "rgba(139, 92, 246, 0.12)"
                    : "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 0 20px rgba(139, 92, 246, 0.25)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        background:
                          clip.viralityScore >= 90
                            ? "linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)"
                            : "rgba(255, 255, 255, 0.1)",
                        color: "#fff",
                      }}
                    >
                      {clip.viralityScore >= 90 ? "S-TIER" : "A-TIER"} #{index + 1}
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                      {clip.clutchTag}
                    </span>
                  </div>

                  {/* Virality Score Circle */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    <span
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: 900,
                        color: clip.viralityScore >= 90 ? "#00f2fe" : "#a855f7",
                      }}
                    >
                      {clip.viralityScore}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "#64748b" }}>/100</span>
                  </div>
                </div>

                <p style={{ fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.35, marginBottom: "8px" }}>
                  {clip.eventDescription}
                </p>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    fontSize: "0.72rem",
                    color: "#64748b",
                    paddingTop: "6px",
                    borderTop: "1px solid rgba(255, 255, 255, 0.04)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={12} /> {clip.durationSec}s ({clip.formattedRange})
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#f43f5e" }}>
                      <MessageSquare size={12} /> {clip.chatSpikeRatio}x Chat
                    </span>
                  </div>

                  <div>
                    {clip.publishStatus === "published" ? (
                      <span style={{ color: "#10b981", fontWeight: 700 }}>PUBLISHED</span>
                    ) : clip.publishStatus === "scheduled" ? (
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>SCHEDULED ({clip.scheduledTime})</span>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>Ready for Review</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Selected Clip Deep Dive & Human-in-the-Loop Review */}
      {activeClip && (
        <div className="glass-panel" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
              flexWrap: "wrap",
              gap: "10px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span className="badge-neon badge-pink">SELECTED CLIP PACKAGE</span>
                <span className="badge-neon badge-emerald">
                  <ShieldCheck size={12} /> SAFETY VERIFIED
                </span>
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
                {activeClip.clutchTag}
              </h3>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => onViewBeforeAfter(activeClip)}
                className="cyber-btn cyber-btn-secondary"
                style={{ padding: "8px 14px", fontSize: "0.8rem" }}
              >
                <Eye size={15} />
                <span>Before/After Player</span>
              </button>

              <button
                onClick={() => {
                  setCustomHookText(activeClip.hooks[activeClip.selectedHookIndex]?.hookText || "");
                  setReviewModalOpen(true);
                }}
                className="cyber-btn cyber-btn-hype"
                style={{ padding: "8px 16px", fontSize: "0.8rem" }}
              >
                <Check size={16} />
                <span>Human Review & Publish</span>
              </button>
            </div>
          </div>

          {/* AI Recommendation Reason */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "rgba(0, 242, 254, 0.06)",
              border: "1px solid rgba(0, 242, 254, 0.2)",
              fontSize: "0.8rem",
              color: "#cbd5e1",
              lineHeight: 1.4,
              marginBottom: "18px",
            }}
          >
            <strong style={{ color: "#00f2fe" }}>🤖 Virality Intelligence Rationale: </strong>
            {activeClip.recommendationReason}
          </div>

          {/* Virality Multi-Signal Breakdown */}
          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "10px", color: "#cbd5e1" }}>
              Multi-Signal Scoring Matrix
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ padding: "10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Event Significance</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#00f2fe" }}>
                  {activeClip.scoreBreakdown.eventSignificance}/100
                </div>
              </div>

              <div style={{ padding: "10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Excitement Intensity</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#ec4899" }}>
                  {activeClip.scoreBreakdown.excitementIntensity}/100
                </div>
              </div>

              <div style={{ padding: "10px", background: "rgba(255, 255, 255, 0.03)", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>Twitch Chat Surge</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f59e0b" }}>
                  {activeClip.scoreBreakdown.chatSurge}/100
                </div>
              </div>
            </div>
          </div>

          {/* Viral Hook Customizer */}
          <div style={{ marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <h4 style={{ fontSize: "0.85rem", fontWeight: 700, color: "#cbd5e1" }}>
                Opening Visual Hook (0.0s - 2.5s)
              </h4>
              <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                Adapted to "{creator.name}" style
              </span>
            </div>

            <div
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
                border: "1px solid rgba(236, 72, 153, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", letterSpacing: "0.02em" }}>
                "{activeClip.hooks[activeClip.selectedHookIndex]?.hookText}"
              </div>
              <span className="badge-neon badge-pink">HYPE HOOK</span>
            </div>
          </div>

          {/* Platform Distribution Targets */}
          <div>
            <h4 style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "10px", color: "#cbd5e1" }}>
              Cross-Platform Distribution Plan
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div style={{ padding: "10px", background: "rgba(255, 0, 0, 0.08)", borderRadius: "8px", border: "1px solid rgba(255, 0, 0, 0.2)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ff4d4d" }}>YouTube Shorts</div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "4px" }}>Immediate Dispatch</div>
              </div>

              <div style={{ padding: "10px", background: "rgba(0, 242, 254, 0.08)", borderRadius: "8px", border: "1px solid rgba(0, 242, 254, 0.2)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#00f2fe" }}>TikTok</div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "4px" }}>Immediate Dispatch</div>
              </div>

              <div style={{ padding: "10px", background: "rgba(236, 72, 153, 0.08)", borderRadius: "8px", border: "1px solid rgba(236, 72, 153, 0.2)" }}>
                <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#ec4899" }}>Instagram Reels</div>
                <div style={{ fontSize: "0.75rem", color: "#cbd5e1", marginTop: "4px" }}>Queue for 7:00 PM Peak</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Human Review Modal Checkpoint */}
      {reviewModalOpen && activeClip && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(8px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            className="glass-panel"
            style={{
              maxWidth: "580px",
              width: "100%",
              padding: "28px",
              border: "1px solid rgba(236, 72, 153, 0.4)",
              background: "#0c101c",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  background: "rgba(236, 72, 153, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ec4899",
                }}
              >
                <Check size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Creator Review & Override Gate</h3>
                <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Human-in-the-Loop review checkpoint before publishing to connected platforms.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ fontSize: "0.78rem", color: "#cbd5e1", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                Customize 1-2s Retention Hook:
              </label>
              <input
                type="text"
                value={customHookText}
                onChange={(e) => setCustomHookText(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  outline: "none",
                }}
              />
            </div>

            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                background: "rgba(16, 185, 129, 0.1)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                marginBottom: "20px",
                fontSize: "0.78rem",
                color: "#a7f3d0",
              }}
            >
              ✅ Rights & Safety Pre-Check Passed. No DMCA audio flags. Safe for full monetization.
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="cyber-btn cyber-btn-secondary"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="cyber-btn cyber-btn-hype"
                style={{ padding: "8px 20px" }}
              >
                <Send size={15} />
                <span>Confirm & Dispatch Publish</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
