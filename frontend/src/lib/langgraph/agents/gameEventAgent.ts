import { GameEvent, GameType, PipelineExecutionLog } from "../../types/pipeline";
import { MOCK_VALORANT_EVENTS } from "../../mockData/presets";

export interface EventDetectionInput {
  game: GameType;
  streamId: string;
}

export function runGameEventDetectionAgent(input: EventDetectionInput): {
  events: GameEvent[];
  logs: PipelineExecutionLog[];
} {
  let detected: GameEvent[] = [];

  if (input.game === "valorant") {
    detected = MOCK_VALORANT_EVENTS;
  } else if (input.game === "rocket_league") {
    detected = [
      {
        id: "rl_evt_1",
        type: "aerial_goal",
        timestampSec: 5410, // 1:30:10
        formattedTime: "1:30:10",
        description: "Zero-second overtime ceiling pinch buzzer beater shot (128 km/h)",
        clutchState: "0s Overtime",
        roundResult: "overtime",
        confidenceScore: 0.97,
        hudTelemetry: {
          healthBefore: 100,
          healthAfter: 100,
          eliminationsInWindow: 1,
          killFeedSpike: true,
        },
      },
      {
        id: "rl_evt_2",
        type: "overtake",
        timestampSec: 2120,
        formattedTime: "0:35:20",
        description: "Double flip-reset solo save off the goal line",
        clutchState: "1 Goal Lead",
        roundResult: "win",
        confidenceScore: 0.92,
        hudTelemetry: {
          healthBefore: 100,
          healthAfter: 100,
          eliminationsInWindow: 0,
          killFeedSpike: false,
        },
      },
    ];
  } else if (input.game === "cs2") {
    detected = [
      {
        id: "cs_evt_1",
        type: "clutch_win",
        timestampSec: 4380, // 1:13:00
        formattedTime: "1:13:00",
        description: "1v4 Eco Deagle headshot clutch with 0.4s defuse remaining on Mirage B site",
        clutchState: "1v4 Eco Defuse",
        roundResult: "win",
        confidenceScore: 0.99,
        hudTelemetry: {
          healthBefore: 100,
          healthAfter: 14,
          eliminationsInWindow: 4,
          killFeedSpike: true,
          spikeTimerSec: 0.4,
        },
      },
    ];
  } else {
    // Default / Apex
    detected = [
      {
        id: "apex_evt_1",
        type: "squad_wipe",
        timestampSec: 3620,
        formattedTime: "1:00:20",
        description: "Final ring 1v3 solo champion squad wipe with Wingman",
        clutchState: "1v3 Final Ring",
        roundResult: "win",
        confidenceScore: 0.95,
        hudTelemetry: {
          healthBefore: 100,
          healthAfter: 22,
          eliminationsInWindow: 3,
          killFeedSpike: true,
        },
      },
    ];
  }

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_event_${Date.now()}_1`,
      agentNode: "event_detection",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Analyzing visual frames & HUD telemetry for ${input.game.toUpperCase()}...`,
      dataSnapshot: {
        game: input.game,
        telemetryFeed: "HUD / OCR / KillFeed sync active",
      },
    },
    {
      id: `log_event_${Date.now()}_2`,
      agentNode: "event_detection",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Detected ${detected.length} critical game events (clutches, multi-eliminations, game-winning plays).`,
      dataSnapshot: {
        primaryEvent: detected[0]?.description,
        timestamp: detected[0]?.formattedTime,
      },
    },
  ];

  return { events: detected, logs };
}
