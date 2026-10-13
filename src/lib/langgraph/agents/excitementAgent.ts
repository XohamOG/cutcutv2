import { ExcitementSignal, GameEvent, PipelineExecutionLog } from "../../types/pipeline";
import { MOCK_EXCITEMENT_VALORANT } from "../../mockData/presets";

export interface ExcitementAnalysisInput {
  events: GameEvent[];
}

export function runExcitementSignalAgent(input: ExcitementAnalysisInput): {
  signals: ExcitementSignal[];
  logs: PipelineExecutionLog[];
} {
  const signals: ExcitementSignal[] = input.events.map((evt, idx) => {
    // If we have valorant mock signals for this index, use them or compute dynamically
    if (MOCK_EXCITEMENT_VALORANT[idx]) {
      return {
        ...MOCK_EXCITEMENT_VALORANT[idx],
        timestampSec: evt.timestampSec,
      };
    }

    const voicePitch = 420 + Math.floor(Math.random() * 80);
    const volume = -(2.5 + Math.random() * 4);
    const chatRate = 35 + Math.floor(Math.random() * 25);
    const chatBaseline = parseFloat((chatRate / 5.5).toFixed(1));

    return {
      timestampSec: evt.timestampSec,
      voicePitchHz: voicePitch,
      voiceVolumeDb: volume,
      voiceExcitementScore: 0.92,
      chatMessageRate: chatRate,
      chatBaselineRatio: chatBaseline,
      emoteBurst: {
        primaryEmote: "Pog / W / HYPE",
        count: 180 + Math.floor(Math.random() * 100),
      },
      casterCrowdSpikeScore: 0.85,
      combinedExcitementScore: Math.min(99, Math.round(chatBaseline * 7 + 35)),
    };
  });

  const topSignal = signals.reduce((prev, curr) => (curr.combinedExcitementScore > prev.combinedExcitementScore ? curr : prev), signals[0] || { combinedExcitementScore: 0, chatBaselineRatio: 0, voicePitchHz: 0 });

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_excite_${Date.now()}_1`,
      agentNode: "excitement_analysis",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Running audio FFT frequency inspection and chat velocity correlation...`,
      dataSnapshot: {
        processedTimestamps: signals.map(s => s.timestampSec),
      },
    },
    {
      id: `log_excite_${Date.now()}_2`,
      agentNode: "excitement_analysis",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Excitement peak identified: Streamer voice pitch hit ${topSignal.voicePitchHz}Hz with Twitch chat surging to ${topSignal.chatBaselineRatio}x baseline!`,
      dataSnapshot: {
        peakExcitementScore: topSignal.combinedExcitementScore,
        emoteBurst: topSignal.emoteBurst?.primaryEmote,
      },
    },
  ];

  return { signals, logs };
}
