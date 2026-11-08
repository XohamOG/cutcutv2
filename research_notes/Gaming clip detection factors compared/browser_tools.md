# How browser-based stream and video clipping products detect moments to clip (state as of 8 November 2026)

Evidence labels used on every finding:
- **[DOC]** the vendor's help centre, pricing page or official announcement describing behaviour. It is first-party and unaudited.
- **[MKT]** vendor marketing or blog claim.
- **[README]** an open-source project's own README. Source code was NOT read, only READMEs, so these describe stated behaviour.
- **[3P]** independent third party.
- **[COMP]** third party that sells a competing product, so weak evidence.

Method limits: pages were read through a fetch tool that returns model-generated summaries, so wording marked as a quote is as relayed by that tool. Items described as "via search summary" come from search-result text, where the page itself was not opened. eklipse.gg returned HTTP 403 to direct fetches, so all Eklipse first-party material is via search summary. Reddit was not reached: the one targeted search returned no Reddit threads. Trustpilot figures were read on 8 Nov 2026.

## 1. What input signals does each product use, and what is disclosed about "virality scores"?

### Takeaway
Gaming-specific products and Twitch's own Auto Clips describe multi-signal detection (game state or on-screen events, audio, chat in Twitch's case), while general tools mostly describe transcript or multimodal analysis in vague terms. No commercial vendor found publishes a virality-score formula, weights or validation data; at most they name the dimensions. The open-source projects are the only place where the pipeline is stated concretely.

### Cited Findings

**Gaming-specific commercial products**

- **Eklipse: engine.** [MKT/DOC via search summary] "Gameplay Intelligence" became the Premium highlight engine from 1 June 2026, per [Eklipse blog](https://blog.eklipse.gg/streaming-tips/gameplay-intelligence.html).
- **Eklipse: signals.** [DOC via search summary] Candidates are scored on four signals: game-state events, audio composition, on-screen action density, and continuity. A router picks genre logic (FPS, battle royale, MOBA, tactical shooter, strategy/non-action) from game metadata at VOD import, with no user selection — [Eklipse help](https://eklipse.gg/help/how-gameplay-intelligence-picks-moments/). Chat is not among the four signals as summarised.
- **Eklipse: clip length and fallback.** [DOC via search summary] Clip length is per moment rather than fixed windows (for example 5–8 s no-scope, 15–25 s multi-kill) — [Eklipse help](https://eklipse.gg/help/how-gameplay-intelligence-picks-moments/). Titles off the supported list fall back to general action detection with lower quality — [Eklipse blog](https://blog.eklipse.gg/streaming-tips/gameplay-intelligence.html).
- **Eklipse: coverage.** [MKT via search summary] 3,000+ games, and "no longer game-only" after a July 2026 engine update, adding IRL and Just Chatting — [Eklipse AI Highlights](https://eklipse.gg/features/ai-highlights/). A [3P] review says detection "falls apart" on titles without trained models — [Agent Finder](https://agent-finder.co/reviews/eklipse). Another attributes kill-feed computer vision to Eklipse, without testing it — [Two Average Gamers](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/).
- **StreamLadder ClipGPT.** [MKT] Analyses the full stream, looking for "engaging or funny interactions with chat", spooky or intense moments and chaotic reactions, and works "especially well" with action games, FPS, battle royales and active chat — [StreamLadder](https://www.streamladder.com/clipgpt/ai-clipping). Whether it reads the chat log or infers chat interaction from the streamer's speech is not documented. Users can flag moments by saying "clip that" — same page. Each highlight gets a Virality Score, and the calculation is not explained on the pages retrieved — same page and [import page](https://www.streamladder.com/clipgpt/import-from-twitch). The page states you cannot customise what the AI looks for.
- **Sizzle.** [MKT] "Advanced AI technology", with filters for kills, knockdowns, headshots and victories, and a "Universal AI" for unlisted games — [sizzle.gg](https://sizzle.gg). 43 natively supported games, per Sizzle's FAQ as quoted by a competitor — [COMP Eklipse](https://eklipse.gg/compare/eklipse-vs-sizzle). The method is not publicly documented beyond this.
- **Powder.** Described as using AI to identify game highlights — [Tech.eu](https://tech.eu/brief/powder-series-a/). A March 2025 release announced NPU-accelerated "Instant Highlights" for CS2 — [BusinessWire, Mar 2025](https://www.businesswire.com/news/home/20250306279293/en/Powder-Unleashes-First-Ever-AI-Powered-NPU-Accelerated-Video-Editing-for-Gamers). A later update could detect when a streamer yells — [TechCrunch via search summary](https://techcrunch.com/?p=2631595). For current status see Question 4.
- **Streamlabs AI Game Highlighter / Replay.** [DOC] Current list of about 17 titles (Apex, ARC Raiders, Black Ops 6, CS2, Dead by Daylight, Dota 2, Fortnite, LoL, Marvel Rivals, Overwatch, PUBG, R6 Siege, Rocket League, Valorant, War Thunder, Warzone, Battlefield) — [Streamlabs](https://streamlabs.com/ar-sa/content-hub/post/streamlabs-ai-game-highlighter). Streamlabs' FAQ reportedly says it uses "a vision-based machine learning model" (via search summary; I could not resolve the exact URL). The Replay beta page says it identifies kills, deaths and victories across 50+ games, without stating the method — [Streamlabs Replay](https://streamlabs.com/content-hub/post/streamlabs-AI-game-highlighter-replay). This is a desktop product, not browser-based.

**Platform-native**

- **Twitch Auto Clips.** [DOC] Finds moments "by taking into account chat activity, vocal inflection, and on-screen events". It was announced as moving to beta "in the coming months", with a waitlist — [Twitch blog, 30 May 2026](https://blog.twitch.tv/en/2026/05/30/everything-we-announced-at-twitchcon-rotterdam-2026/). This is the only product in this set whose owner names chat as an input in a primary announcement. Weights are not disclosed.
- **Twitch Clip That.** [3P] Saying "Twitch, Clip That" creates a clip that sits in Clips Manager until approved — [Gaming Careers, Jul 2026](https://gamingcareers.com/newsletters/twitch-clip-that-actually-works-now/).
- **YouTube AI highlights ("Live recap").** [DOC] "AI-powered highlights" identify strong livestream moments and create Shorts; the announcement does not state how moments are selected — [YouTube blog, 16 Sep 2025](https://blog.youtube/news-and-events/live-updates/). The detection method is not publicly documented.
- **YouTube Clips (manual).** [DOC] User-selected 5–60 s segments, with no AI mentioned — [YouTube Help](https://support.google.com/youtube/answer/10332730).

**General tools**

- **OpusClip ClipAnything.** [DOC] "Analyzes each frame through visual, audio, and sentiment cues" (objects, scenes, actions, sounds, emotions, text), then rates each scene for virality — [Opus help](https://help.opus.pro/docs/article/9947095-clip-anything).
- **OpusClip Virality Score.** [MKT via search summary] 0–99, based on hook, flow and trend fit; one Opus blog adds "value", and another gives the range as 0–100, so Opus's own materials are inconsistent — [Opus tool page](https://www.opus.pro/tools/ai-viral-clip-maker). Weights and method are undisclosed. A [COMP] author who reviewed the documentation says no published conversion from score to views exists and that the score is computed from the clip alone — [Autoposting, Aug 2026](https://autoposting.ai/blog/opus-clip-review).
- **OpusClip Live Clipping.** [DOC] Private beta; clips are ranked by score, and the page does not say whether chat is read or how the score works — [Opus help](https://help.opus.pro/opus-labs/live-clipping).
- **OpusClip accuracy figures.** [MKT via search summary] Opus blogs cite "0.93 mAP" and "90%+ accuracy" with no methodology given — [Opus blog](https://www.opus.pro/blog/ai-tools-for-precise-video-highlight-search-accuracy).
- **Vizard Model v2.** [MKT] Dated 13 July 2026; aims for roughly 13 high-confidence clips per hour with setup, insight and payoff. The score is broken into hook strength, clear takeaway and story flow. The post gives no detection method, benchmarks or evaluation — [Vizard blog](https://vizard.ai/blog/meet-vizard-model-v2-full-context-clips-that-the-algorithm-actually-rewards). "Multimodal AI" is marketing wording — [Vizard](https://vizard.ai/tools/ai-viral-clip-maker). A third-party review's list of speech energy, topic transitions and engagement signals is not confirmed by Vizard (via search summary).
- **Klap.** A virality score is included on all plans — [Klap pricing](https://klap.app/pricing). The only description found is a German review saying it rates segments against statistical patterns of successful content, with no formula — [ecom-tools](https://ecom-tools.de/klap-app-virale-clips-aus-long-form-videos/). The method is not publicly documented in what I could retrieve; docs.klap.app was not retrieved.
- **Reap.** "AI Virality Score" is listed as a feature, with no method — [Reap pricing](https://reap.video/pricing).
- **Method not found (no explanation retrieved).** Munch, Quso, SendShort, Submagic Magic Clips, Descript Create Clips. Wisecut's pricing page names Autocut Silence and Highlights without explaining selection — [Wisecut](https://www.wisecut.ai/pricing/). CapCut says it can "automatically detect highlights" without describing how — [CapCut, vendor](https://www.capcut.com/resource/top-8-most-advanced-long-video-to-short-editors).

**Open-source (README-stated)**

- **AI-Youtube-Shorts-Generator.** [README] Whisper transcript, then an LLM classifies the video type and scores candidates 0–100 against a rubric (hooks, emotional peaks, opinion bombs, revelations, conflict, quotable lines, story peaks, practical value). Overlaps above 50% are merged by higher score. Vision is used only for cropping. Videos without detectable speech can yield no segments. 5.8k stars, MIT — [GitHub](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator).
- **Clips Kitty (clips-studio).** [README] Normalised transcript, audio (loudness spikes, burst density, silence-to-explosion), visual (scene cuts, motion, face-area change) and a fused reaction signal. Twitch chat replay and YouTube's most-replayed heatmap add a small capped bonus. The LLM receives the transcript plus an event timeline, then finalists are compared in one rerank call. It states that a visual-only moment nobody comments on may be missed. 216 stars, AGPL-3.0 — [GitHub](https://github.com/ColinGPT9/clips-studio).
- **OpenShorts.** [DOC/MKT] Gemini ranks roughly 90 s transcript windows. If the transcript has under 8 words total or under 5 words per minute, Gemini watches the video instead. It uses viewer-made clips of the broadcast, including when and how often they were viewed, which can fill up to a third of picks. It does not read Twitch chat — [OpenShorts](https://www.openshorts.app/platforms/twitch).
- **Auto-Clipper (bendawg2010).** [README] Pixel CV (muzzle flash, damage vignette, HUD zones, kill-feed colours), audio peaks, YOLOv11n fine-tuned on an Arc Raiders dataset, Whisper voice triggers, optional xAI Grok Vision. No numeric thresholds in the README. 11 stars, MIT — [GitHub](https://github.com/bendawg2010/Auto-Clipper).
- **stream-clipper (nirvagold).** [README] RMS volume plus WebRTC VAD; chat keyword and spike detection from chat logs is a Pro feature; "Audio + Chat overlap = higher score", with configurable weights. 4 stars, MIT — [GitHub](https://github.com/nirvagold/stream-clipper).
- **FunClip (Alibaba/ModelScope).** Paraformer ASR, then an LLM picks timestamps from SRT subtitles, using a user-supplied key; it is a user-driven tool (via search summary) — [FunClip mirror](https://github.com/qian-xc/FunClip).

### Inferences
- The score dimensions that are published (Opus: hook, flow, value, trend; Vizard: hook, takeaway, story flow) describe qualities of a clip's narrative. That is consistent with LLM-rubric judging, and AI-Youtube-Shorts-Generator shows that pattern openly. This is inference; neither vendor has confirmed it.
- No retrieved source indicates that any virality score uses a clip's actual post-publication performance as an input.

### Gaps
- No vendor formula, weight set or calibration study for any virality score was found.
- A review claiming that Opus clips scoring 80+ earned about 2.3x the TikTok views of clips under 50 appeared in search summaries. I could not attribute it to a specific page, so it should not be relied on.
- Clippy and ClipsAI: searches returned nothing usable.
- Laugh-clipper and twitch-clip-miner: only topic-listing descriptions were seen.

## 2. Which are gaming-specific versus general, and how do general tools perform on gameplay without speech?

### Takeaway
Eklipse, StreamLadder, Sizzle, Streamlabs Highlighter and (formerly) Powder are gaming or streamer products; OpusClip, Vizard, Klap, Munch, Reap, Descript, Submagic, SendShort, Quso, Wisecut and CapCut are general. I found no neutral same-footage test on commentary-free gameplay, so performance evidence is anecdotal and mostly from interested parties.

### Cited Findings
- [COMP] The Snowball post (April 2026, by a founder selling a Twitch clip tool) says Opus ran on 2–4 h Valorant VODs "missed most of the clutches" and favoured speech. It publishes no clip counts, samples or logs, and its claim about podcast-weighted training is unsourced — [Snowball](https://snowball-for-streamers.com/en/blog/opus-clip-doesnt-work-for-gaming).
- [3P, weak] Creator Dustin Miller's estimate of usable-clip rate for OpusClip: about 80–85% on podcasts and about 60% on gaming. He is disclosed as an OpusClip brand partner, the figures are relayed second-hand, and the host article ran no test — [Two Average Gamers](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). The same article cites a "community consensus" of about 90% for Eklipse on CoD/Valorant/Apex with no source.
- [3P, contrary, via search summary] One 2026 review says Opus handles gameplay without a verbal hook but that framing on gameplay and screen-share footage is less reliable — [AI Tool Blaze](https://aitoolblaze.com/blog/opusclip-review-2026).
- [DOC] Opus says ClipAnything works on "videos with little to no dialogue" and gives sports examples — [Opus help](https://help.opus.pro/docs/article/9947095-clip-anything). This is a capability statement, not a test.
- [MKT] Vizard's Twitch page claims it finds "epic gaming kills and game-changing plays" — [Vizard](https://vizard.ai/tools/turn-twitch-stream-to-youtube-shorts). No evidence is offered.
- [COMP via search summary] AutoClip's blog says Opus "weights vocal tone over chat signal" and found fewer gaming moments — [AutoClip](https://autoclip.dev/blog/klap-vs-eklipse-vs-autoclip-gaming-comparison). An Eklipse comparison concedes its products were not tested on the same source footage — [Eklipse](https://eklipse.gg/compare/eklipse-vs-vizard/).
- [DOC] Eklipse itself expects lower clip yield per hour on narrative content with no clear beats, and lower quality on unsupported titles — [Eklipse help](https://eklipse.gg/help/how-gameplay-intelligence-picks-moments/).
- [README] Open-source transcript tools state the failure mode directly: no detectable speech can mean no segments — [AI-Youtube-Shorts-Generator](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator). Clips Kitty states visual-only moments may be missed — [Clips Kitty](https://github.com/ColinGPT9/clips-studio). OpenShorts adds a specific silent-stream branch — [OpenShorts](https://www.openshorts.app/platforms/twitch).

### Inferences
- The explicit silent-stream fallback in OpenShorts and the failure statements in READMEs suggest transcript-first selection fails predictably on silent play. Vendors of closed general tools do not publish equivalent limits, so their behaviour on silent gameplay remains unverified.
- Eklipse's own distinction between supported and unsupported titles implies that its best results depend on per-title or per-genre tuning.

### Gaps
- No neutral, same-footage, commentary-free benchmark exists in what I found. A zero-speech test reporting "The AI found nothing" surfaced in search, but the tool was not named, so it is unusable.
- Reddit evidence was not obtained.

## 3. Inputs: YouTube link, Twitch VOD link, file upload, maximum length, and live chat access

### Takeaway
Most tools accept YouTube links and uploads; Twitch VOD links are common among streamer tools and some general tools, sometimes behind a higher plan. Reading chat is rare: Twitch's own Auto Clips names chat, and two open-source projects use chat replay or logs. No general commercial tool was found documenting chat ingestion.

### Cited Findings
- **OpusClip.** Up to 10 hours (via search summary) — [Opus help](https://help.opus.pro/docs/article/video-length). Upload caps are 10 GB (Free, Starter) and 30 GB (Pro, Business) — [pricing](https://www.opus.pro/pricing). Twitch, Medal.tv and others are listed under Pro (via search summary) — [Opus plans](https://help.opus.pro/docs/article/plans-and-credits). Conflict: the live pricing page shows Free as local upload only with YouTube from Starter, while a help page summary says Free includes YouTube.
- **OpusClip Live Clipping.** Private beta; accepts YouTube, Twitch, Kick and TikTok live links plus HLS, DASH, RTMP, RTSP and SRT, in 15/30/60-minute chunks — [Opus help](https://help.opus.pro/opus-labs/live-clipping).
- **Eklipse.** Pages conflict (via search summary): Twitch and Kick up to 6 h and YouTube up to 12 h per [troubleshooting help](https://eklipse.gg/help/my-vod-is-public-but-the-ai-highlight-process-failed-or-seems-stuck-what-are-the-common-causes/); under 5 h per [older FAQ](https://eklipse.gg/faq/); 15 min–5 h and within the last 14 days per [Twitch how-to](https://eklipse.gg/help/clip-twitch-vod-after-stream/).
- **StreamLadder.** Public Twitch VOD URL or connected account, individual Twitch clips, Kick VOD links, YouTube streams by upload. Up to 10 hours on the ClipGPT plan, and longer streams are processed in segments — [import page](https://www.streamladder.com/clipgpt/import-from-twitch); [AI clipping](https://www.streamladder.com/clipgpt/ai-clipping). Chat is not mentioned on the import page.
- **Vizard.** Upload length 60 min Free and 600 min paid; upload size 1 GB Free and 30 GB paid — [pricing](https://vizard.ai/pricing). Claims Twitch VOD analysis — [Vizard](https://vizard.ai/tools/turn-twitch-stream-to-youtube-shorts).
- **Klap.** Source up to 3 hours — [pricing](https://klap.app/pricing). YouTube, Vimeo, Twitch and Google Drive per a review — [ecom-tools](https://ecom-tools.de/klap-app-virale-clips-aus-long-form-videos/).
- **Reap.** YouTube, Twitch, X and Vimeo imports or file upload; 5 GB Free and 10 GB paid; no maximum duration stated — [pricing](https://reap.video/pricing).
- **Sizzle.** Linked Twitch and YouTube accounts or file upload — [sizzle.gg](https://sizzle.gg).
- **SendShort.** Prompt plus YouTube link — [pricing](https://sendshort.ai/pricing/).
- **Submagic.** Plan pages cap max video length at 2/5/30 minutes; it is unclear whether Magic Clips shares that cap — [pricing](https://www.submagic.co/pricing).
- **CapCut.** Up to 3 h and 10 GB [vendor] — [CapCut](https://www.capcut.com/resource/top-8-most-advanced-long-video-to-short-editors).
- **Wisecut.** Up to 4–5 GB; export length up to 90 min — [pricing](https://www.wisecut.ai/pricing/).
- **Chat access.**
  - Twitch Auto Clips uses chat activity — [Twitch](https://blog.twitch.tv/en/2026/05/30/everything-we-announced-at-twitchcon-rotterdam-2026/).
  - Clips Kitty uses Twitch chat replay and notes "Kick discards chat after a stream ends" — [GitHub](https://github.com/ColinGPT9/clips-studio).
  - stream-clipper ingests Twitch or YouTube JSON logs as a Pro feature — [GitHub](https://github.com/nirvagold/stream-clipper).
  - OpenShorts explicitly does not read Twitch chat, but reads viewer-made clips — [OpenShorts](https://www.openshorts.app/platforms/twitch).
- **YouTube Clips.** Unavailable on live streams without DVR or beyond the DVR window — [YouTube Help](https://support.google.com/youtube/answer/10332730).

### Inferences
- Viewer-created clips (OpenShorts) and YouTube's most-replayed heatmap (Clips Kitty) act as audience signals that are available without a chat log.

### Gaps
- No documentation retrieved confirms or rules out chat ingestion by Eklipse, StreamLadder, Sizzle, OpusClip, Vizard or Klap. Absence from retrieved pages is not proof that they do not use chat.
- YouTube live chat use by any commercial product: nothing found.
- Maximum source lengths for Munch, Descript, Quso and SendShort were not found.

## 4. Pricing and limits as of 2026, and bring-your-own-key

### Takeaway
Credit-per-source-minute is the dominant model, while Klap charges per output clip. Bring-your-own-key exists only in the open-source and self-hosted projects found; commercial APIs (OpusClip, Klap, Reap, Vizard, Submagic) sell vendor processing rather than accepting your own model key.

### Cited Findings
- **OpusClip** — [pricing, read Nov 2026](https://www.opus.pro/pricing): Free $0 (animated-caption watermark, 3-day limit), Starter $15/mo, Pro $29/mo, Business custom. Virality score starts at Starter. Pro lists Video Editing API, Scheduler API and MCP connector.
  - Credits: 1 credit per minute imported, per a [COMP review of the docs](https://autoposting.ai/blog/opus-clip-review); about 1 credit per minute for Live Clipping, around 1,440/day continuous — [Opus help](https://help.opus.pro/opus-labs/live-clipping).
  - Older help page: Free 60, Starter 150, Pro 300 minutes per month, with API for Business only — [Opus plans](https://help.opus.pro/docs/article/plans-and-credits). This conflicts with the live pricing page on API.
  - Do not confuse with Agent Opus credits (1 credit per second for generation), which belong to a separate product — [Agent Opus FAQ](https://help.opus.pro/agent-opus/article/ao-faq-credits-faq).
- **Eklipse** (via search summary) — Premium $24.99/mo, Premium Pro $39.99/mo on the [official site](https://eklipse.gg/). Older listings differ: $19.99 on [Capterra](https://www.capterra.com/p/10015243/Eklipse/), $9.99 on [Agent Finder](https://agent-finder.co/reviews/eklipse). A listing gives the free tier as 720p, up to 15 clips per stream and 14 days of storage — [SoftwareSuggest](https://www.softwaresuggest.com/eklipse).
- **StreamLadder** — price page not retrievable. Competitor-reported: from about $8/mo and $27/mo for AI clipping, with AI detection absent from free — [WayinVideo](https://wayin.ai/blog/streamladder-alternative/); [Klypra](https://klypra.app/blog/best-ai-tool-to-clip-twitch-streams). Treat as unverified.
- **Vizard** — [pricing page](https://vizard.ai/pricing): Free 60 credits/month, 1 credit = 1 minute uploaded, Creator 7,200–74,400 credits/year, API rate limits on all tiers, no watermark on Creator. Paid prices rendered as "$0" placeholders. Third-party figures conflict at about $14.50–$49/mo — [BityClips](https://bityclips.com/blog/vizard-pricing-2026).
- **Klap** — [pricing, updated 4 Nov 2026](https://klap.app/pricing): Basic $29/mo or $14.50 annual for 100 clips; Pro $79 or $39.50 for 300; Pro+ $189 or $94.50 for 1,000. Source length does not consume allowance. Free covers one video, preview only. API $0.44 per input, $0.32 per short, $0.48 per export.
- **Reap** — [pricing](https://reap.video/pricing): Free 1 h/month (watermark, 720p); Creator $9.99/mo annual or $24 monthly (10 h); Studio $29 or $50 (20 h); API, CLI and MCP on paid plans.
- **Submagic** — [pricing](https://www.submagic.co/pricing): $19/$39/$69 monthly ($12/$23/$41 annual), no watermark, trial only. API inconsistently stated across plans; API packs $0.10–$0.23/min.
- **SendShort** — [pricing](https://sendshort.ai/pricing/): $12–$15 Starter, $18–$29 Professional, $35–$59 Business. Long-to-short from Professional. No free tier.
- **Quso** — [pricing](https://quso.ai/pricing): Free 75 credits (watermark, 720p); $29/$39/$49 for 100/300/600 credits. 1 credit is roughly 1 minute.
- **Descript** — [pricing](https://www.descript.com/pricing): Free 1 h media and watermark; Hobbyist $16/$24; Creator $24/$35; Business $50/$65. Create Clips limited on Free.
- **Wisecut** — [pricing](https://www.wisecut.ai/pricing/): Free 30 credits; $33/mo for 300 credits; $118/mo for 1,200. Autopilot costs 2 credits per minute.
- **Munch** — conflicting third-party prices: $38/mo annual with 500 min and no free plan — [MakerStack](https://makerstack.co/reviews/munch-review/); $49/mo for 200 min, Jun 2026 — [ClipJury](https://clipjury.pages.dev/reviews/munch). Rebranded around Munch Studio — [Kompozy](https://kompozy.io/reviews/munch). Official page not read.
- **CapCut** — Pro about $7.99/mo, with regional variation and conflicting reports on whether long-video AI is paid — [FluxNote](https://fluxnote.io/guides/capcut-pro-pricing-2026).
- **Sizzle** — third-party $10/$20/custom, likely stale (via search summary); live page lists no prices — [sizzle.gg](https://sizzle.gg).
- **Streamlabs Highlighter** — free via Streamlabs Desktop (via search summary) — [Streamlabs](https://streamlabs.com/ar-sa/content-hub/post/streamlabs-ai-game-highlighter).
- **Twitch and YouTube native tools** — no separate charge was stated in retrieved sources.
- **Powder status** — I fetched powder.gg on 8 Nov 2026 and it redirects (301) to a Google Doc titled "To the Powder community"; the body could not be read. [COMP] Eklipse says Powder shut down in July 2026 — [Eklipse](https://eklipse.gg/compare/eklipse-vs-powder/) (via search summary). No web version or official notice text was confirmed.
- **Bring-your-own-key and open source.**
  - Clips Kitty: Ollama local, OpenRouter, or direct OpenAI, Claude, Gemini, xAI, Meta, DeepSeek, Qwen keys; author-reported about $0.11 per 2 h VOD — [GitHub](https://github.com/ColinGPT9/clips-studio).
  - AI-Youtube-Shorts-Generator: MuAPI key, or OpenAI or Gemini key in local mode — [GitHub](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator).
  - AutoClip: Whisper plus Ollama or own API key, MIT — [GitHub](https://github.com/artbyjazi/autoclip).
  - OpenShorts: MIT self-hosted using your own keys; hosted from $12/mo — [OpenShorts](https://www.openshorts.app/platforms/twitch).
  - FunClip: user-supplied LLM key — [mirror](https://github.com/qian-xc/FunClip).

### Inferences
- Klap's per-output pricing and Klap/Opus-style per-source-minute pricing create opposite incentives for long VODs: long streams are costly on minute-based tools and not on Klap, subject to its 3-hour cap.

### Gaps
- Official prices for StreamLadder, Vizard paid tiers, Munch, CapCut and Sizzle could not be confirmed.
- No commercial BYOK option was found, but this was not exhaustively checked per vendor.

## 5. Output features

### Takeaway
9:16 reframing, captions and a post-generation editor are near-universal. Gaming-relevant layouts (facecam detection and split screen) are documented for StreamLadder and OpenShorts, and Twitch has only said it is exploring auto-cropping.

### Cited Findings
- **OpusClip** — auto hook and animated captions on Free; Starter adds reprompting, virality score, 9:16 reframing, text-based editing and posting to YouTube Shorts, TikTok and Instagram; Pro adds moving-object tracking, custom reframing, AI B-roll and multi-profile posting — [pricing](https://www.opus.pro/pricing). ClipAnything prompting allows targeted retrieval, with Reframe Anything in alpha — [help](https://help.opus.pro/docs/article/9947095-clip-anything).
- **StreamLadder** — ranked list with score, auto-crop to vertical with facecam detection including VTubers, animated captions, hashtags, Clip Editor, Content Publisher to TikTok, Reels and Shorts, filter by type, review while analysis continues — [StreamLadder](https://www.streamladder.com/clipgpt/ai-clipping).
- **Klap** — active-speaker reframing, animated captions in 99+ languages, scheduling and publishing, editor with B-roll and hook titles — [pricing](https://klap.app/pricing).
- **Vizard** — dashboard tags such as "Hot take", "Bold claim hook" — [Vizard blog](https://vizard.ai/blog/meet-vizard-model-v2-full-context-clips-that-the-algorithm-actually-rewards); scheduled social posts — [pricing](https://vizard.ai/pricing).
- **Eklipse** — posting for users and vertical clips (via search summary) — [Eklipse](https://eklipse.gg/); moment-sized clip lengths — [help](https://eklipse.gg/help/how-gameplay-intelligence-picks-moments/).
- **Streamlabs Replay** — horizontal or vertical export, trim, music, subtitles, intros and outros, upload to YouTube and Discord — [Streamlabs](https://streamlabs.com/content-hub/post/streamlabs-AI-game-highlighter-replay).
- **Twitch** — captions on community clips rolling out; auto-crop and trim only "exploring" — [Twitch blog](https://blog.twitch.tv/en/2026/05/30/everything-we-announced-at-twitchcon-rotterdam-2026/). Dual Format produces horizontal and vertical versions of clips and VODs through Enhanced Broadcasting, June 2026 (Twitch statement relayed by [Cut.Pro](https://cut.pro/en/blog/twitch-wants-your-clips-2026)). Clip That output requires approval in Clips Manager — [Gaming Careers](https://gamingcareers.com/newsletters/twitch-clip-that-actually-works-now/).
- **YouTube** — AI highlights can be saved as Shorts — [YouTube blog](https://blog.youtube/news-and-events/live-updates/). Reported to be saved as drafts for review — [Sider guide](https://sider.ai/blog/ai-tools/how-to-generate-ai-highlight-clips-automatically-in-youtube-live) ([3P]).
- **Open source** — OpenShorts: webcam box detection by geometry, gameplay-over-facecam layout, zoom around motion, manual reframe editor — [OpenShorts](https://www.openshorts.app/platforms/twitch). AI-Youtube-Shorts-Generator: OpenCV face tracking, or MuAPI autocrop — [GitHub](https://github.com/SamurAIGPT/AI-Youtube-Shorts-Generator). AutoClip: captioned, speaker-tracked 9:16 — [GitHub](https://github.com/artbyjazi/autoclip).

### Inferences
- Active-speaker tracking is described for talking-head content, whereas gaming layouts need a facecam box plus gameplay region. Only some products document the latter explicitly.

### Gaps
- Per-product detail on batch review and on the Descript, Munch, Quso, SendShort and Submagic reframing behaviour was not retrieved.

## 6. Known user complaints

### Takeaway
On Trustpilot, poor-pick complaints are clearest for Eklipse, while credit expiry, billing and support dominate for OpusClip, Vizard and Klap. Clips cut mid-sentence and inaccurate virality scores were not well evidenced by the sources I could reach, and Reddit was not reached.

### Cited Findings
- **OpusClip** — Trustpilot 4.0 from 520 reviews, 20% one-star. Complaints include credits deducted during an unresolved audio issue (Oct 2026), about 3,000 unused credits expiring at renewal (Oct 2026), a charge after cancelling, and slow support. Poor picks were not a recurring theme on the visible page — [Trustpilot](https://www.trustpilot.com/review/opus.pro).
- **Eklipse** — 4.1 from 971 reviews, 7% one-star. "Sometimes it'll just cut random clips that aren't very interesting" (Mar 2026); "doesnt always choose the best clips" and captures background talk (Sep 2026); posting failures to Facebook, Instagram and YouTube; "Import speed is a bottleneck" and quality "noticeably worse than the source" (Sep 2026). Trustpilot notes the company has not recently invited reviews — [Trustpilot](https://www.trustpilot.com/review/eklipse.gg).
- **Eklipse build-up** — sometimes captures the final kill but misses the build-up, per a non-tested article — [Two Average Gamers](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/).
- **Vizard** — 4.5 (page also shows 4.7) from 2,521 reviews, but only 9 in the last 12 months. Credits forfeited on cancellation, no refunds, slow support, updates causing disruptions (Mar 2026) — [Trustpilot](https://www.trustpilot.com/review/vizard.ai). A third-party review calls the score inconsistent (via search summary).
- **Klap** — 3.7 from 59 reviews, 30% one-star. Billing and cancellation complaint (Aug 2026); "Its clipping quality is not that good" (Oct 2026) — [Trustpilot](https://www.trustpilot.com/review/klap.app).
- **Munch** — capped upload minutes, rendering queues, pricing behind sign-up (third-party reviews via search summary) — [Kompozy](https://kompozy.io/reviews/munch).
- **Processing time** — Opus documentation reportedly says about 20–40 minutes for ClipAnything runs — [Autoposting](https://autoposting.ai/blog/opus-clip-review). The same claim appears, contrasted with a vendor claim of under 5 minutes for a 30-minute video, in [Two Average Gamers](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). StreamLadder says about 5 minutes for a 2-hour stream [MKT] — [StreamLadder](https://www.streamladder.com/clipgpt/ai-clipping).
- **Twitch Auto Clips** — Twitch reportedly said 85% of beta testers ended streams with a clip to share, compared with 50% overall — [Gaming Careers](https://gamingcareers.com/newsletters/twitch-clip-that-actually-works-now/). I did not find this in a primary source, and it measures clip availability rather than clip quality. Timeline conflict: alpha testing reported Mar 2026 — [Zach Bussey](https://x.com/zachbussey/status/2033003837032702321); Twitch's 30 May post said beta was "in the coming months"; Gaming Careers says closed beta from Rotterdam in June 2026. No general availability was confirmed.

### Inferences
- Trustpilot complaints skew toward billing because those are the events that prompt reviews, so a low incidence of poor-pick complaints should not be read as evidence of good picks.
- Vizard's large total against 9 recent reviews means its score mostly reflects older reviews.

### Gaps
- No quantitative data on mid-sentence cuts, missing payoffs or virality-score accuracy from a neutral source.
- G2 was not read. YouTube creator forums were not searched. Reddit returned nothing through the available search.
- YouTube AI highlights: no official 2026 eligibility or availability statement found. The Community post referenced by YouTube (support.google.com/youtube/thread/372291417) was not retrieved. Third-party claims that it is limited to mobile streams or still rolling out are unverified.
- The Twitch Help Centre article on Auto Clips did not render, so eligibility, clip length and language limits rely on secondary reporting.
