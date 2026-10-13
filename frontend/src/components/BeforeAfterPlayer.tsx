"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Eye,
  Sliders,
  Shield,
  Smartphone,
  Tv,
} from "lucide-react";
import { CandidateClip } from "@/lib/types/pipeline";

interface BeforeAfterPlayerProps {
  clip: CandidateClip | null;
}

export default function BeforeAfterPlayer({ clip }: BeforeAfterPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showFacecam, setShowFacecam] = useState(true);

  const duration = clip ? clip.durationSec : 22;

  // Animation timer loop for synchronized playback
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTimeSec((prev) => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return +(prev + 0.1).toFixed(1);
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, duration]);

  if (!clip) {
    return (
      <div className="glass-panel" style={{ padding: "40px", textAlign: "center" }}>
        <p style={{ color: "#94a3b8" }}>Select or generate a clip candidate to view the Before & After comparison.</p>
      </div>
    );
  }

  // Find active caption line based on relative elapsed seconds
  const relativeSec = (clip.startTimeSec || 6124) + currentTimeSec;
  const activeCaption = clip.captions.find(
    (c) => relativeSec >= c.startSec && relativeSec <= c.endSec
  );

  const hook = clip.hooks[clip.selectedHookIndex] || clip.hooks[0];
  const isHookVisible = currentTimeSec <= (hook?.displayDurationSec || 2.5);

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
            <span className="badge-neon badge-pink">BEFORE & AFTER COMPARISON</span>
            <span className="badge-neon badge-cyan">ADVANCED FEATURE 4</span>
          </div>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 800, marginTop: "4px" }}>
            Raw 16:9 Unedited Gameplay vs. Final Autonomous 9:16 Short
          </h2>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
            Synchronized dual-view player demonstrating automated hook placement, speech-synced captions, and smart 9:16 crop.
          </p>
        </div>

        {/* View Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className="cyber-btn cyber-btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              background: showSafeZones ? "rgba(0, 242, 254, 0.15)" : undefined,
              borderColor: showSafeZones ? "#00f2fe" : undefined,
            }}
          >
            <Shield size={14} />
            <span>{showSafeZones ? "Safe Zones: ON" : "Safe Zones: OFF"}</span>
          </button>

          <button
            onClick={() => setShowFacecam(!showFacecam)}
            className="cyber-btn cyber-btn-secondary"
            style={{
              padding: "6px 12px",
              fontSize: "0.75rem",
              background: showFacecam ? "rgba(236, 72, 153, 0.15)" : undefined,
              borderColor: showFacecam ? "#ec4899" : undefined,
            }}
          >
            <Smartphone size={14} />
            <span>Facecam PIP</span>
          </button>
        </div>
      </div>

      {/* Dual Video Player Screen */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 1fr",
          gap: "24px",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        {/* Left: Raw Unedited 16:9 Footage */}
        <div
          style={{
            background: "#080b12",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            overflow: "hidden",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Tv size={14} color="#64748b" />
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#94a3b8" }}>
                BEFORE: Raw 16:9 VOD Footage
              </span>
            </div>
            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
              Time in VOD: {clip.formattedRange}
            </span>
          </div>

          {/* 16:9 Video Canvas Frame */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16/9",
              background: "#05070c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {/* Background Simulated Gameplay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 50% 50%, rgba(20, 30, 50, 0.6) 0%, rgba(5, 7, 12, 0.95) 100%)",
                backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1000&auto=format&fit=crop&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: isPlaying ? "brightness(0.9)" : "brightness(0.6)",
                transition: "filter 0.3s ease",
              }}
            />

            {/* Crosshair Simulation */}
            <div
              style={{
                position: "absolute",
                width: "18px",
                height: "18px",
                border: "2px solid #00f2fe",
                borderRadius: "50%",
                pointerEvents: "none",
                opacity: 0.7,
              }}
            />

            {/* Raw HUD indicators */}
            <div
              style={{
                position: "absolute",
                bottom: "12px",
                left: "16px",
                fontSize: "0.75rem",
                color: "#10b981",
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                background: "rgba(0,0,0,0.6)",
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              HP: 3 • SHIELD: 0 • 1v3 CLUTCH
            </div>

            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "16px",
                fontSize: "0.7rem",
                color: "#ef4444",
                fontFamily: "var(--font-mono)",
                background: "rgba(0,0,0,0.7)",
                padding: "2px 6px",
                borderRadius: "4px",
              }}
            >
              KILLFEED: KAEL_ ➔ ENEMY 3 (HEADSHOT)
            </div>

            {/* Watermark notice */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                left: "16px",
                background: "rgba(0,0,0,0.6)",
                padding: "3px 8px",
                borderRadius: "4px",
                fontSize: "0.68rem",
                color: "#94a3b8",
              }}
            >
              Raw Stream Unedited
            </div>
          </div>
        </div>

        {/* Right: Autonomous 9:16 Reframed Short-Form Clip */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              padding: "6px 14px",
              background: "rgba(236, 72, 153, 0.1)",
              borderRadius: "20px",
              border: "1px solid rgba(236, 72, 153, 0.3)",
              marginBottom: "10px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <Sparkles size={14} color="#ec4899" />
            <span style={{ fontSize: "0.75rem", fontWeight: 800, color: "#ec4899" }}>
              AFTER: Autonomous 9:16 Reframe & Hook AI
            </span>
          </div>

          {/* 9:16 Vertical Smartphone Mockup Frame */}
          <div
            style={{
              position: "relative",
              width: "280px",
              aspectRatio: "9/16",
              borderRadius: "28px",
              border: "3px solid rgba(255, 255, 255, 0.2)",
              boxShadow: "0 0 35px rgba(236, 72, 153, 0.3)",
              overflow: "hidden",
              background: "#000",
            }}
          >
            {/* Background Blur Fill (Letterbox aesthetic) */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                filter: "blur(20px) brightness(0.4)",
                transform: "scale(1.2)",
              }}
            />

            {/* Smart Action-Center Cropped Video Window */}
            <div
              style={{
                position: "absolute",
                top: "20%",
                left: 0,
                right: 0,
                height: "60%",
                backgroundImage: `url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80')`,
                backgroundSize: "160%",
                backgroundPosition: "50% 50%",
                boxShadow: "0 0 20px rgba(0,0,0,0.8)",
              }}
            >
              {/* Dynamic crosshair glow */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "12px",
                  height: "12px",
                  border: "2px solid #00f2fe",
                  borderRadius: "50%",
                }}
              />
            </div>

            {/* Viral Opening Hook (First 2.5s) */}
            {isHookVisible && hook && (
              <div
                style={{
                  position: "absolute",
                  top: "8%",
                  left: "8px",
                  right: "8px",
                  background: "linear-gradient(135deg, rgba(236, 72, 153, 0.95) 0%, rgba(139, 92, 246, 0.95) 100%)",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  textAlign: "center",
                  boxShadow: "0 4px 15px rgba(236, 72, 153, 0.6)",
                  animation: "bounceIn 0.4s ease",
                  zIndex: 20,
                }}
              >
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    lineHeight: 1.2,
                  }}
                >
                  {hook.hookText}
                </div>
              </div>
            )}

            {/* Facecam Picture-in-Picture */}
            {showFacecam && (
              <div
                style={{
                  position: "absolute",
                  top: "22%",
                  left: "12px",
                  width: "72px",
                  height: "72px",
                  borderRadius: "12px",
                  border: "2px solid #00f2fe",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0, 242, 254, 0.4)",
                  zIndex: 15,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=160&auto=format&fit=crop&q=80"
                  alt="Facecam Streamer"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}

            {/* Speech-Synced Animated Subtitles */}
            {activeCaption && (
              <div
                style={{
                  position: "absolute",
                  bottom: "26%",
                  left: "12px",
                  right: "12px",
                  textAlign: "center",
                  zIndex: 25,
                }}
              >
                <div
                  style={{
                    display: "inline-block",
                    background: "rgba(0, 0, 0, 0.85)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    fontSize: "0.85rem",
                    fontWeight: 900,
                    color: "#fffa65",
                    textShadow: "0 2px 4px rgba(0,0,0,0.9)",
                    letterSpacing: "0.02em",
                  }}
                >
                  {activeCaption.text}
                </div>
              </div>
            )}

            {/* Mobile Platform UI Safe-Zone Overlay (TikTok / Shorts buttons) */}
            {showSafeZones && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: "none",
                  border: "1px dashed rgba(255, 255, 255, 0.25)",
                  zIndex: 30,
                }}
              >
                {/* Right side interaction buttons */}
                <div
                  style={{
                    position: "absolute",
                    right: "8px",
                    bottom: "18%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "12px",
                    opacity: 0.7,
                  }}
                >
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                  <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: "rgba(255,255,255,0.2)" }} />
                </div>
                {/* Safe zone disclaimer */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "6px",
                    left: "10px",
                    fontSize: "0.6rem",
                    color: "rgba(255,255,255,0.4)",
                  }}
                >
                  Safe Zone: Title & UI clear
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Synchronized Playback Control Bar */}
      <div
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          borderRadius: "12px",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="cyber-btn cyber-btn-primary"
          style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: "2px" }} />}
        </button>

        <button
          onClick={() => {
            setCurrentTimeSec(0);
            setIsPlaying(true);
          }}
          className="cyber-btn cyber-btn-secondary"
          style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Timeline Scrubber */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#94a3b8", minWidth: "35px" }}>
            {currentTimeSec.toFixed(1)}s
          </span>

          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTimeSec}
            onChange={(e) => setCurrentTimeSec(parseFloat(e.target.value))}
            style={{
              flex: 1,
              accentColor: "#ec4899",
              cursor: "pointer",
            }}
          />

          <span style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#94a3b8", minWidth: "35px" }}>
            {duration}s
          </span>
        </div>

        {/* Audio Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="cyber-btn cyber-btn-secondary"
          style={{ width: "36px", height: "36px", padding: 0, borderRadius: "50%" }}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </section>
  );
}
