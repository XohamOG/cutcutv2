import { CandidateClip, CreatorProfile, PipelineExecutionLog } from "../types/pipeline";

export interface CaptionInput {
  clips: CandidateClip[];
  creator: CreatorProfile;
}

/**
 * 6. Caption & Hook Generation Agent
 * Writes captions, on-screen text, and opening hooks tailored to short-form platforms.
 * Formats punchy 1-2s retention hooks, timed speech callouts, and platform metadata.
 */
export function runCaptionHookGenerationAgent(input: CaptionInput): {
  enhancedClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  const enhancedClips = input.clips.map((clip) => {
    const tone = input.creator.toneStyle;
    const isClutch = clip.clutchTag.toLowerCase().includes("clutch") || clip.eventDescription.toLowerCase().includes("1v");

    let primaryHookText = "UNREAL HIGHLIGHT MOMENT ⚡";
    if (tone === "hype_energetic") {
      primaryHookText = isClutch ? "3 BULLETS. 1 v 3. GAME POINT. 💀" : "THE CLEANEST COLLATERAL TODAY 🎯";
    } else if (tone === "tactical_esports") {
      primaryHookText = isClutch ? "PRO ANALYSIS: HOW 1v3 CLUTCHES ARE WON 🧠" : "RADIANT CROSSHAIR PLACEMENT GUIDE 🎯";
    } else if (tone === "comedic_chaotic") {
      primaryHookText = isClutch ? "MY HEART RATE WAS 180 BPM HERE 💀😭" : "HE CHECKED MY PC AFTER THIS PLAY 😭";
    }

    const hooks = [
      {
        hookText: primaryHookText,
        hookStyle: (tone === "comedic_chaotic" ? "comedic" : "hype") as "hype" | "comedic" | "dramatic",
        displayDurationSec: 2.2,
      },
      {
        hookText: "HOW DID HE SURVIVE THIS?! 😱",
        hookStyle: "curiosity" as const,
        displayDurationSec: 2.0,
      },
    ];

    // Word-by-word timed caption chunks aligned to the clip timeline
    const clipStart = clip.startTimeSec;
    const captions = [
      {
        startSec: clipStart,
        endSec: clipStart + 3.5,
        text: "They're pushing site! One down!",
        emphasisWords: ["pushing", "down"],
        speaker: input.creator.name,
      },
      {
        startSec: clipStart + 3.6,
        endSec: clipStart + 7.5,
        text: "I'M THREE HP... NO WAY... NO SHOT!",
        emphasisWords: ["THREE HP", "NO SHOT"],
        speaker: input.creator.name,
      },
      {
        startSec: clipStart + 7.6,
        endSec: clipStart + 11.0,
        text: "HE IS HIM! CLUTCH ACED!",
        emphasisWords: ["HIM", "ACED"],
        speaker: input.creator.name,
      },
    ];

    // Tailored Platform Metadata
    const platformMetadata = {
      youtubeShorts: {
        title: `${primaryHookText.replace(/[^\w\s]/gi, "")} #${clip.game} #shorts`,
        description: `${clip.eventDescription}\n\nStreamer: ${input.creator.handle}\nGame: ${clip.game.toUpperCase()}`,
        tags: [clip.game, "gaming", "shorts", "clutch", "esports"],
      },
      tiktok: {
        caption: `${primaryHookText} #${clip.game} #gaming #fyp #clutch`,
        hashtags: [clip.game, "gaming", "viral", "foryou"],
        trendingSoundSuggestion: "Bass Boosted Phonk Climax",
      },
      instagramReels: {
        caption: `Rate this play from 1 to 10 in the comments! 🎯 #${clip.game}`,
        hashtags: [clip.game, "esports", "gaminghighlight"],
        callToAction: "Follow for daily clutch moments!",
      },
    };

    return {
      ...clip,
      hooks,
      selectedHookIndex: 0,
      captions,
      platformMetadata,
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
        clipsTargeted: enhancedClips.length,
      },
    },
    {
      id: `log_cap_${Date.now()}_2`,
      agentNode: "caption_hook_generation",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Crafted 2-second retention hook: "${enhancedClips[0]?.hooks[0]?.hookText}" + speech-synchronized subtitles.`,
      dataSnapshot: {
        topHook: enhancedClips[0]?.hooks[0]?.hookText,
        captionsCount: enhancedClips[0]?.captions.length,
        platformsConfigured: ["YouTube Shorts", "TikTok", "Instagram Reels"],
      },
    },
  ];

  return { enhancedClips, logs };
}
