/** What search engines and link previews say about viralbits. Only claims that are true today. */
export const SITE_URL = "https://viralbits.xyz";

export const SEO = {
  title: "viralbits: turn your stream into Shorts, free in your browser",
  shortTitle: "viralbits",
  description:
    "Free stream clipper. Drop in your Twitch or YouTube stream recording and get vertical clips with captions for Shorts, Reels and TikTok. No sign-up, no watermark, and the video never leaves your computer.",
  keywords: [
    "stream clipper",
    "free clip maker",
    "stream to shorts",
    "twitch clips to tiktok",
    "youtube live to shorts",
    "auto clip stream highlights",
    "vertical clips with captions",
    "gaming clips",
    "OpusClip alternative",
    "free OpusClip alternative",
    "no watermark clip maker",
  ],
};

export const FAQ = [
  {
    q: "Is viralbits really free?",
    a: "Yes. It runs on your own computer, so it costs nothing to run, and there's no watermark or sign-up. An AI key from Groq, Gemini, OpenAI or Claude is optional and can make picks and captions better.",
  },
  {
    q: "Does my video get uploaded?",
    a: "No. The video stays on your computer. Listening, picking moments and cutting clips all happen inside your browser tab.",
  },
  {
    q: "How does it pick the best moments?",
    a: "It listens for moments where your voice jumps above your own normal, then checks for laughter, shouting, hype phrases like \"no way\" or \"clip that\", chat spikes if you add your chat, and on-screen action. Every clip shows why it was picked.",
  },
  {
    q: "Which streams does it work with?",
    a: "Any stream recording file: an OBS recording, or your own Twitch or YouTube stream downloaded from your dashboard. It works for any game, including GTA, Valorant, CS2 and BGMI.",
  },
  {
    q: "Does it work for Hindi and Hinglish streams?",
    a: "It picks up Hindi and Hinglish reactions in chat. For speech and captions in Hindi or other Indian languages, add a free Groq key in settings.",
  },
  {
    q: "What do I need to run it?",
    a: "Chrome or Edge on a computer. Long streams take a while, so there's a gentle mode that rests between steps instead of running your laptop flat out.",
  },
];

export const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      name: "viralbits",
      url: SITE_URL,
      description: SEO.description,
      applicationCategory: "MultimediaApplication",
      operatingSystem: "Web browser (Chrome, Edge)",
      browserRequirements: "Requires a desktop browser with WebCodecs support, such as Chrome or Edge.",
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
      featureList: [
        "Finds highlights in long stream recordings",
        "Cuts vertical 9:16 clips",
        "Word-by-word captions",
        "Explains why each clip was picked",
        "Runs entirely in the browser, nothing uploaded",
      ],
    },
    {
      "@type": "WebSite",
      name: "viralbits",
      url: SITE_URL,
    },
  ],
};
