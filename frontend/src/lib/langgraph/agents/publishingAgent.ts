import { CandidateClip, CreatorProfile, PipelineExecutionLog } from "../../types/pipeline";

export interface PublishingInput {
  clips: CandidateClip[];
  creator: CreatorProfile;
  overrideImmediate?: boolean;
}

export function runPublishingAgent(input: PublishingInput): {
  publishedClips: CandidateClip[];
  logs: PipelineExecutionLog[];
} {
  const publishedClips = input.clips.map((clip, idx) => {
    // If top clip or above threshold, publish immediately to Shorts + TikTok
    if (idx === 0 || clip.viralityScore >= input.creator.autoPublishThreshold || input.overrideImmediate) {
      return {
        ...clip,
        publishStatus: "published" as const,
        publishedPlatforms: [
          {
            platform: "youtube" as const,
            postId: `yt_${clip.id}_${Date.now()}`,
            publishedAt: new Date().toISOString(),
            url: "https://youtube.com/shorts/watch?v=mock_clutch",
          },
          {
            platform: "tiktok" as const,
            postId: `tt_${clip.id}_${Date.now()}`,
            publishedAt: new Date().toISOString(),
            url: "https://tiktok.com/@kael_val/video/mock_clutch",
          },
        ],
      };
    } else {
      // Queue for peak hours (7:00 PM)
      const scheduledDate = new Date();
      scheduledDate.setHours(19, 0, 0, 0);
      if (scheduledDate.getTime() < Date.now()) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      return {
        ...clip,
        publishStatus: "scheduled" as const,
        scheduledTime: scheduledDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
    }
  });

  const top = publishedClips[0];
  const second = publishedClips[1];

  const logs: PipelineExecutionLog[] = [
    {
      id: `log_pub_${Date.now()}_1`,
      agentNode: "publishing_scheduling",
      timestamp: new Date().toISOString(),
      level: "info",
      message: `Executing algorithmic distribution strategy for Creator "${input.creator.name}"...`,
    },
    {
      id: `log_pub_${Date.now()}_2`,
      agentNode: "publishing_scheduling",
      timestamp: new Date().toISOString(),
      level: "success",
      message: `Top Clip (${top.viralityScore}/100) published immediately to YouTube Shorts & TikTok! ${second ? `Second clip (${second.viralityScore}/100) queued for peak slot at 7:00 PM local on Instagram Reels.` : ""}`,
      dataSnapshot: {
        immediatePlatforms: ["YouTube Shorts", "TikTok"],
        scheduledPlatform: "Instagram Reels (7:00 PM)",
      },
    },
  ];

  return { publishedClips, logs };
}
