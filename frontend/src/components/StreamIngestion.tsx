"use client";

import React, { useState } from "react";
import {
  FileVideo,
  Play,
  Layers,
  Sparkles,
  Link,
  Flame,
  Clock,
  Tv,
} from "lucide-react";
import { StreamMetadata, GameType, IngestionChunk } from "@/lib/types/pipeline";
import { MOCK_STREAMS } from "@/lib/mockData/presets";

interface StreamIngestionProps {
  selectedStream: StreamMetadata;
  onSelectStream: (stream: StreamMetadata) => void;
  chunks: IngestionChunk[];
  isRunning: boolean;
  onStartPipeline: () => void;
}

export default function StreamIngestion({
  selectedStream,
  onSelectStream,
  chunks,
  isRunning,
  onStartPipeline,
}: StreamIngestionProps) {
  const [customUrl, setCustomUrl] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;
    const customStream: StreamMetadata = {
      id: `custom_${Date.now()}`,
      title: `Custom Live Stream Ingestion (${customUrl.slice(0, 32)}...)`,
      streamerName: "Streamer_Alpha",
      game: "valorant" as GameType,
      platform: "twitch",
      vodDurationSeconds: 7200,
      vodUrl: customUrl,
      isLive: true,
      resolution: "1920x1080",
      fps: 60,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop&q=80",
      recordedAt: new Date().toISOString(),
    };
    onSelectStream(customStream);
  };

  const hours = Math.floor(selectedStream.vodDurationSeconds / 3600);
  const minutes = Math.floor((selectedStream.vodDurationSeconds % 3600) / 60);

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
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "rgba(0, 242, 254, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#00f2fe",
            }}
          >
            <FileVideo size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 700 }}>Agent 1: Stream & VOD Ingestion</h2>
            <p style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
              Pull raw gameplay footage, synchronize game-event feeds, and segment into 10-minute windows.
            </p>
          </div>
        </div>

        <button
          onClick={onStartPipeline}
          disabled={isRunning}
          className="cyber-btn cyber-btn-primary"
        >
          <Play size={16} />
          <span>{isRunning ? "Ingesting & Analyzing..." : "Run Analysis Pipeline"}</span>
        </button>
      </div>

      {/* Preset Stream Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {MOCK_STREAMS.map((s) => {
          const isSelected = selectedStream.id === s.id;
          return (
            <div
              key={s.id}
              onClick={() => onSelectStream(s)}
              style={{
                borderRadius: "14px",
                border: isSelected
                  ? "2px solid #00f2fe"
                  : "1px solid rgba(255, 255, 255, 0.08)",
                background: isSelected
                  ? "rgba(0, 242, 254, 0.08)"
                  : "rgba(255, 255, 255, 0.02)",
                padding: "16px",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 0 20px rgba(0, 242, 254, 0.2)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ position: "relative", borderRadius: "10px", overflow: "hidden", height: "130px" }}>
                <img
                  src={s.thumbnailUrl}
                  alt={s.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    display: "flex",
                    gap: "6px",
                  }}
                >
                  <span className="badge-neon badge-purple" style={{ textTransform: "uppercase" }}>
                    {s.game.replace("_", " ")}
                  </span>
                  <span className="badge-neon badge-cyan">{s.platform}</span>
                </div>
                <div
                  style={{
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: "rgba(0,0,0,0.8)",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                  }}
                >
                  {Math.floor(s.vodDurationSeconds / 3600)}h {Math.floor((s.vodDurationSeconds % 3600) / 60)}m
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
                  {s.title}
                </div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "#94a3b8",
                    marginTop: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>Streamer: <strong style={{ color: "#fff" }}>{s.streamerName}</strong></span>
                  <span>•</span>
                  <span>{s.resolution} @ {s.fps}fps</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Stream Ingest Input */}
      <form
        onSubmit={handleCustomSubmit}
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          background: "rgba(0, 0, 0, 0.25)",
          padding: "8px",
          borderRadius: "12px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", paddingLeft: "12px", color: "#64748b" }}>
          <Link size={18} />
        </div>
        <input
          type="text"
          placeholder="Paste Twitch / YouTube VOD or Live Stream URL (e.g. https://twitch.tv/videos/204918201)..."
          value={customUrl}
          onChange={(e) => setCustomUrl(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            color: "#fff",
            fontSize: "0.85rem",
            outline: "none",
          }}
        />
        <button type="submit" className="cyber-btn cyber-btn-secondary" style={{ padding: "8px 16px" }}>
          Ingest Feed
        </button>
      </form>

      {/* Chunking Visualizer */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.02)",
          borderRadius: "12px",
          padding: "16px",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Layers size={16} color="#00f2fe" />
            <span style={{ fontSize: "0.825rem", fontWeight: 700 }}>
              Ingestion Chunk Timeline ({chunks.length} x 10-Minute Windows)
            </span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>
            Total Duration: {hours}h {minutes}m ({selectedStream.vodDurationSeconds}s)
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.min(chunks.length || 18, 18)}, 1fr)`,
            gap: "4px",
            height: "28px",
          }}
        >
          {(chunks.length > 0 ? chunks : Array.from({ length: 18 })).map((_, i) => (
            <div
              key={i}
              title={`Chunk ${i + 1} (${i * 10}m - ${(i + 1) * 10}m)`}
              style={{
                borderRadius: "4px",
                background:
                  i === 10
                    ? "linear-gradient(180deg, #ec4899 0%, #8b5cf6 100%)" // The highlight chunk!
                    : "rgba(0, 242, 254, 0.2)",
                border:
                  i === 10
                    ? "1px solid #ec4899"
                    : "1px solid rgba(0, 242, 254, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.65rem",
                color: i === 10 ? "#fff" : "#94a3b8",
                fontWeight: 700,
              }}
            >
              {i === 10 ? "🔥" : i + 1}
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.7rem",
            color: "#64748b",
          }}
        >
          <span>00:00:00</span>
          <span style={{ color: "#ec4899", fontWeight: 700 }}>
            ⚡ Chunk 11 (1:40:00 - 1:50:00) contains High-Virality Clutch Play
          </span>
          <span>
            {hours}:{minutes < 10 ? `0${minutes}` : minutes}:00
          </span>
        </div>
      </div>
    </section>
  );
}
