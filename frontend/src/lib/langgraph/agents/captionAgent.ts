import { CandidateClip, CreatorProfile, PipelineExecutionLog } from "../../types/pipeline";

export interface CaptionInput {
  clips: CandidateClip[];
  creator: CreatorProfile;
}

export function runCaptionHookGenerationAgent(input: CaptionInput): {
  enhancedClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  const enhancedClips = input.clips.map(clip => {
    // Generate hooks based on creator style
    const style = input.creator.toneStyle;
    const hooks = [...clip.hooks];

    if (style === "hype_energetic") {
      hooks[0] = {
        hookText: clip.hooks[0]?.hookText.toUpperCase() || "3 BULLETS. 1v3. GAME POINT. 💀",
        hookStyle: "hype",
        displayDurationSec: 2.5,
      };
    } else if (style === "tactical_esports") {
      hooks[0] = {
        hookText: `PRO ANALYSIS: HOW 1v3 CLUTCHES ARE WON 🧠`,
        hookStyle: "dramatic",
        displayDurationSec: 2.2,
      };
    } else if (style === "comedic_chaotic") {
      hooks[0] = {
        hookText: `MY HEART WAS AT 180 BPM HERE 💀😭`,
        hookStyle: "comedic",
        displayDurationSec: 2.0,
      };
    }

    return {
      ...clip,
      hooks,
      selectedHookIndex: 0,
    };
  });

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_cap_${Date.now()}_1`,
      agentNode: "caption_hook_generation",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Synthesizing viral hooks and speech-synced captions adapted to Creator Style Memory: "${input.creator.toneStyle}".`,
      dataSnapshot: {
        creator: input.creator.name,
        font: input.creator.preferredCaptionFont,
      },
    },
    {
      id: `log_cap_${Date.now()}_2`,
      agentNode: "caption_hook_generation",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Crafted retention hook: "${enhancedClips[0]?.hooks[0]?.hookText}" + tailored metadata for Shorts, TikTok, and Reels.`,
    },
  ];

  return { enhancedClips, logs };
}
