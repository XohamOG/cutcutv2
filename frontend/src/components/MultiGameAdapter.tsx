"use client";

import React, { useState } from "react";
import {
  Gamepad2,
  Crosshair,
  Car,
  Shield,
  Zap,
  Target,
  CheckCircle2,
  Code2,
  Sparkles,
} from "lucide-react";
import { GameType } from "@/lib/types/pipeline";

interface GameProfileConfig {
  id: GameType;
  title: string;
  genre: string;
  icon: React.ReactNode;
  hudSignals: string[];
  excitementCorrelation: string;
  sampleEvent: {
    title: string;
    timestamp: string;
    clutchCondition: string;
    hudData: string;
    hookPreview: string;
  };
}

const GAME_PROFILES: GameProfileConfig[] = [
  {
    id: "valorant",
    title: "Valorant",
    genre: "Tactical FPS",
    icon: <Crosshair size={18} />,
    hudSignals: [
      "Top-right Killfeed elimination cascade (3+ kills in 5s)",
      "Spike planted audio beacon & 45s countdown timer",
      "Player health drop to critical threshold (<15 HP)",
      "Remaining alive player disparity (1v3 / 1v4 clutch state)",
    ],
    excitementCorrelation: "Streamer pitch surges to 480Hz + 8.4x chat spike during round-deciding kill.",
    sampleEvent: {
      title: "Ascent A-Site 1v3 Clutch Win",
      timestamp: "1:42:18",
      clutchCondition: "1v3 with 3 HP remaining and 7.4s spike defuse window",
      hudData: "3 kills in 4.2s • Health: 100 ➔ 3 • Spike Defused",
      hookPreview: "3 BULLETS. 1 v 3. GAME POINT. 💀",
    },
  },
  {
    id: "rocket_league",
    title: "Rocket League",
    genre: "Esports Vehicular Soccer",
    icon: <Car size={18} />,
    hudSignals: [
      "Overtime game clock at exactly 0:00 (Ball keep-up state)",
      "Ball speed threshold (>120 km/h ceiling pinch / aerial)",
      "Last-ditch goal line trajectory vector calculation",
      "Flip-reset boost consumption mechanics telemetry",
    ],
    excitementCorrelation: "Caster scream burst + Twitch chat 'WHAT A SAVE! / POG' burst at 9.2x baseline.",
    sampleEvent: {
      title: "0-Second Overtime Buzzer Beater Aerial",
      timestamp: "1:30:10",
      clutchCondition: "Tie match, ball kept airborne at 0 seconds, 128 km/h ceiling pinch",
      hudData: "Speed: 128 km/h • Time: +0:00 OT • Distance: Full pitch",
      hookPreview: "THE ZERO SECOND GOAL THAT BROKE RLCS 🚀🔥",
    },
  },
  {
    id: "cs2",
    title: "Counter-Strike 2",
    genre: "Competitive Tactical FPS",
    icon: <Target size={18} />,
    hudSignals: [
      "0.4s defuse kit countdown with T players alive",
      "Deagle eco-round one-tap headshot auditory feedback",
      "Bomb planted tick-rate audio acceleration",
      "1v4 alive ratio calculation on Mirage B site",
    ],
    excitementCorrelation: "Voice pitch spike + chat message rate 7.8x baseline with 'VAC / CHECK HIM PC' emotes.",
    sampleEvent: {
      title: "Mirage B-Site 1v4 Eco Deagle Ace",
      timestamp: "1:13:00",
      clutchCondition: "1v4 Eco round win with 14 HP and 0.4s defuse kit remaining",
      hudData: "4 Headshots • Ammo: 2 remaining • Defuse: 0.4s remaining",
      hookPreview: "HE JUST 1v4 ECO CLUTCHED ON 14 HP 💀🎯",
    },
  },
  {
    id: "apex_legends",
    title: "Apex Legends",
    genre: "Battle Royale",
    icon: <Shield size={18} />,
    hudSignals: [
      "Final ring collapse radius (< 15 meters)",
      "Squad wipe skull banner animation in top-center HUD",
      "Armor shield crack sound wave & damage numbers > 400",
      "Solo surviving squad member vs full enemy trio",
    ],
    excitementCorrelation: "Streamer victory yell + 8.0x chat explosion with 'CHAMPION' banner.",
    sampleEvent: {
      title: "Final Ring 1v3 Solo Champion Squad Wipe",
      timestamp: "1:00:20",
      clutchCondition: "Solo player vs last 3 squads, final 1v3 ring standoff",
      hudData: "3 Squad Kills • Damage: 2,840 • Ring 6 closing",
      hookPreview: "HOW TO 1v3 WIN APEX AS A SOLO 🏆🔥",
    },
  },
];

export default function MultiGameAdapter() {
  const [selectedGame, setSelectedGame] = useState<GameType>("valorant");

  const currentProfile = GAME_PROFILES.find((g) => g.id === selectedGame) || GAME_PROFILES[0];

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
              <Gamepad2 size={12} /> MULTI-GAME SIGNAL ADAPTATION
            </span>
            <span className="badge-neon badge-cyan">ADVANCED FEATURE 2</span>
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            Cross-Game HUD Parsing & Signal Generalization
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            The event detection agent abstracts genre-specific signals (FPS kill-feeds, racing overtakes, rocket aerials) into unified clutch excitement scores.
          </p>
        </div>
      </div>

      {/* Game Selector Pills */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {GAME_PROFILES.map((gp) => {
          const isSelected = selectedGame === gp.id;
          return (
            <button
              key={gp.id}
              onClick={() => setSelectedGame(gp.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "10px",
                border: isSelected ? "2px solid #a855f7" : "1px solid rgba(255, 255, 255, 0.08)",
                background: isSelected ? "rgba(168, 85, 247, 0.15)" : "rgba(255, 255, 255, 0.02)",
                color: isSelected ? "#fff" : "#94a3b8",
                fontWeight: 700,
                fontSize: "0.85rem",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 0 15px rgba(168, 85, 247, 0.3)" : "none",
              }}
            >
              {gp.icon}
              <span>{gp.title}</span>
              <span style={{ fontSize: "0.7rem", opacity: 0.7, fontWeight: 500 }}>
                ({gp.genre})
              </span>
            </button>
          );
        })}
      </div>

      {/* Game Profile Analysis Card */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr",
          gap: "20px",
        }}
      >
        {/* Left: Generalizable HUD Extraction Engine */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <Code2 size={16} color="#00f2fe" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#fff" }}>
              HUD & OCR Event Parsing Rules ({currentProfile.title})
            </h3>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
            {currentProfile.hudSignals.map((signal, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  fontSize: "0.78rem",
                  color: "#cbd5e1",
                  background: "rgba(255, 255, 255, 0.02)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(255, 255, 255, 0.04)",
                }}
              >
                <CheckCircle2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: "2px" }} />
                <span>{signal}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "rgba(168, 85, 247, 0.1)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              fontSize: "0.78rem",
              color: "#e9d5ff",
            }}
          >
            <strong>Excitement Cross-Correlation: </strong>
            {currentProfile.excitementCorrelation}
          </div>
        </div>

        {/* Right: Detected Moment & Hook Proof */}
        <div
          style={{
            background: "rgba(0, 0, 0, 0.35)",
            borderRadius: "14px",
            padding: "20px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
              <span className="badge-neon badge-pink">DETECTED CLUTCH SAMPLE</span>
              <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#00f2fe" }}>
                @{currentProfile.sampleEvent.timestamp}
              </span>
            </div>

            <h4 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", marginBottom: "6px" }}>
              {currentProfile.sampleEvent.title}
            </h4>

            <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.4, marginBottom: "12px" }}>
              {currentProfile.sampleEvent.clutchCondition}
            </p>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.72rem",
                color: "#10b981",
                background: "rgba(16, 185, 129, 0.08)",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid rgba(16, 185, 129, 0.2)",
                marginBottom: "16px",
              }}
            >
              HUD Telemetry: {currentProfile.sampleEvent.hudData}
            </div>
          </div>

          {/* Generated Hook Banner */}
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
              border: "1px solid rgba(236, 72, 153, 0.4)",
            }}
          >
            <div style={{ fontSize: "0.68rem", color: "#f472b6", fontWeight: 700, textTransform: "uppercase" }}>
              Autonomous Viral Hook Output:
            </div>
            <div style={{ fontSize: "0.95rem", fontWeight: 900, color: "#fff", marginTop: "2px" }}>
              "{currentProfile.sampleEvent.hookPreview}"
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
