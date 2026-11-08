const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "studio.youtube.com"]);

/** Pulls the video id out of a YouTube link, or null if it isn't one. */
export function parseYouTubeId(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  let id: string | null | undefined;
  if (url.hostname === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (YOUTUBE_HOSTS.has(url.hostname)) {
    const [, first, second] = url.pathname.split("/");
    id = first === "watch" ? url.searchParams.get("v") : ["live", "shorts", "embed", "video"].includes(first) ? second : null;
  }
  return id && VIDEO_ID.test(id) ? id : null;
}

/** The creator's own dashboard page for a video, which has YouTube's official download. */
export function studioUrl(id: string): string {
  return `https://studio.youtube.com/video/${id}/edit`;
}
