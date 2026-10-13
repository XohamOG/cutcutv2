import { NextResponse } from "next/server";
import { buildGamingHighlightGraph } from "@/lib/langgraph/graph";
import { MOCK_STREAMS, CREATOR_PROFILES } from "@/lib/mockData/presets";
import { StreamMetadata, CreatorProfile, CandidateClip } from "@/lib/types/pipeline";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, streamId, creatorId, approvedClipId, updatedHook } = body;

    const stream: StreamMetadata =
      MOCK_STREAMS.find((s) => s.id === streamId) || MOCK_STREAMS[0];
    const creator: CreatorProfile =
      CREATOR_PROFILES.find((c) => c.id === creatorId) || CREATOR_PROFILES[0];

    const graph = buildGamingHighlightGraph();

    if (action === "run_to_review") {
      // Execute graph up to human review checkpoint
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
      return NextResponse.json({ success: true, state: result });
    }

    if (action === "approve_and_publish") {
      // Streamer approved human review checkpoint
      const initialState = {
        stream,
        creator,
        chunks: [],
        events: [],
        signals: [],
        candidates: [],
        currentStage: "ingestion" as const,
        logs: [],
        requireHumanReview: false, // Bypass pause
        humanApproved: true,
        isCompleted: false,
      };

      const result = await graph.invoke(initialState);

      // If user customized the hook in the review UI, update it
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

      return NextResponse.json({ success: true, state: result });
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

    return NextResponse.json({ success: true, state: result });
  } catch (error: unknown) {
    console.error("Pipeline graph execution error:", error);
    const message = error instanceof Error ? error.message : "Internal Error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
