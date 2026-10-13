"use client";

import React, { useState } from "react";
import {
  Film,
  Sparkles,
  Play,
  Check,
  X,
  Clock,
  Layers,
  Send,
  Download,
} from "lucide-react";
import { CandidateClip } from "@/lib/types/pipeline";
import confetti from "canvas-confetti";

interface HighlightReelModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: CandidateClip[];
}

export default function HighlightReelModal({
  isOpen,
  onClose,
  clips,
}: HighlightReelModalProps) {
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembled, setAssembled] = useState(false);
  const [reelTitle, setReelTitle] = useState("BEST RADIANT CLUTCHES OF THE WEEK - VOL. 4");

  if (!isOpen) return null;

  const totalDuration = clips.reduce((acc, c) => acc + c.durationSec, 0) + 8; // + intro/outro

  const handleAssemble = () => {
    setIsAssembling(true);
    setTimeout(() => {
      setIsAssembling(false);
      setAssembled(true);
      confetti({
        particleCount: 70,
        spread: 80,
      });
    }, 1200);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(10px)",
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
          maxWidth: "680px",
          width: "100%",
          padding: "28px",
          border: "1px solid rgba(0, 242, 254, 0.3)",
          background: "#0c101c",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "10px",
                background: "rgba(0, 242, 254, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#00f2fe",
              }}
            >
              <Film size={20} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800 }}>Auto-Generated Highlight Reel</h3>
                <span className="badge-neon badge-cyan">FEATURE 7</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Multi-session compilation engine stitching top clutch moments into a weekly showcase.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Title Input */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ fontSize: "0.75rem", color: "#cbd5e1", fontWeight: 600, display: "block", marginBottom: "6px" }}>
            Compilation Video Title:
          </label>
          <input
            type="text"
            value={reelTitle}
            onChange={(e) => setReelTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              color: "#fff",
              fontSize: "0.85rem",
              fontWeight: 700,
              outline: "none",
            }}
          />
        </div>

        {/* Selected Clip Timeline Stems */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "#94a3b8", marginBottom: "8px" }}>
            <span>Stitched Timeline Tracks ({clips.length} moments + Intro/Outro)</span>
            <span>Total Duration: ~{totalDuration}s</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ padding: "8px 12px", background: "rgba(0, 242, 254, 0.08)", borderRadius: "6px", fontSize: "0.75rem", color: "#00f2fe", display: "flex", justifyContent: "space-between" }}>
              <span>🎬 Intro Card: Title + Beat Drop Intro</span>
              <span>3.5s</span>
            </div>

            {clips.map((clip, i) => (
              <div
                key={clip.id}
                style={{
                  padding: "8px 12px",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "6px",
                  fontSize: "0.75rem",
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#cbd5e1",
                  border: "1px solid rgba(255, 255, 255, 0.05)",
                }}
              >
                <span>
                  #{i + 1} {clip.clutchTag} ({clip.viralityScore}/100 VIRAL)
                </span>
                <span>{clip.durationSec}s</span>
              </div>
            ))}

            <div style={{ padding: "8px 12px", background: "rgba(236, 72, 153, 0.08)", borderRadius: "6px", fontSize: "0.75rem", color: "#ec4899", display: "flex", justifyContent: "space-between" }}>
              <span>🔔 Outro Card: Streamer Socials & Follow Prompt</span>
              <span>4.5s</span>
            </div>
          </div>
        </div>

        {assembled ? (
          <div
            style={{
              padding: "14px",
              background: "rgba(16, 185, 129, 0.1)",
              borderRadius: "10px",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            <div style={{ color: "#34d399", fontWeight: 800, fontSize: "0.95rem" }}>
              ✨ 60-Second Weekly Highlight Reel Assembled Successfully!
            </div>
            <div style={{ color: "#a7f3d0", fontSize: "0.78rem", marginTop: "4px" }}>
              Audio normalized to -14 LUFS, seamless whip-pan transitions applied, and chapter cues formatted for YouTube.
            </div>
          </div>
        ) : null}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px" }}>
          <button onClick={onClose} className="cyber-btn cyber-btn-secondary" style={{ padding: "8px 16px" }}>
            Close
          </button>

          {!assembled ? (
            <button
              onClick={handleAssemble}
              disabled={isAssembling}
              className="cyber-btn cyber-btn-primary"
              style={{ padding: "8px 20px" }}
            >
              <Sparkles size={16} />
              <span>{isAssembling ? "Stitching Clips & Audio..." : "Render Compilation Reel"}</span>
            </button>
          ) : (
            <button onClick={onClose} className="cyber-btn cyber-btn-hype" style={{ padding: "8px 20px" }}>
              <Download size={16} />
              <span>Export Master 4K Reel</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
