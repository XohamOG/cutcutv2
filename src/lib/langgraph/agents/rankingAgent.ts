import { CandidateClip, PipelineExecutionLog } from "../../types/pipeline";

export interface RankingInput {
  candidates: CandidateClip[];
}

export function runViralityRankingAgent(input: RankingInput): {
  rankedClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  // Sort candidates by virality score descending
  const sorted = [...input.candidates].sort((a, b) => b.viralityScore - a.viralityScore);

  // Update tiers
  const ranked = sorted.map((clip, idx) => {
    let tier: "S_TIER" | "A_TIER" | "B_TIER" = "B_TIER";
    if (clip.viralityScore >= 90) tier = "S_TIER";
    else if (clip.viralityScore >= 75) tier = "A_TIER";

    return {
      ...clip,
      viralityTier: tier,
      publishStatus: (idx === 0 ? "in_review" : "candidate") as "in_review" | "candidate",
    };
  });

  const topClip = ranked[0];

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_rank_${Date.now()}_1`,
      agentNode: "virality_ranking",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Evaluating ${ranked.length} candidates using multidimensional engagement matrix (Event Rarity + Excitement Peak + Chat Multiplier).`,
    },
    {
      id: `log_rank_${Date.now()}_2`,
      agentNode: "virality_ranking",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Top-ranked clip: "${topClip.clutchTag}" with Virality Score ${topClip.viralityScore}/100 [${topClip.viralityTier}] at ${topClip.formattedRange}.`,
      dataSnapshot: {
        topViralityScore: topClip.viralityScore,
        tier: topClip.viralityTier,
        breakdown: topClip.scoreBreakdown,
      },
    },
  ];

  return { rankedClips: ranked, logs };
}
