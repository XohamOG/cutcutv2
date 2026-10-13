export type GameType = "valorant" | "cs2" | "rocket_league" | "apex_legends";

export interface StreamMetadata {
  id: string;
  title: string;
  streamerName: string;
  game: GameType;
  platform: "twitch" | "youtube" | "kick" | "local_upload";
  vodDurationSeconds: number;
  vodUrl: string;
  isLive: boolean;
  resolution: string;
  fps: number;
  thumbnailUrl: string;
  recordedAt: string;
  filePath?: string;
  audioPath?: string;
}

export interface IngestionChunk {
  chunkIndex: number;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  status: "pending" | "processing" | "analyzed";
}

export type GameEventType =
  | "clutch_win"
  | "triple_kill"
  | "ace"
  | "aerial_goal"
  | "overtake"
  | "squad_wipe"
  | "fail_moment"
  | "defuse_clutch"
  | "sniper_flick";

export interface GameEvent {
  id: string;
  type: GameEventType;
  timestampSec: number;
  formattedTime: string;
  description: string;
  clutchState?: string; // e.g. "1v3", "1v4", "Overtime 0s"
  roundResult?: "win" | "loss" | "overtime";
  confidenceScore: number; // 0 - 1
  hudTelemetry: {
    healthBefore: number;
    healthAfter: number;
    eliminationsInWindow: number;
    killFeedSpike: boolean;
    spikeTimerSec?: number;
  };
}

export interface ExcitementSignal {
  timestampSec: number;
  voicePitchHz: number;
  voiceVolumeDb: number;
  voiceExcitementScore: number; // 0 - 1
  chatMessageRate: number; // msgs per second
  chatBaselineRatio: number; // e.g. 8.2x baseline
  emoteBurst: {
    primaryEmote: string;
    count: number;
  };
  casterCrowdSpikeScore: number; // 0 - 1
  combinedExcitementScore: number; // 0 - 100
}

export interface CandidateClip {
  id: string;
  sourceEventId: string;
  game: GameType;
  startTimeSec: number;
  endTimeSec: number;
  durationSec: number;
  formattedRange: string;
  keyMomentSec: number;
  eventDescription: string;
  clutchTag: string;
  audioPeakDb: number;
  chatSpikeRatio: number;
  videoFilePath?: string;
  verticalVideoFilePath?: string;
  publicVideoUrl?: string;
  lengthProfile?: "15s_punchy" | "30s_standard" | "60s_extended";
  
  // Scoring
  viralityScore: number; // 0 - 100
  scoreBreakdown: {
    eventSignificance: number; // 0 - 100
    excitementIntensity: number; // 0 - 100
    chatSurge: number; // 0 - 100
    pacingAndTiming: number; // 0 - 100
    historicalMatchBonus: number; // 0 - 100
  };
  viralityTier: "S_TIER" | "A_TIER" | "B_TIER";
  recommendationReason: string;

  // Creative Content
  hooks: {
    hookText: string;
    hookStyle: "dramatic" | "hype" | "curiosity" | "comedic";
    displayDurationSec: number;
  }[];
  selectedHookIndex: number;
  captions: {
    startSec: number;
    endSec: number;
    text: string;
    emphasisWords: string[];
    speaker: string;
  }[];
  platformMetadata: {
    youtubeShorts: {
      title: string;
      description: string;
      tags: string[];
    };
    tiktok: {
      caption: string;
      hashtags: string[];
      trendingSoundSuggestion: string;
    };
    instagramReels: {
      caption: string;
      hashtags: string[];
      callToAction: string;
    };
  };

  // Vertical Reformatting Config
  reformatConfig: {
    aspectRatio: "9:16";
    actionCropCenterPercent: number; // 0 - 100 on X axis
    hasFacecam: boolean;
    facecamPosition: "top_circle" | "pip_bottom_left" | "pip_top_right" | "split_top";
    facecamCropCoordinates?: { x: number; y: number; w: number; h: number };
    safeZoneOverlayActive: boolean;
    backgroundStyle: "blur_letterbox" | "cinematic_black" | "gradient_glow";
  };

  // Safety & Copyright
  safetyCheck: {
    passed: boolean;
    dmcaAudioRisk: "none" | "low" | "medium" | "high";
    flaggedMusicTitle?: string;
    profanityScore: number; // 0 - 1
    brandSafetyGrade: "safe_all_advertisers" | "mild_language" | "restricted";
    notes: string;
  };

  // Publishing State
  publishStatus: "candidate" | "in_review" | "approved" | "rejected" | "published" | "scheduled";
  scheduledTime?: string;
  publishedPlatforms?: {
    platform: "youtube" | "tiktok" | "instagram";
    postId: string;
    publishedAt: string;
    url: string;
  }[];

  // Feedback Metrics (for simulation & past learning)
  actualPerformance?: {
    totalViews: number;
    likeToViewRatio: number; // %
    completionRate: number; // %
    averageWatchPercentage: number; // %
    retentionCurve: { second: number; retentionPct: number }[];
    predictedVsActualVariance: number;
  };
}

export interface CreatorProfile {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string;
  toneStyle: "hype_energetic" | "comedic_chaotic" | "tactical_esports" | "chill_wholesome";
  preferredCaptionFont: "Impact" | "Montserrat ExtraBold" | "Futura";
  favoriteKeywords: string[];
  autoPublishThreshold: number; // e.g. 90+ auto publish
  requireHumanReview: boolean;
  defaultScheduleDelayMinutes: number;
}

export type AgentNodeName =
  | "ingestion"
  | "event_detection"
  | "excitement_analysis"
  | "candidate_generation"
  | "virality_ranking"
  | "caption_hook_generation"
  | "vertical_reformatting"
  | "safety_check"
  | "human_review"
  | "publishing_scheduling"
  | "performance_feedback"
  | "orchestrator";

export interface PipelineExecutionLog {
  id: string;
  agentNode: AgentNodeName;
  timestamp: string;
  level: "info" | "success" | "warn" | "error";
  message: string;
  dataSnapshot?: Record<string, unknown>;
}

export interface PipelineState {
  currentStage: AgentNodeName;
  stageProgress: number; // 0 - 100
  isRunning: boolean;
  isPausedForReview: boolean;
  selectedVOD: StreamMetadata | null;
  chunks: IngestionChunk[];
  detectedEvents: GameEvent[];
  excitementSignals: ExcitementSignal[];
  candidateClips: CandidateClip[];
  selectedClipId: string | null;
  activeCreator: CreatorProfile;
  logs: PipelineExecutionLog[];
  completedNodes: AgentNodeName[];
}
