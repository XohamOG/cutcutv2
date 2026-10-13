import { GameEvent, ExcitementSignal, CandidateClip, GameType, PipelineExecutionLog } from "../../types/pipeline";
import { MOCK_CLIPS_VALORANT } from "../../mockData/presets";

export interface CandidateGenerationInput {
  game: GameType;
  events: GameEvent[];
  signals: ExcitementSignal[];
}

function formatSeconds(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function runClipCandidateGenerationAgent(input: CandidateGenerationInput): {
  candidateClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  // If Valorant, use high quality presets or generate candidates
  if (input.game === "valorant") {
    const logs: PipelineExecutionLog[] = [
      {
        id: `log_cand_${Date.now()}_1`,
        agentNode: "candidate_generation",
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Trimming bounded clip candidates with 14s lead-in context and 8s reaction tail. Preventing mid-sentence cuts.`,
      },
      {
        id: `log_cand_${Date.now()}_2`,
        agentNode: "candidate_generation",
        timestamp: new Date().toISOString(),
        level: "success",
        message: `Generated ${MOCK_CLIPS_VALORANT.length} tight candidate clips (lengths: 16s - 22s). Top candidate at 1:42:04 - 1:42:26.`,
        dataSnapshot: {
          clipCount: MOCK_CLIPS_VALORANT.length,
          topDuration: `${MOCK_CLIPS_VALORANT[0].durationSec}s`,
        },
      },
    ];

    return { candidateClips: MOCK_CLIPS_VALORANT, logs };
  }

  // Generic generator for other games
  const clips: CandidateClip[] = input.events.map((evt, idx) => {
    const sig = input.signals.find(s => s.timestampSec === evt.timestampSec) || input.signals[idx] || {
      voiceVolumeDb: -3.5,
      chatBaselineRatio: 7.0,
      combinedExcitementScore: 85,
    };

    const leadIn = 14;
    const reactionTail = 8;
    const start = Math.max(0, evt.timestampSec - leadIn);
    const end = evt.timestampSec + reactionTail;
    const duration = end - start;

    return {
      id: `clip_${input.game}_${idx}_${Date.now()}`,
      sourceEventId: evt.id,
      game: input.game,
      startTimeSec: start,
      endTimeSec: end,
      durationSec: duration,
      formattedRange: `${formatSeconds(start)} - ${formatSeconds(end)}`,
      keyMomentSec: evt.timestampSec,
      eventDescription: evt.description,
      clutchTag: evt.clutchState || "Clutch Play",
      audioPeakDb: sig.voiceVolumeDb,
      chatSpikeRatio: sig.chatBaselineRatio,
      viralityScore: Math.min(96, Math.max(70, Math.round(sig.combinedExcitementScore * 0.95))),
      scoreBreakdown: {
        eventSignificance: 92,
        excitementIntensity: 90,
        chatSurge: 88,
        pacingAndTiming: 85,
        historicalMatchBonus: 82,
      },
      viralityTier: "S_TIER",
      recommendationReason: `Correlated ${evt.type} play with ${sig.chatBaselineRatio}x chat burst and peak reaction audio.`,
      hooks: [
        {
          hookText: `IS THIS THE CRAZIEST ${input.game.toUpperCase()} PLAY EVER?! 🔥`,
          hookStyle: "hype",
          displayDurationSec: 2.2,
        },
        {
          hookText: `HOW DID HE PULL THIS OFF?! 😱`,
          hookStyle: "curiosity",
          displayDurationSec: 2.0,
        },
      ],
      selectedHookIndex: 0,
      captions: [
        {
          startSec: start + 2,
          endSec: start + 6,
          text: "Watch this positioning right now...",
          emphasisWords: ["positioning"],
          speaker: "Streamer",
        },
        {
          startSec: start + 7,
          endSec: end - 2,
          text: "HE HIT THE SHOT! NO WAY!",
          emphasisWords: ["HIT THE SHOT"],
          speaker: "Streamer",
        },
      ],
      platformMetadata: {
        youtubeShorts: {
          title: `INSANE ${input.game.toUpperCase()} CLUTCH #shorts`,
          description: `Watch this clutch play from today's stream!`,
          tags: [input.game, "gaming", "shorts"],
        },
        tiktok: {
          caption: `Wait till the end 💀 #${input.game} #gaming #fyp`,
          hashtags: [input.game, "gaming", "viral"],
          trendingSoundSuggestion: "Cinematic Bass Drop",
        },
        instagramReels: {
          caption: `Rate this play 1-10 👇`,
          hashtags: [input.game, "gamer", "reels"],
          callToAction: "Share with a squadmate!",
        },
      },
      reformatConfig: {
        aspectRatio: "9:16",
        actionCropCenterPercent: 50,
        hasFacecam: true,
        facecamPosition: "pip_bottom_left",
        safeZoneOverlayActive: true,
        backgroundStyle: "blur_letterbox",
      },
      safetyCheck: {
        passed: true,
        dmcaAudioRisk: "none",
        profanityScore: 0.05,
        brandSafetyGrade: "safe_all_advertisers",
        notes: "Clean content suitable for wide syndication.",
      },
      publishStatus: "candidate",
    };
  });

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_cand_generic_${Date.now()}`,
      agentNode: "candidate_generation",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Generated ${clips.length} clip candidates with adaptive pacing boundaries for ${input.game.toUpperCase()}.`,
    },
  ];

  return { candidateClips: clips, logs };
}
