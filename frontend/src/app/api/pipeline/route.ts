import { NextResponse } from "next/server";
import { buildGamingHighlightGraph } from "@/lib/langgraph/graph";
import { MOCK_STREAMS, CREATOR_PROFILES } from "@/lib/mockData/presets";
import { StreamMetadata, CreatorProfile, CandidateClip } from "@/lib/types/pipeline";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, streamId, creatorId, approvedClipId, updatedHook } = body;

    // Try delegating to dedicated Node.js backend if running
    try {
      const backendRes = await fetch(`${BACKEND_URL}/api/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(2000), // Quick check
      });
      if (backendRes.ok) {
        const backendData = await backendRes.json();
        return NextResponse.json({ ...backendData, source: "node_backend" });
      }
    } catch {
      // Backend server not listening yet, fall back to embedded LangGraph graph
    }

    // Direct LangGraph execution
    const stream: StreamMetadata =
      MOCK_STREAMS.find((s) => s.id === streamId) || MOCK_STREAMS[0];
    const creator: CreatorProfile =
      CREATOR_PROFILES.find((c) => c.id === creatorId) || CREATOR_PROFILES[0];

    const graph = buildGamingHighlightGraph();

    if (action === "run_to_review") {
      const initialState = {
        stream,
        creator,
        chunks: [],
        events: [],
        signals: [],
        candidates: [],
        currentStage: "ingestion" as const,
        logs: [],
        requireHumanReview: true,
        humanApproved: false,
        isCompleted: false,
      };

      const result = await graph.invoke(initialState);
      return NextResponse.json({ success: true, state: result, source: "embedded_aai" });
    }

    if (action === "approve_and_publish") {
      const initialState = {
        stream,
        creator,
        chunks: [],
        events: [],
        signals: [],
        candidates: [],
        currentStage: "ingestion" as const,
        logs: [],
        requireHumanReview: false,
        humanApproved: true,
        isCompleted: false,
      };

      const result = await graph.invoke(initialState);

      if (updatedHook && result.candidates && result.candidates.length > 0) {
        result.candidates = result.candidates.map((c: CandidateClip) => {
          if (c.id === approvedClipId || !approvedClipId) {
            const hooks = [...c.hooks];
            hooks[0] = { ...hooks[0], hookText: updatedHook };
            return { ...c, hooks };
          }
          return c;
        });
      }

      return NextResponse.json({ success: true, state: result, source: "embedded_aai" });
    }

    // Default: run full end-to-end
    const result = await graph.invoke({
      stream,
      creator,
      chunks: [],
      events: [],
      signals: [],
      candidates: [],
      currentStage: "ingestion" as const,
      logs: [],
      requireHumanReview: false,
      humanApproved: true,
      isCompleted: true,
    });

    return NextResponse.json({ success: true, state: result, source: "embedded_aai" });
  } catch (error: unknown) {
    console.error("Pipeline graph execution error:", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
