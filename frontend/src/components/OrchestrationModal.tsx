"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  FileVideo,
  Crosshair,
  Volume2,
  Scissors,
  TrendingUp,
  Type,
  Smartphone,
  ShieldCheck,
  Check,
  RotateCcw,
  Download,
  Share2,
  Sparkles,
  X,
  Play,
  Pause,
  FastForward,
  Eye,
  Sliders,
} from "lucide-react";
import confetti from "canvas-confetti";
import { CandidateClip } from "@/lib/types/pipeline";
import { MOCK_CLIPS_VALORANT } from "@/lib/mockData/presets";

export interface OrchestrationStep {
  id: string;
  label: string;
  sub: string;
  metric: string;
  icon: React.ReactNode;
  durationMs: number;
}

const ORCHESTRATION_STEPS: OrchestrationStep[] = [
  {
    id: "ingestion",
    label: "Ingestion",
    sub: "Chunks & Timeline",
    metric: "12 chunks synchronized (1080p60)",
    icon: <FileVideo size={17} />,
    durationMs: 1100,
  },
  {
    id: "event_detection",
    label: "Game Event",
    sub: "HUD & Clutch Detector",
    metric: "1v3 Clutch Ace at 1:42:18 (98.2% conf)",
    icon: <Crosshair size={17} />,
    durationMs: 1200,
  },
  {
    id: "excitement_analysis",
    label: "Excitement",
    sub: "Acoustics & Chat",
    metric: "Audio +14.8dB Peak • Chat 8.4x Surge",
    icon: <Volume2 size={17} />,
    durationMs: 1100,
  },
  {
    id: "candidate_generation",
    label: "Candidate Gen",
    sub: "Boundary Trimming",
    metric: "22s Tight Clip [1:42:04 - 1:42:26]",
    icon: <Scissors size={17} />,
    durationMs: 1000,
  },
  {
    id: "virality_ranking",
    label: "Virality Rank",
    sub: "Predictive Score",
    metric: "Score 94/100 • S-TIER Retention",
    icon: <TrendingUp size={17} />,
    durationMs: 1200,
  },
  {
    id: "caption_hook",
    label: "Caption & Hook",
    sub: "Retention Hooks",
    metric: "Hook: '3 BULLETS. 1v3. GAME POINT. 💀'",
    icon: <Type size={17} />,
    durationMs: 1000,
  },
  {
    id: "vertical_reformat",
    label: "Vertical 9:16",
    sub: "Facecam Tracking",
    metric: "Smart Split Crop • Streamer Centered",
    icon: <Smartphone size={17} />,
    durationMs: 1200,
  },
  {
    id: "safety_check",
    label: "Safety & Rights",
    sub: "DMCA Clearance",
    metric: "Audio DMCA Clean • 0 Copyright Flags",
    icon: <ShieldCheck size={17} />,
    durationMs: 900,
  },
];

interface OrchestrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoTitle?: string;
  gamePreset?: string;
}

export default function OrchestrationModal({
  isOpen,
  onClose,
  videoTitle = "Valorant_Ascent_Clutch_1080p.mp4",
  gamePreset = "valorant",
}: OrchestrationModalProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"vertical" | "raw">("vertical");
  const [isPlayingClip, setIsPlayingClip] = useState<boolean>(true);
  const [selectedInspectStep, setSelectedInspectStep] = useState<number>(0);
  const [exportedSuccess, setExportedSuccess] = useState<boolean>(false);

  const clip: CandidateClip = MOCK_CLIPS_VALORANT[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger celebration confetti with user's Pantone palette
  const firePaletteConfetti = () => {
    confetti({
      particleCount: 75,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#F3EFE0", "#B7D8BA", "#F7CFDC", "#3B2822"],
    });
  };

  // Reset & start sequence when opened
  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIsDone(false);
    setIsPaused(false);
    setSelectedInspectStep(0);
    setExportedSuccess(false);

    let idx = 0;
    const runNext = () => {
      if (idx < ORCHESTRATION_STEPS.length) {
        setCurrentStepIndex(idx);
        setSelectedInspectStep(idx);
        const stepDuration = ORCHESTRATION_STEPS[idx].durationMs;

        timerRef.current = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, ORCHESTRATION_STEPS[idx].id]);
          idx += 1;
          if (idx < ORCHESTRATION_STEPS.length) {
            runNext();
          } else {
            setIsDone(true);
            firePaletteConfetti();
          }
        }, stepDuration);
      }
    };

    runNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  const handleFastForward = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const allIds = ORCHESTRATION_STEPS.map((s) => s.id);
    setCompletedSteps(allIds);
    setCurrentStepIndex(ORCHESTRATION_STEPS.length - 1);
    setSelectedInspectStep(ORCHESTRATION_STEPS.length - 1);
    setIsDone(true);
    firePaletteConfetti();
  };

  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrentStepIndex(0);
    setCompletedSteps([]);
    setIsDone(false);
    setSelectedInspectStep(0);
    setExportedSuccess(false);

    let idx = 0;
    const runNext = () => {
      if (idx < ORCHESTRATION_STEPS.length) {
        setCurrentStepIndex(idx);
        setSelectedInspectStep(idx);
        const stepDuration = ORCHESTRATION_STEPS[idx].durationMs;

        timerRef.current = setTimeout(() => {
          setCompletedSteps((prev) => [...prev, ORCHESTRATION_STEPS[idx].id]);
          idx += 1;
          if (idx < ORCHESTRATION_STEPS.length) {
            runNext();
          } else {
            setIsDone(true);
            firePaletteConfetti();
          }
        }, stepDuration);
      }
    };

    runNext();
  };

  if (!isOpen) return null;

  const currentStep = ORCHESTRATION_STEPS[selectedInspectStep] || ORCHESTRATION_STEPS[0];
  const progressPct = Math.round(
    ((isDone ? ORCHESTRATION_STEPS.length : completedSteps.length) /
      ORCHESTRATION_STEPS.length) *
      100
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
        background: "rgba(20, 11, 9, 0.78)",
        backdropFilter: "blur(40px)",
        WebkitBackdropFilter: "blur(40px)",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {/* Click outside to close */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          cursor: "pointer",
        }}
      />

      {/* Main Glassmorphic Showcase Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "1080px",
          maxHeight: "92vh",
          overflowY: "auto",
          background: "linear-gradient(145deg, rgba(50, 32, 26, 0.72) 0%, rgba(32, 20, 16, 0.88) 100%)",
          backdropFilter: "blur(36px)",
          WebkitBackdropFilter: "blur(36px)",
          border: "1px solid rgba(243, 239, 224, 0.18)",
          borderRadius: "28px",
          boxShadow: "0 30px 80px rgba(10, 5, 4, 0.8), inset 0 1px 0 rgba(243, 239, 224, 0.2)",
          padding: "28px 32px",
          color: "var(--vanilla-ice)",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          zIndex: 10,
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(243, 239, 224, 0.1)",
            paddingBottom: "18px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Pulsing Dot Status */}
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                background: isDone ? "var(--pastel-green)" : "var(--pink-a-boo)",
                boxShadow: isDone
                  ? "0 0 14px var(--pastel-green)"
                  : "0 0 14px var(--pink-a-boo)",
                animation: isDone ? "none" : "pulsePinkDot 1.6s infinite",
              }}
            />
            <div>
              <div
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(243, 239, 224, 0.6)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {isDone ? "ORCHESTRATION COMPLETE" : "REALTIME ARCHITECTURE RUNTIME"}
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--vanilla-ice)",
                  letterSpacing: "-0.01em",
                }}
              >
                {videoTitle}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {!isDone && (
              <button
                onClick={handleFastForward}
                title="Fast forward to results"
                style={{
                  background: "rgba(243, 239, 224, 0.08)",
                  border: "1px solid rgba(243, 239, 224, 0.16)",
                  color: "var(--vanilla-ice)",
                  padding: "6px 14px",
                  borderRadius: "9999px",
                  fontSize: "12px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s",
                }}
              >
                <FastForward size={14} /> Skip
              </button>
            )}

            <button
              onClick={handleRestart}
              title="Restart orchestration showcase"
              style={{
                background: "rgba(243, 239, 224, 0.08)",
                border: "1px solid rgba(243, 239, 224, 0.16)",
                color: "var(--vanilla-ice)",
                padding: "6px 14px",
                borderRadius: "9999px",
                fontSize: "12px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s",
              }}
            >
              <RotateCcw size={14} /> Replay
            </button>

            <button
              onClick={onClose}
              style={{
                background: "rgba(243, 239, 224, 0.08)",
                border: "1px solid rgba(243, 239, 224, 0.16)",
                color: "var(--vanilla-ice)",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Realtime Progress Bar */}
        <div style={{ position: "relative", width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              color: "rgba(243, 239, 224, 0.55)",
              marginBottom: "8px",
            }}
          >
            <span>AGENT GRAPH DISPATCH</span>
            <span>{progressPct}% COMPLETED</span>
          </div>
          <div
            style={{
              height: "4px",
              width: "100%",
              background: "rgba(243, 239, 224, 0.08)",
              borderRadius: "9999px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progressPct}%`,
                background: "linear-gradient(90deg, var(--pastel-green), var(--pink-a-boo), var(--vanilla-ice))",
                boxShadow: "0 0 12px var(--pastel-green)",
                transition: "width 0.4s ease-out",
              }}
            />
          </div>
        </div>

        {/* ARCHITECTURE PIPELINE WITH LIGHT-UP DOTS ANIMATION */}
        <div
          style={{
            position: "relative",
            background: "rgba(25, 14, 11, 0.6)",
            border: "1px solid rgba(243, 239, 224, 0.12)",
            borderRadius: "20px",
            padding: "22px 18px",
            overflow: "hidden",
          }}
        >
          {/* Subtle Ambient Dots in background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(circle at 30% 30%, rgba(247, 207, 220, 0.05) 0%, transparent 60%), radial-gradient(circle at 70% 70%, rgba(183, 216, 186, 0.05) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* Connected SVG Conduit with Traveling Light Dots */}
          <svg
            style={{
              position: "absolute",
              top: "42px",
              left: "40px",
              right: "40px",
              width: "calc(100% - 80px)",
              height: "20px",
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 1,
            }}
          >
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#B7D8BA" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#F7CFDC" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#F3EFE0" stopOpacity="0.3" />
              </linearGradient>
              <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Base track line */}
            <line
              x1="0"
              y1="10"
              x2="100%"
              y2="10"
              stroke="rgba(243, 239, 224, 0.1)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />

            {/* Illuminated active line */}
            <line
              x1="0"
              y1="10"
              x2={`${Math.min(100, (currentStepIndex / (ORCHESTRATION_STEPS.length - 1)) * 100)}%`}
              y2="10"
              stroke="url(#lineGrad)"
              strokeWidth="2.5"
              filter="url(#glowFilter)"
              style={{ transition: "x2 0.8s ease-out" }}
            />

            {/* Traveling Light Photon Dots */}
            {!isDone && (
              <>
                <circle
                  cx={`${(currentStepIndex / (ORCHESTRATION_STEPS.length - 1)) * 100}%`}
                  cy="10"
                  r="5"
                  fill="#F7CFDC"
                  filter="url(#glowFilter)"
                  style={{
                    transition: "cx 0.8s ease-out",
                    animation: "pulsePinkDot 1.2s infinite",
                  }}
                />
                <circle
                  cx={`${(currentStepIndex / (ORCHESTRATION_STEPS.length - 1)) * 100}%`}
                  cy="10"
                  r="8"
                  fill="none"
                  stroke="#B7D8BA"
                  strokeWidth="1.5"
                  opacity="0.6"
                  style={{
                    transition: "cx 0.8s ease-out",
                    animation: "pulseDot 1.4s infinite",
                  }}
                />
              </>
            )}
          </svg>

          {/* Agent Nodes Grid */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              display: "grid",
              gridTemplateColumns: "repeat(8, 1fr)",
              gap: "8px",
            }}
          >
            {ORCHESTRATION_STEPS.map((step, idx) => {
              const isCompleted = completedSteps.includes(step.id);
              const isActive = idx === currentStepIndex && !isDone;
              const isSelected = idx === selectedInspectStep;

              return (
                <div
                  key={step.id}
                  onClick={() => setSelectedInspectStep(idx)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    cursor: "pointer",
                    padding: "8px 4px",
                    borderRadius: "14px",
                    background: isSelected
                      ? "rgba(243, 239, 224, 0.08)"
                      : "transparent",
                    border: isSelected
                      ? "1px solid rgba(243, 239, 224, 0.2)"
                      : "1px solid transparent",
                    transition: "all 0.25s ease",
                  }}
                >
                  {/* Light-up Dot & Icon Container */}
                  <div
                    style={{
                      position: "relative",
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: "10px",
                      background: isCompleted
                        ? "rgba(183, 216, 186, 0.18)"
                        : isActive
                        ? "rgba(247, 207, 220, 0.22)"
                        : "rgba(243, 239, 224, 0.05)",
                      border: isCompleted
                        ? "1.5px solid var(--pastel-green)"
                        : isActive
                        ? "1.5px solid var(--pink-a-boo)"
                        : "1px solid rgba(243, 239, 224, 0.15)",
                      color: isCompleted
                        ? "var(--pastel-green)"
                        : isActive
                        ? "var(--pink-a-boo)"
                        : "rgba(243, 239, 224, 0.4)",
                      boxShadow: isCompleted
                        ? "0 0 16px rgba(183, 216, 186, 0.4)"
                        : isActive
                        ? "0 0 20px rgba(247, 207, 220, 0.5)"
                        : "none",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {/* Active Orbital Light Dot Animation */}
                    {isActive && (
                      <div
                        style={{
                          position: "absolute",
                          inset: "-4px",
                          borderRadius: "50%",
                          border: "1px dashed var(--pink-a-boo)",
                          animation: "orbitDot 3s linear infinite",
                          pointerEvents: "none",
                        }}
                      />
                    )}

                    {/* Step Icon or Check */}
                    {isCompleted ? <Check size={18} strokeWidth={2.6} /> : step.icon}

                    {/* Miniature Light-up Status Dot Badge */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-2px",
                        right: "-2px",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: isCompleted
                          ? "var(--pastel-green)"
                          : isActive
                          ? "var(--pink-a-boo)"
                          : "rgba(243, 239, 224, 0.2)",
                        boxShadow: isCompleted
                          ? "0 0 8px var(--pastel-green)"
                          : isActive
                          ? "0 0 8px var(--pink-a-boo)"
                          : "none",
                      }}
                    />
                  </div>

                  {/* Node Label */}
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: isActive || isSelected ? 600 : 500,
                      color: isCompleted
                        ? "var(--vanilla-ice)"
                        : isActive
                        ? "var(--pink-a-boo)"
                        : "rgba(243, 239, 224, 0.6)",
                      lineHeight: "1.2",
                      marginBottom: "2px",
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "rgba(243, 239, 224, 0.4)",
                      lineHeight: "1.1",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }}
                  >
                    {step.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Agent Realtime Micro Telemetry Pill */}
          <div
            style={{
              marginTop: "16px",
              padding: "10px 16px",
              background: "rgba(243, 239, 224, 0.05)",
              border: "1px solid rgba(243, 239, 224, 0.1)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "rgba(243, 239, 224, 0.5)",
                  fontSize: "11px",
                }}
              >
                LIVE METRIC:
              </span>
              <span
                style={{
                  fontWeight: 500,
                  color: "var(--vanilla-ice)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "var(--pastel-green)",
                  }}
                />
                {currentStep.metric}
              </span>
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--pink-a-boo)",
              }}
            >
              {completedSteps.includes(currentStep.id)
                ? "RESOLVED ✓"
                : currentStepIndex === selectedInspectStep
                ? "PROCESSING..."
                : "QUEUED"}
            </div>
          </div>
        </div>

        {/* RESULTS SHOWCASE (When Orchestration Finishes or in Progress) */}
        {isDone ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "310px 1fr",
              gap: "24px",
              animation: "fadeIn 0.35s ease-out",
            }}
          >
            {/* 9:16 Vertical Video Preview Player */}
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: viewMode === "vertical" ? "9 / 16" : "16 / 9",
                maxHeight: "440px",
                background: "#000",
                borderRadius: "22px",
                overflow: "hidden",
                border: "1px solid rgba(243, 239, 224, 0.2)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                transition: "all 0.3s ease",
              }}
            >
              {/* Simulated Gameplay Canvas / Video */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    viewMode === "vertical"
                      ? "url('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80')"
                      : "url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "brightness(0.85) contrast(1.05)",
                }}
              />

              {/* Dynamic 9:16 Facecam Overlay box */}
              {viewMode === "vertical" && (
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    width: "80px",
                    height: "60px",
                    borderRadius: "10px",
                    border: "1px solid rgba(247, 207, 220, 0.5)",
                    backgroundImage:
                      "url('https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200&auto=format&fit=crop&q=80')",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.6)",
                    zIndex: 3,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      left: "4px",
                      fontSize: "8px",
                      background: "rgba(0,0,0,0.7)",
                      padding: "1px 4px",
                      borderRadius: "3px",
                      fontFamily: "var(--font-mono)",
                      color: "var(--pastel-green)",
                    }}
                  >
                    FACECAM
                  </div>
                </div>
              )}

              {/* Dynamic Viral Hook Top Banner */}
              <div
                style={{
                  position: "relative",
                  zIndex: 4,
                  padding: "14px",
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, transparent 100%)",
                }}
              >
                <div
                  style={{
                    background: "rgba(247, 207, 220, 0.2)",
                    backdropFilter: "blur(8px)",
                    border: "1px solid rgba(247, 207, 220, 0.4)",
                    color: "var(--vanilla-ice)",
                    padding: "6px 10px",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    textAlign: "center",
                    letterSpacing: "0.02em",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
                  }}
                >
                  ⚡ 3 BULLETS. 1 v 3. GAME POINT. 💀
                </div>
              </div>

              {/* Kinetic Captions & Audio Waveform at bottom */}
              <div
                style={{
                  position: "relative",
                  zIndex: 4,
                  padding: "16px 14px",
                  background:
                    "linear-gradient(0deg, rgba(0,0,0,0.92) 0%, transparent 100%)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                }}
              >
                {/* Animated Caption */}
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "var(--vanilla-ice)",
                    textAlign: "center",
                    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                    background: "rgba(59, 40, 34, 0.6)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                  }}
                >
                  "I'M <span style={{ color: "var(--pink-a-boo)" }}>THREE HP</span>... NO WAY!"
                </div>

                {/* Audio Waveform visualization */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "3px",
                    height: "16px",
                  }}
                >
                  {[4, 9, 14, 16, 11, 7, 13, 16, 12, 6, 10, 15, 8, 4].map(
                    (h, i) => (
                      <div
                        key={i}
                        style={{
                          width: "3px",
                          height: isPlayingClip ? `${h}px` : "4px",
                          background:
                            i % 2 === 0
                              ? "var(--pastel-green)"
                              : "var(--pink-a-boo)",
                          borderRadius: "9999px",
                          transition: "height 0.2s ease",
                        }}
                      />
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Right Information & Action Panel */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                background: "rgba(243, 239, 224, 0.03)",
                border: "1px solid rgba(243, 239, 224, 0.1)",
                borderRadius: "22px",
                padding: "24px",
              }}
            >
              {/* Header metrics */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(183, 216, 186, 0.15)",
                      border: "1px solid var(--pastel-green)",
                      color: "var(--pastel-green)",
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Sparkles size={14} /> S-TIER VIRALITY · 94/100
                  </div>

                  {/* View mode toggle */}
                  <div
                    style={{
                      display: "flex",
                      background: "rgba(243, 239, 224, 0.08)",
                      borderRadius: "9999px",
                      padding: "3px",
                    }}
                  >
                    <button
                      onClick={() => setViewMode("vertical")}
                      style={{
                        background:
                          viewMode === "vertical"
                            ? "var(--chocolate-fondant)"
                            : "transparent",
                        color: "var(--vanilla-ice)",
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      9:16 Short
                    </button>
                    <button
                      onClick={() => setViewMode("raw")}
                      style={{
                        background:
                          viewMode === "raw"
                            ? "var(--chocolate-fondant)"
                            : "transparent",
                        color: "var(--vanilla-ice)",
                        border: "none",
                        padding: "4px 10px",
                        borderRadius: "9999px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      16:9 Raw
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "var(--vanilla-ice)",
                    marginBottom: "8px",
                  }}
                >
                  Ascent A-Site 1v3 Clutch (3 HP)
                </div>

                <div
                  style={{
                    fontSize: "13px",
                    color: "rgba(243, 239, 224, 0.65)",
                    lineHeight: "1.5",
                    marginBottom: "20px",
                  }}
                >
                  Optimal viral cut identified: 22s duration, streamer vocal pitch peak at 480Hz, chat surge 8.4x baseline, 9:16 facecam anchor locked.
                </div>

                {/* Score breakdown chips */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "8px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      background: "rgba(243, 239, 224, 0.05)",
                      border: "1px solid rgba(243, 239, 224, 0.1)",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(243, 239, 224, 0.5)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      RETENTION
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--pastel-green)",
                      }}
                    >
                      96%
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(243, 239, 224, 0.05)",
                      border: "1px solid rgba(243, 239, 224, 0.1)",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(243, 239, 224, 0.5)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      AUDIO PEAK
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--pink-a-boo)",
                      }}
                    >
                      +14.8 dB
                    </div>
                  </div>

                  <div
                    style={{
                      background: "rgba(243, 239, 224, 0.05)",
                      border: "1px solid rgba(243, 239, 224, 0.1)",
                      borderRadius: "12px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(243, 239, 224, 0.5)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      DMCA
                    </div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 700,
                        color: "var(--vanilla-ice)",
                      }}
                    >
                      CLEARED
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => {
                    setExportedSuccess(true);
                    firePaletteConfetti();
                  }}
                  style={{
                    flex: 1,
                    background: "linear-gradient(135deg, var(--pastel-green) 0%, rgba(183, 216, 186, 0.7) 100%)",
                    color: "var(--chocolate-abyss)",
                    fontWeight: 700,
                    fontSize: "13px",
                    border: "none",
                    borderRadius: "14px",
                    padding: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(183, 216, 186, 0.3)",
                    transition: "all 0.2s",
                  }}
                >
                  <Download size={16} />
                  {exportedSuccess ? "EXPORT READY ✓" : "DOWNLOAD SHORT (.MP4)"}
                </button>

                <button
                  onClick={() => {
                    setExportedSuccess(true);
                    firePaletteConfetti();
                  }}
                  style={{
                    background: "rgba(247, 207, 220, 0.15)",
                    border: "1px solid var(--pink-a-boo)",
                    color: "var(--pink-a-boo)",
                    fontWeight: 600,
                    fontSize: "13px",
                    borderRadius: "14px",
                    padding: "14px 20px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    transition: "all 0.2s",
                  }}
                >
                  <Share2 size={16} /> Publish
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Live Orchestration Pulse Status Box (before completion) */
          <div
            style={{
              padding: "20px",
              background: "rgba(243, 239, 224, 0.03)",
              border: "1px solid rgba(243, 239, 224, 0.08)",
              borderRadius: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "2px dashed var(--pink-a-boo)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: "orbitDot 4s linear infinite",
                  color: "var(--pink-a-boo)",
                }}
              >
                <Sparkles size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "var(--vanilla-ice)",
                  }}
                >
                  Executing {ORCHESTRATION_STEPS[currentStepIndex]?.label} Agent...
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "rgba(243, 239, 224, 0.5)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  Traveling light-up dots traversing neural graph • {currentStepIndex + 1}/8 agents dispatched
                </div>
              </div>
            </div>

            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "12px",
                color: "var(--pastel-green)",
                background: "rgba(183, 216, 186, 0.1)",
                padding: "4px 10px",
                borderRadius: "9999px",
                border: "1px solid rgba(183, 216, 186, 0.2)",
              }}
            >
              ● ARCHITECTURE ACTIVE
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
