"use client";

import React from "react";
import {
  Flame,
  Radio,
  Gamepad2,
  Columns,
  BarChart3,
  Sparkles,
  Bot,
  Zap,
} from "lucide-react";
import { CreatorProfile } from "@/lib/types/pipeline";
import { CREATOR_PROFILES } from "@/lib/mockData/presets";

interface NavbarProps {
  activeTab: "pipeline" | "player" | "live" | "multigame" | "analytics";
  setActiveTab: (tab: "pipeline" | "player" | "live" | "multigame" | "analytics") => void;
  selectedCreator: CreatorProfile;
  setSelectedCreator: (creator: CreatorProfile) => void;
  isRunning: boolean;
  onRunPipeline: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  selectedCreator,
  setSelectedCreator,
  isRunning,
  onRunPipeline,
}: NavbarProps) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "rgba(6, 8, 14, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "12px 24px",
      }}
    >
      <div
        style={{
          maxWidth: "1600px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        {/* Brand Logo & Tag */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #00f2fe 0%, #ec4899 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 20px rgba(0, 242, 254, 0.4)",
            }}
          >
            <Flame size={24} color="#06080e" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "1.25rem",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  background: "linear-gradient(90deg, #ffffff 40%, #00f2fe 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                CLUTCHCUT
              </span>
              <span
                style={{
                  fontSize: "0.65rem",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "rgba(0, 242, 254, 0.15)",
                  color: "#00f2fe",
                  border: "1px solid rgba(0, 242, 254, 0.3)",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                }}
              >
                PS-16 AI
              </span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px" }}>
              <Bot size={13} color="#00f2fe" />
              <span>10-Agent LangGraph Pipeline</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255, 255, 255, 0.04)",
            padding: "4px",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            gap: "4px",
          }}
        >
          <button
            onClick={() => setActiveTab("pipeline")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              background: activeTab === "pipeline" ? "rgba(0, 242, 254, 0.16)" : "transparent",
              color: activeTab === "pipeline" ? "#00f2fe" : "#94a3b8",
              border: activeTab === "pipeline" ? "1px solid rgba(0, 242, 254, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Sparkles size={15} />
            <span>Agent Pipeline</span>
          </button>

          <button
            onClick={() => setActiveTab("player")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              background: activeTab === "player" ? "rgba(236, 72, 153, 0.16)" : "transparent",
              color: activeTab === "player" ? "#ec4899" : "#94a3b8",
              border: activeTab === "player" ? "1px solid rgba(236, 72, 153, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Columns size={15} />
            <span>Before / After Player</span>
          </button>

          <button
            onClick={() => setActiveTab("live")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              background: activeTab === "live" ? "rgba(244, 63, 94, 0.16)" : "transparent",
              color: activeTab === "live" ? "#f43f5e" : "#94a3b8",
              border: activeTab === "live" ? "1px solid rgba(244, 63, 94, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Radio size={15} />
            <span>Live Clipper</span>
            <span className="pulse-dot" />
          </button>

          <button
            onClick={() => setActiveTab("multigame")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              background: activeTab === "multigame" ? "rgba(139, 92, 246, 0.16)" : "transparent",
              color: activeTab === "multigame" ? "#c084fc" : "#94a3b8",
              border: activeTab === "multigame" ? "1px solid rgba(139, 92, 246, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <Gamepad2 size={15} />
            <span>Multi-Game Signal</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "0.825rem",
              fontWeight: 600,
              background: activeTab === "analytics" ? "rgba(16, 185, 129, 0.16)" : "transparent",
              color: activeTab === "analytics" ? "#34d399" : "#94a3b8",
              border: activeTab === "analytics" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid transparent",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <BarChart3 size={15} />
            <span>Performance & Feedback</span>
          </button>
        </nav>

        {/* Right Actions: Creator Switcher + Run Button */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Creator Persona Selector */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "10px",
              padding: "4px 10px",
            }}
          >
            <img
              src={selectedCreator.avatarUrl}
              alt={selectedCreator.name}
              style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }}
            />
            <select
              value={selectedCreator.id}
              onChange={(e) => {
                const found = CREATOR_PROFILES.find((c) => c.id === e.target.value);
                if (found) setSelectedCreator(found);
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#f8fafc",
                fontSize: "0.8rem",
                fontWeight: 600,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {CREATOR_PROFILES.map((c) => (
                <option key={c.id} value={c.id} style={{ background: "#0a0e17", color: "#fff" }}>
                  {c.name} ({c.toneStyle.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>

          {/* Trigger Workflow Button */}
          <button
            onClick={onRunPipeline}
            disabled={isRunning}
            className="cyber-btn cyber-btn-primary"
            style={{ padding: "8px 16px" }}
          >
            <Zap size={16} />
            <span>{isRunning ? "Running Pipeline..." : "Run Multi-Agent VOD"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
