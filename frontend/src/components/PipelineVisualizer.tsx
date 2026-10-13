"use client";

import React from "react";
import {
  FileVideo,
  Crosshair,
  Volume2,
  Scissors,
  TrendingUp,
  Type,
  Smartphone,
  ShieldCheck,
  UserCheck,
  Send,
  RotateCcw,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { AgentNodeName, PipelineExecutionLog } from "@/lib/types/pipeline";

interface PipelineVisualizerProps {
  currentStage: AgentNodeName;
  completedNodes: AgentNodeName[];
  isRunning: boolean;
  isPausedForReview: boolean;
  logs: PipelineExecutionLog[];
  selectedNode: AgentNodeName | null;
  onSelectNode: (node: AgentNodeName) => void;
  onApproveReview?: () => void;
}

interface NodeMeta {
  id: AgentNodeName;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
}

const NODES: NodeMeta[] = [
  {
    id: "ingestion",
    label: "Ingestion Agent",
    sublabel: "Chunks & timeline sync",
    icon: <FileVideo size={16} />,
    color: "#00f2fe",
  },
  {
    id: "event_detection",
    label: "Game Event Agent",
    sublabel: "HUD & clutch detector",
    icon: <Crosshair size={16} />,
    color: "#3b82f6",
  },
  {
    id: "excitement_analysis",
    label: "Excitement Signal Agent",
    sublabel: "Pitch & chat spikes",
    icon: <Volume2 size={16} />,
    color: "#ec4899",
  },
  {
    id: "candidate_generation",
    label: "Candidate Gen Agent",
    sublabel: "Tight clip boundaries",
    icon: <Scissors size={16} />,
    color: "#f59e0b",
  },
  {
    id: "virality_ranking",
    label: "Virality Ranking Agent",
    sublabel: "Scores 0-100 & tiers",
    icon: <TrendingUp size={16} />,
    color: "#8b5cf6",
  },
  {
    id: "caption_hook_generation",
    label: "Caption & Hook Agent",
    sublabel: "Viral retention hooks",
    icon: <Type size={16} />,
    color: "#10b981",
  },
  {
    id: "vertical_reformatting",
    label: "Vertical Reformat Agent",
    sublabel: "16:9 to 9:16 + facecam",
    icon: <Smartphone size={16} />,
    color: "#06b6d4",
  },
  {
    id: "safety_check",
    label: "Safety & Rights Agent",
    sublabel: "DMCA & profanity filter",
    icon: <ShieldCheck size={16} />,
    color: "#84cc16",
  },
  {
    id: "human_review",
    label: "Human Review Checkpoint",
    sublabel: "Creator opt-in gate",
    icon: <UserCheck size={16} />,
    color: "#f43f5e",
  },
  {
    id: "publishing_scheduling",
    label: "Publish & Schedule Agent",
    sublabel: "Shorts / TikTok / Reels",
    icon: <Send size={16} />,
    color: "#a855f7",
  },
  {
    id: "performance_feedback",
    label: "Performance Feedback",
    sublabel: "Learns weight tuning",
    icon: <RotateCcw size={16} />,
    color: "#00f2fe",
  },
];

export default function PipelineVisualizer({
  currentStage,
  completedNodes,
  isRunning,
  isPausedForReview,
  logs,
  selectedNode,
  onSelectNode,
  onApproveReview,
}: PipelineVisualizerProps) {
  return (
    <section className="glass-panel" style={{ padding: "20px 24px", marginBottom: "24px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>LangGraph Orchestration Flow</h2>
            <span className="badge-neon badge-cyan">10 AGENT GRAPH</span>
            {isPausedForReview && (
              <span className="badge-neon badge-pink" style={{ animation: "pulseLive 2s infinite" }}>
                HUMAN REVIEW GATEWAY PAUSED
              </span>
            )}
          </div>
          <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "2px" }}>
            Autonomous StateGraph routing with conditional human-in-the-loop checkpoint and feedback loop.
          </p>
        </div>

        {/* Status quick action */}
        {isPausedForReview && onApproveReview && (
          <button
            onClick={onApproveReview}
            className="cyber-btn cyber-btn-hype"
            style={{ padding: "8px 16px" }}
          >
            <UserCheck size={16} />
            <span>Approve & Dispatch Top Clip</span>
          </button>
        )}
      </div>

      {/* Node Chain Rail */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          overflowX: "auto",
          paddingBottom: "10px",
          paddingTop: "6px",
        }}
      >
        {NODES.map((node, index) => {
          const isActive = currentStage === node.id && isRunning;
          const isCompleted = completedNodes.includes(node.id);
          const isSelected = selectedNode === node.id;
          const isReviewGate = node.id === "human_review";

          let borderStyle = "1px solid rgba(255, 255, 255, 0.08)";
          let bg = "rgba(255, 255, 255, 0.02)";

          if (isActive) {
            borderStyle = `1px solid ${node.color}`;
            bg = `rgba(0, 242, 254, 0.12)`;
          } else if (isCompleted) {
            borderStyle = `1px solid rgba(16, 185, 129, 0.4)`;
            bg = `rgba(16, 185, 129, 0.08)`;
          } else if (isSelected) {
            borderStyle = `1px solid rgba(255, 255, 255, 0.3)`;
            bg = `rgba(255, 255, 255, 0.06)`;
          }

          if (isReviewGate && isPausedForReview) {
            borderStyle = "2px solid #f43f5e";
            bg = "rgba(244, 63, 94, 0.15)";
          }

          return (
            <React.Fragment key={node.id}>
              <div
                onClick={() => onSelectNode(node.id)}
                style={{
                  minWidth: "160px",
                  padding: "10px 12px",
                  borderRadius: "12px",
                  border: borderStyle,
                  background: bg,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  position: "relative",
                  boxShadow: isActive ? `0 0 15px ${node.color}40` : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: "rgba(255, 255, 255, 0.06)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: node.color,
                    }}
                  >
                    {node.icon}
                  </div>

                  <div>
                    {isActive ? (
                      <Loader2 size={16} color={node.color} className="animate-spin" />
                    ) : isCompleted ? (
                      <CheckCircle2 size={16} color="#10b981" />
                    ) : (
                      <Clock size={14} color="#64748b" />
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#fff" }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#94a3b8" }}>{node.sublabel}</div>
                </div>
              </div>

              {index < NODES.length - 1 && (
                <ArrowRight size={14} color="rgba(255, 255, 255, 0.2)" style={{ flexShrink: 0 }} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Node Logs / Details Drawer */}
      {selectedNode && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px 16px",
            borderRadius: "10px",
            background: "rgba(0, 0, 0, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#00f2fe", textTransform: "uppercase" }}>
              Agent Node Logs: {selectedNode.replace(/_/g, " ")}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
              {logs.filter((l) => l.agentNode === selectedNode).length} events recorded
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "120px", overflowY: "auto" }}>
            {logs.filter((l) => l.agentNode === selectedNode).length === 0 ? (
              <div style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic" }}>
                Node awaiting execution. Click "Run Multi-Agent VOD" to trigger the LangGraph pipeline.
              </div>
            ) : (
              logs
                .filter((l) => l.agentNode === selectedNode)
                .map((log) => (
                  <div
                    key={log.id}
                    style={{
                      fontSize: "0.75rem",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      color:
                        log.level === "success"
                          ? "#34d399"
                          : log.level === "warn"
                          ? "#fbbf24"
                          : "#cbd5e1",
                    }}
                  >
                    <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span>{log.message}</span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </section>
  );
}
