import { StreamMetadata, IngestionChunk, PipelineExecutionLog } from "../../types/pipeline";

export interface IngestionInput {
  stream: StreamMetadata;
}

export interface IngestionOutput {
  chunks: IngestionChunk[];
  logs: PipelineExecutionLog[];
}

export function runIngestionAgent(stream: StreamMetadata): IngestionOutput {
  const chunkSizeSec = 600; // 10-minute windows
  const totalChunks = Math.ceil(stream.vodDurationSeconds / chunkSizeSec);
  const chunks: IngestionChunk[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSizeSec;
    const end = Math.min((i + 1) * chunkSizeSec, stream.vodDurationSeconds);
    chunks.push({
      chunkIndex: i + 1,
      startTimeSec: start,
      endTimeSec: end,
      durationSec: end - start,
      status: "analyzed",
    });
  }

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_ingest_${Date.now()}_1`,
      agentNode: "ingestion",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Ingesting VOD "${stream.title}" (${stream.platform.toUpperCase()}) - Duration: ${Math.floor(stream.vodDurationSeconds / 3600)}h ${Math.floor((stream.vodDurationSeconds % 3600) / 60)}m.`,
      dataSnapshot: {
        resolution: stream.resolution,
        fps: stream.fps,
        streamer: stream.streamerName,
      },
    },
    {
      id: `log_ingest_${Date.now()}_2`,
      agentNode: "ingestion",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Segmented footage into ${totalChunks} processable chunks (10-minute analysis windows) with synchronized game timeline.`,
      dataSnapshot: {
        totalChunks,
        chunkDuration: "600s",
      },
    },
  ];

  return { chunks, logs };
}
