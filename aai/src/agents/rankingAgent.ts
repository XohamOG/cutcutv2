import { CandidateClip, PipelineExecutionLog } from "../types/pipeline";

export interface RankingInput {
  candidates: CandidateClip[];
}

/**
 * 5. Virality & Engagement Ranking Agent
 * Scores each clip candidate by predicted short-form engagement potential.
 * Evaluates event rarity, acoustic volume surge, chat multiplier, and pacing.
 */
export function runViralityRankingAgent(input: RankingInput): {
  rankedClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  // Compute real weighted score for each candidate
  const scored = input.candidates.map((clip) => {
    const bd = clip.scoreBreakdown;
    const computedScore = Math.min(
      99,
      Math.max(
        50,
        Math.round(
          bd.eventSignificance * 0.35 +
            bd.excitementIntensity * 0.35 +
            bd.chatSurge * 0.15 +
            bd.pacingAndTiming * 0.10 +
            bd.historicalMatchBonus * 0.05
        )
      )
    );

    let tier: "S_TIER" | "A_TIER" | "B_TIER" = "B_TIER";
    if (computedScore >= 90) tier = "S_TIER";
    else if (computedScore >= 75) tier = "A_TIER";

    return {
      ...clip,
      viralityScore: computedScore,
      viralityTier: tier,
    };
  });

  // Sort candidates by virality score descending
  const ranked = scored.sort((a, b) => b.viralityScore - a.viralityScore);
  const topClip = ranked[0] || input.candidates[0];

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_rank_${Date.now()}_1`,
      agentNode: "virality_ranking",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Evaluating ${ranked.length} candidates using multidimensional engagement matrix (Event Rarity 35% + Excitement Peak 35% + Chat Multiplier 15% + Pacing 10% + History 5%).`,
    },
    {
      id: `log_rank_${Date.now()}_2`,
      agentNode: "virality_ranking",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Top-ranked candidate: "${topClip.clutchTag}" with Virality Score ${topClip.viralityScore}/100 [${topClip.viralityTier}] at ${topClip.formattedRange}.`,
      dataSnapshot: {
        topViralityScore: topClip.viralityScore,
        tier: topClip.viralityTier,
        breakdown: topClip.scoreBreakdown,
      },
    },
  ];

  return { rankedClips: ranked, logs };
}
