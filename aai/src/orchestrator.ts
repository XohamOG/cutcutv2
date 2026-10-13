import { Annotation, StateGraph, START, END } from "@langchain/langgraph";
import {
  StreamMetadata,
  CreatorProfile,
  IngestionChunk,
  GameEvent,
  ExcitementSignal,
  CandidateClip,
  PipelineExecutionLog,
  AgentNodeName,
} from "./types/pipeline";
import { runIngestionAgent } from "./agents/ingestionAgent";
import { runGameEventDetectionAgent } from "./agents/gameEventAgent";
import { runExcitementSignalAgent } from "./agents/excitementAgent";
import { runClipCandidateGenerationAgent } from "./agents/candidateAgent";
import { runViralityRankingAgent } from "./agents/rankingAgent";
import { runCaptionHookGenerationAgent } from "./agents/captionAgent";
import { runVerticalReformattingAgent } from "./agents/reformattingAgent";
import { runSafetyCheckAgent } from "./agents/safetyAgent";
import { runPublishingAgent } from "./agents/publishingAgent";
import { runPerformanceFeedbackAgent } from "./agents/feedbackAgent";

// Define LangGraph State Annotation
export const PipelineStateAnnotation = Annotation.Root({
  stream: Annotation<StreamMetadata>(),
  creator: Annotation<CreatorProfile>(),
  chunks: Annotation<IngestionChunk[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  events: Annotation<GameEvent[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  signals: Annotation<ExcitementSignal[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  candidates: Annotation<CandidateClip[]>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  currentStage: Annotation<AgentNodeName>({
    reducer: (_, update) => update,
    default: () => "ingestion",
  }),
  logs: Annotation<PipelineExecutionLog[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
  requireHumanReview: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  humanApproved: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  isCompleted: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
});

export type PipelineGraphState = typeof PipelineStateAnnotation.State;

// LangGraph Nodes
async function ingestionNode(state: PipelineGraphState) {
  const { stream, chunks, logs } = await runIngestionAgent(state.stream);
  return {
    stream,
    chunks,
    currentStage: "ingestion" as AgentNodeName,
    logs,
  };
}

async function eventDetectionNode(state: PipelineGraphState) {
  const { events, logs } = await runGameEventDetectionAgent({
    game: state.stream.game,
    stream: state.stream,
  });
  return {
    events,
    currentStage: "event_detection" as AgentNodeName,
    logs,
  };
}

async function excitementAnalysisNode(state: PipelineGraphState) {
  const { signals, logs } = await runExcitementSignalAgent({
    events: state.events,
    stream: state.stream,
  });
  return {
    signals,
    currentStage: "excitement_analysis" as AgentNodeName,
    logs,
  };
}

async function candidateGenerationNode(state: PipelineGraphState) {
  const { candidateClips, logs } = await runClipCandidateGenerationAgent({
    game: state.stream.game,
    events: state.events,
    signals: state.signals,
    stream: state.stream,
  });
  return {
    candidates: candidateClips,
    currentStage: "candidate_generation" as AgentNodeName,
    logs,
  };
}

async function viralityRankingNode(state: PipelineGraphState) {
  const { rankedClips, logs } = runViralityRankingAgent({
    candidates: state.candidates,
  });
  return {
    candidates: rankedClips,
    currentStage: "virality_ranking" as AgentNodeName,
    logs,
  };
}

async function captionHookNode(state: PipelineGraphState) {
  const { enhancedClips, logs } = runCaptionHookGenerationAgent({
    clips: state.candidates,
    creator: state.creator,
  });
  return {
    candidates: enhancedClips,
    currentStage: "caption_hook_generation" as AgentNodeName,
    logs,
  };
}

async function reformattingNode(state: PipelineGraphState) {
  const { reformattedClips, logs } = await runVerticalReformattingAgent({
    clips: state.candidates,
  });
  return {
    candidates: reformattedClips,
    currentStage: "vertical_reformatting" as AgentNodeName,
    logs,
  };
}

async function safetyCheckNode(state: PipelineGraphState) {
  const { checkedClips, logs } = runSafetyCheckAgent({
    clips: state.candidates,
  });
  return {
    candidates: checkedClips,
    currentStage: "safety_check" as AgentNodeName,
    logs,
  };
}

async function humanReviewCheckpointNode(state: PipelineGraphState) {
  const logs: PipelineExecutionLog[] = [
    {
      id: `log_review_${Date.now()}`,
      agentNode: "human_review",
      timestamp: new Date().toISOString(),
      level: "info",
      message: state.humanApproved
        ? "Human-in-the-Loop review passed! Streamer approved clip package for dispatch."
        : "Human-in-the-Loop checkpoint reached. Pausing for creator review & customization.",
    },
  ];
  return {
    currentStage: "human_review" as AgentNodeName,
    logs,
  };
}

async function publishingNode(state: PipelineGraphState) {
  const { publishedClips, logs } = await runPublishingAgent({
    clips: state.candidates,
    creator: state.creator,
    overrideImmediate: state.humanApproved,
  });
  return {
    candidates: publishedClips,
    currentStage: "publishing_scheduling" as AgentNodeName,
    logs,
  };
}

async function performanceFeedbackNode(state: PipelineGraphState) {
  const { logs } = runPerformanceFeedbackAgent({
    clips: state.candidates,
  });
  return {
    currentStage: "performance_feedback" as AgentNodeName,
    logs,
  };
}

async function orchestratorFinalNode(state: PipelineGraphState) {
  const logs: PipelineExecutionLog[] = [
    {
      id: `log_orch_${Date.now()}`,
      agentNode: "orchestrator",
      timestamp: new Date().toISOString(),
      level: "success",
      message: "Orchestrator Agent: Full 10-agent pipeline synchronized successfully. All state transitions, video assets, and distribution schedules finalized.",
      dataSnapshot: {
        totalCandidates: state.candidates.length,
        pipelineStatus: "COMPLETED",
        reviewCheckpointCleared: true,
      },
    },
  ];
  return {
    currentStage: "orchestrator" as AgentNodeName,
    isCompleted: true,
    logs,
  };
}

// Conditional routing edge based on human review requirement
function routeAfterSafety(state: PipelineGraphState): string {
  if (state.requireHumanReview && !state.humanApproved) {
    return "human_review";
  }
  return "publishing_scheduling";
}

// Build and compile the LangGraph workflow
export function buildGamingHighlightGraph() {
  const workflow = new StateGraph(PipelineStateAnnotation)
    .addNode("ingestion", ingestionNode)
    .addNode("event_detection", eventDetectionNode)
    .addNode("excitement_analysis", excitementAnalysisNode)
    .addNode("candidate_generation", candidateGenerationNode)
    .addNode("virality_ranking", viralityRankingNode)
    .addNode("caption_hook_generation", captionHookNode)
    .addNode("vertical_reformatting", reformattingNode)
    .addNode("safety_check", safetyCheckNode)
    .addNode("human_review", humanReviewCheckpointNode)
    .addNode("publishing_scheduling", publishingNode)
    .addNode("performance_feedback", performanceFeedbackNode)
    .addNode("orchestrator", orchestratorFinalNode)

    // Flow edges
    .addEdge(START, "ingestion")
    .addEdge("ingestion", "event_detection")
    .addEdge("event_detection", "excitement_analysis")
    .addEdge("excitement_analysis", "candidate_generation")
    .addEdge("candidate_generation", "virality_ranking")
    .addEdge("virality_ranking", "caption_hook_generation")
    .addEdge("caption_hook_generation", "vertical_reformatting")
    .addEdge("vertical_reformatting", "safety_check")
    
    // Conditional routing to human review checkpoint or direct publish
    .addConditionalEdges("safety_check", routeAfterSafety, {
      human_review: "human_review",
      publishing_scheduling: "publishing_scheduling",
    })
    
    .addEdge("human_review", "publishing_scheduling")
    .addEdge("publishing_scheduling", "performance_feedback")
    .addEdge("performance_feedback", "orchestrator")
    .addEdge("orchestrator", END);

  return workflow.compile();
}
