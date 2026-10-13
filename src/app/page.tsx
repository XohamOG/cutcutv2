"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import PipelineVisualizer from "@/components/PipelineVisualizer";
import StreamIngestion from "@/components/StreamIngestion";
import ClipStudio from "@/components/ClipStudio";
import BeforeAfterPlayer from "@/components/BeforeAfterPlayer";
import LiveStreamMonitor from "@/components/LiveStreamMonitor";
import MultiGameAdapter from "@/components/MultiGameAdapter";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import CreatorStyleStudio from "@/components/CreatorStyleStudio";
import HighlightReelModal from "@/components/HighlightReelModal";
import {
  StreamMetadata,
  CreatorProfile,
  CandidateClip,
  AgentNodeName,
  PipelineExecutionLog,
  IngestionChunk,
} from "@/lib/types/pipeline";
import {
  MOCK_STREAMS,
  CREATOR_PROFILES,
  MOCK_CLIPS_VALORANT,
} from "@/lib/mockData/presets";
import { Film, Brain, Sparkles, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "pipeline" | "player" | "live" | "multigame" | "analytics"
  >("pipeline");
  const [selectedCreator, setSelectedCreator] = useState<CreatorProfile>(
    CREATOR_PROFILES[0]
  );
  const [selectedStream, setSelectedStream] = useState<StreamMetadata>(
    MOCK_STREAMS[0]
  );

  // Pipeline state
  const [isRunning, setIsRunning] = useState(false);
  const [currentStage, setCurrentStage] = useState<AgentNodeName>("ingestion");
  const [completedNodes, setCompletedNodes] = useState<AgentNodeName[]>([
    "ingestion",
    "event_detection",
    "excitement_analysis",
    "candidate_generation",
    "virality_ranking",
    "caption_hook_generation",
    "vertical_reformatting",
    "safety_check",
  ]);
  const [isPausedForReview, setIsPausedForReview] = useState(false);
  const [selectedNode, setSelectedNode] = useState<AgentNodeName | null>(
    "virality_ranking"
  );
  const [chunks, setChunks] = useState<IngestionChunk[]>([]);
  const [clips, setClips] = useState<CandidateClip[]>(MOCK_CLIPS_VALORANT);
  const [selectedClip, setSelectedClip] = useState<CandidateClip | null>(
    MOCK_CLIPS_VALORANT[0]
  );
  const [logs, setLogs] = useState<PipelineExecutionLog[]>([]);
  const [highlightReelOpen, setHighlightReelOpen] = useState(false);
  const [styleStudioOpen, setStyleStudioOpen] = useState(false);

  // Load initial chunks for current stream
  useEffect(() => {
    const total = Math.ceil(selectedStream.vodDurationSeconds / 600);
    const newChunks: IngestionChunk[] = [];
    for (let i = 0; i < total; i++) {
      newChunks.push({
        chunkIndex: i + 1,
        startTimeSec: i * 600,
        endTimeSec: Math.min((i + 1) * 600, selectedStream.vodDurationSeconds),
        durationSec: 600,
        status: "analyzed",
      });
    }
    setChunks(newChunks);
  }, [selectedStream]);

  // Run LangGraph pipeline end-to-end or up to human review
  const handleRunPipeline = async () => {
    setIsRunning(true);
    setCompletedNodes([]);
    setIsPausedForReview(false);

    // Sequential agent execution simulation for realistic UI progress
    const stages: AgentNodeName[] = [
      "ingestion",
      "event_detection",
      "excitement_analysis",
      "candidate_generation",
      "virality_ranking",
      "caption_hook_generation",
      "vertical_reformatting",
      "safety_check",
    ];

    for (let i = 0; i < stages.length; i++) {
      setCurrentStage(stages[i]);
      setSelectedNode(stages[i]);
      await new Promise((r) => setTimeout(r, 600));
      setCompletedNodes((prev) => [...prev, stages[i]]);
    }

    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_to_review",
          streamId: selectedStream.id,
          creatorId: selectedCreator.id,
        }),
      });
      const data = await res.json();
      if (data.success && data.state) {
        if (data.state.candidates && data.state.candidates.length > 0) {
          setClips(data.state.candidates);
          setSelectedClip(data.state.candidates[0]);
        }
        if (data.state.logs) {
          setLogs(data.state.logs);
        }
      }
    } catch (e) {
      console.warn("Using offline fallback graph state", e);
    }

    setIsRunning(false);
    setIsPausedForReview(true);
    setCurrentStage("human_review");
  };

  // Human review approval handler
  const handleApproveAndPublish = async (
    clipId: string,
    customHook?: string
  ) => {
    setIsPausedForReview(false);
    setCompletedNodes((prev) => [
      ...prev,
      "human_review",
      "publishing_scheduling",
      "performance_feedback",
    ]);
    setCurrentStage("performance_feedback");

    // Update clip status
    setClips((prev) =>
      prev.map((c) => {
        if (c.id === clipId) {
          const hooks = [...c.hooks];
          if (customHook) {
            hooks[0] = { ...hooks[0], hookText: customHook };
          }
          return {
            ...c,
            hooks,
            publishStatus: "published",
            publishedPlatforms: [
              {
                platform: "youtube",
                postId: `yt_${Date.now()}`,
                publishedAt: new Date().toISOString(),
                url: "https://youtube.com/shorts/mock",
              },
              {
                platform: "tiktok",
                postId: `tt_${Date.now()}`,
                publishedAt: new Date().toISOString(),
                url: "https://tiktok.com/@mock",
              },
            ],
          };
        }
        return c;
      })
    );

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.5 },
    });
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCreator={selectedCreator}
        setSelectedCreator={setSelectedCreator}
        isRunning={isRunning}
        onRunPipeline={handleRunPipeline}
      />

      <main style={{ maxWidth: "1600px", width: "100%", margin: "0 auto", padding: "24px" }}>
        {/* LangGraph Pipeline Visualizer Header */}
        <PipelineVisualizer
          currentStage={currentStage}
          completedNodes={completedNodes}
          isRunning={isRunning}
          isPausedForReview={isPausedForReview}
          logs={logs}
          selectedNode={selectedNode}
          onSelectNode={(node) => setSelectedNode(node)}
          onApproveReview={() =>
            selectedClip && handleApproveAndPublish(selectedClip.id)
          }
        />

        {/* Tab 1: Main Pipeline Studio */}
        {activeTab === "pipeline" && (
          <div>
            {/* Quick Action Ribbon for Advanced Features */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "20px",
                flexWrap: "wrap",
                gap: "10px",
                background: "rgba(255, 255, 255, 0.02)",
                padding: "12px 18px",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Sparkles size={16} color="#00f2fe" />
                <span style={{ fontSize: "0.825rem", color: "#cbd5e1" }}>
                  Autonomous Gaming Highlight Clipping & Publishing Agent (PS-16)
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button
                  onClick={() => setStyleStudioOpen(!styleStudioOpen)}
                  className="cyber-btn cyber-btn-secondary"
                  style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                >
                  <Brain size={14} />
                  <span>Creator Style Memory</span>
                </button>

                <button
                  onClick={() => setHighlightReelOpen(true)}
                  className="cyber-btn cyber-btn-hype"
                  style={{ padding: "6px 14px", fontSize: "0.78rem" }}
                >
                  <Film size={14} />
                  <span>Auto Highlight Reel (Feature 7)</span>
                </button>
              </div>
            </div>

            {/* Creator Style Memory Drawer */}
            {styleStudioOpen && (
              <CreatorStyleStudio
                creator={selectedCreator}
                onUpdateCreator={(up) => setSelectedCreator(up)}
              />
            )}

            {/* Stream Ingestion Component (Agent 1) */}
            <StreamIngestion
              selectedStream={selectedStream}
              onSelectStream={(s) => setSelectedStream(s)}
              chunks={chunks}
              isRunning={isRunning}
              onStartPipeline={handleRunPipeline}
            />

            {/* Candidate Clips Studio (Agents 2-8 + Human Review Gate) */}
            <ClipStudio
              clips={clips}
              selectedClip={selectedClip}
              onSelectClip={(c) => setSelectedClip(c)}
              creator={selectedCreator}
              onApproveAndPublish={handleApproveAndPublish}
              onViewBeforeAfter={(c) => {
                setSelectedClip(c);
                setActiveTab("player");
              }}
            />
          </div>
        )}

        {/* Tab 2: Interactive Before/After Player */}
        {activeTab === "player" && <BeforeAfterPlayer clip={selectedClip} />}

        {/* Tab 3: Live Clip-While-Streaming Mode */}
        {activeTab === "live" && <LiveStreamMonitor />}

        {/* Tab 4: Multi-Game Signal Adaptation Showcase */}
        {activeTab === "multigame" && <MultiGameAdapter />}

        {/* Tab 5: Cross-Platform Performance Dashboard & Feedback Loop */}
        {activeTab === "analytics" && (
          <PerformanceDashboard clip={selectedClip} />
        )}
      </main>

      {/* Feature 7: Auto-Generated Highlight Reel Modal */}
      <HighlightReelModal
        isOpen={highlightReelOpen}
        onClose={() => setHighlightReelOpen(false)}
        clips={clips}
      />
    </div>
  );
}
