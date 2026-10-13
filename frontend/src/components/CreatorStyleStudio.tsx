"use client";

import React, { useState } from "react";
import {
  Brain,
  Sparkles,
  Type,
  Sliders,
  Check,
  Plus,
  Trash2,
  Lock,
} from "lucide-react";
import { CreatorProfile } from "@/lib/types/pipeline";

interface CreatorStyleStudioProps {
  creator: CreatorProfile;
  onUpdateCreator: (updated: CreatorProfile) => void;
}

export default function CreatorStyleStudio({
  creator,
  onUpdateCreator,
}: CreatorStyleStudioProps) {
  const [newKeyword, setNewKeyword] = useState("");

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword.trim()) return;
    onUpdateCreator({
      ...creator,
      favoriteKeywords: [...creator.favoriteKeywords, newKeyword.trim().toUpperCase()],
    });
    setNewKeyword("");
  };

  const handleRemoveKeyword = (kw: string) => {
    onUpdateCreator({
      ...creator,
      favoriteKeywords: creator.favoriteKeywords.filter((k) => k !== kw),
    });
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
            <span className="badge-neon badge-purple">
              <Brain size={12} /> CREATOR STYLE MEMORY
            </span>
            <span className="badge-neon badge-cyan">ADVANCED FEATURE 3</span>
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            Learned Style Persona & Tone Adaptation ({creator.name})
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Agent 6 adapts retention hooks, caption fonts, and emoji vocabulary to match each streamer's unique brand voice.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "20px" }}>
        {/* Tone Style Selector */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "12px" }}>
            Editorial Voice & Tone Mode
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {[
              {
                id: "hype_energetic",
                title: "Hype & High Energy",
                desc: "ALL-CAPS opening hooks, flame/skull emojis, fast cuts, high excitement callouts.",
              },
              {
                id: "tactical_esports",
                title: "Tactical & Esports IQ",
                desc: "Analysis-focused hooks, positioning commentary, clutch decision breakdown.",
              },
              {
                id: "comedic_chaotic",
                title: "Comedic & Chaotic",
                desc: "Self-deprecating irony, funny sound cues, meme-inspired text overlays.",
              },
            ].map((mode) => {
              const isSelected = creator.toneStyle === mode.id;
              return (
                <div
                  key={mode.id}
                  onClick={() =>
                    onUpdateCreator({
                      ...creator,
                      toneStyle: mode.id as CreatorProfile["toneStyle"],
                    })
                  }
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    border: isSelected ? "2px solid #ec4899" : "1px solid rgba(255, 255, 255, 0.06)",
                    background: isSelected ? "rgba(236, 72, 153, 0.12)" : "rgba(255, 255, 255, 0.02)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                      {mode.title}
                    </div>
                    {isSelected && <span className="badge-neon badge-pink">ACTIVE</span>}
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#94a3b8", marginTop: "4px" }}>
                    {mode.desc}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Favorite Keywords Memory Bank */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <h3 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#cbd5e1", marginBottom: "12px" }}>
            Creator Keyword & Catchphrase Memory
          </h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {creator.favoriteKeywords.map((kw) => (
              <span
                key={kw}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  background: "rgba(0, 242, 254, 0.12)",
                  color: "#00f2fe",
                  border: "1px solid rgba(0, 242, 254, 0.3)",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                <span>{kw}</span>
                <X
                  size={12}
                  style={{ cursor: "pointer" }}
                  onClick={() => handleRemoveKeyword(kw)}
                />
              </span>
            ))}
          </div>

          <form onSubmit={handleAddKeyword} style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              placeholder="Add catchphrase (e.g. INSANE, GG)..."
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#fff",
                fontSize: "0.8rem",
                outline: "none",
              }}
            />
            <button type="submit" className="cyber-btn cyber-btn-secondary" style={{ padding: "8px 14px" }}>
              <Plus size={14} /> Add
            </button>
          </form>

          {/* Auto Publish Threshold */}
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid rgba(255, 255, 255, 0.06)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "#cbd5e1", marginBottom: "8px" }}>
              <span>Auto-Publish Threshold:</span>
              <strong style={{ color: "#00f2fe" }}>{creator.autoPublishThreshold}+ / 100 Virality</strong>
            </div>
            <input
              type="range"
              min={70}
              max={98}
              value={creator.autoPublishThreshold}
              onChange={(e) =>
                onUpdateCreator({
                  ...creator,
                  autoPublishThreshold: parseInt(e.target.value),
                })
              }
              style={{ width: "100%", accentColor: "#00f2fe", cursor: "pointer" }}
            />
            <p style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "4px" }}>
              Clips scoring above {creator.autoPublishThreshold} bypass manual approval and publish immediately to Shorts & TikTok.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function X(props: { size: number; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <span
      onClick={props.onClick}
      style={{
        cursor: "pointer",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...props.style,
      }}
    >
      ×
    </span>
  );
}
