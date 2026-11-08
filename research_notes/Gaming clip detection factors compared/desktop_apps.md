# App-based gaming clippers: how they detect moments (as of 8 November 2026)

**Evidence labels used on every claim**
- [DOC] = vendor documentation, support article, SDK/developer page or legal policy.
- [MKT] = vendor marketing or product page copy.
- [PRESS] = independent press.
- [3P] = third-party blog, review or forum. [COMP] = a competitor's page, so biased.
- (page read) = I opened the page and read it. (snippet) = I saw only a search-result summary and did NOT open the page. Treat (snippet) items as leads, not verified facts.

**Research limits that affect the whole file**
- Could not open: medal.tv/pricing (404), the Outplayed quick set-up guide (404 on fetch), help.allstar.gg CS2 FAQ (403), both Eklipse pages about Powder (403).
- allstar.gg returned only a tagline.
- Reddit and forum evidence is very thin. Searches for complaints returned almost no primary user threads.

## What input signals trigger or rank a clip, per product?

### Takeaway
Every established local product that documents its method triggers on structured game data or on an event the game or platform emits (replay/match data, Overwolf game events, web request from the game, trophy unlock). None of the docs I read describes ranking clips. Vision, audio or LLM detection shows up only in older or smaller products (Athenascope, Powder's fallback, FragCut), and only Medal states publicly that it is working toward model-based detection for all games, which it labels "Coming Soon".

### Cited Findings

**Medal.tv**
- [DOC] (page read) Medal "listens to the game's match data or replay system" for enabled events; the page names no CV, audio or voice detection. Updated 26 Oct 2026 — [Medal auto-clipping](https://medal.tv/auto-clipping)
- [DOC] (page read) "Most" supported games use the game's Replay system as a base, so replays must be on. Streamer Mode "typically obfuscates some information that Medal uses to detect the in-game events" — [Medal support](https://support.medal.tv/support/solutions/articles/48001167701-what-is-automatic-event-detection-auto-clipping-)
- [DOC] (page read) A separate developer route exists. The game sends one web request when a moment happens and Medal, already recording the screen, saves the surrounding seconds. Each event has a name, icon, per-event API key and a before/after window (example 15s/15s). Medal approval status is shown per event — [Medal developer quickstart](https://medal.tv/developer/auto-clipping)
- [DOC] (page read) Hotkey fallback: F8 saves the last 15 seconds to 10 minutes in any game — [Medal auto-clipping](https://medal.tv/auto-clipping)
- [3P] (snippet) A roundup says Medal supports voice clipping. The official auto-clipping page does not mention it, so it remains unconfirmed — results for "AI auto clip desktop app gaming 2026", e.g. [Clypse roundup](https://clypse.ai/blog/best-ai-clip-maker-for-gaming)
- Ranking: I found no documentation that Medal ranks auto clips. Clips are named by event (e.g. Ace, 3K) — [Medal auto-clipping](https://medal.tv/auto-clipping)

**Outplayed (Overwolf)**
- [DOC] (page read) Overwolf's Game Events Provider (GEP) gives apps real-time game events (e.g. `player_killed`) and persistent game info (e.g. `match`, `score`), subscribed to by Game Feature via `overwolf.games.events.setRequiredFeatures()` — [Overwolf GEP intro](https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro/)
- [DOC] (page read) The GEP page does not say how the data is obtained (official API, memory or otherwise). It says only that events can disappear because of game updates, studio requests or reliability problems — [Overwolf GEP intro](https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro/)
- [DOC] (page read) Highlights API: `overwolf.media.replays.getHighlightsFeatures()`. Each event type has `past`, `future` and `pending` timing, and `pending` merges nearby events into one video. Timing lives in `highlights.json`, is shared across Overwolf apps, and only the Overwolf team can edit it — [Overwolf auto-highlights](https://dev.overwolf.com/ow-native/guides/general-tech/auto-highlights-supported-games)
- [DOC] (snippet) Outplayed's privacy policy describes Highlights (event-based, for GEP-supported games), Full Match (needs a match-start event) and Full Session, with a default chosen in that order — [Outplayed privacy policy](https://legal.overwolf.com/docs/outplayed/op-privacy-policy). A how-to says there are four capture modes; the fourth was not named in what I saw — [Overwolf how-to](https://support.overwolf.com/en/support/solutions/articles/9000208995-how-to-use-outplayed)
- [DOC] (snippet) If game events drop out, Highlights or Full Match recording falls back to the full session — [Overwolf how-to](https://support.overwolf.com/support/solutions/articles/9000208995-how-to-use-outplayed)
- [3P] (snippet) One blog describes Outplayed as using "AI" to detect moments, which is not supported by the Overwolf docs above — [Eklipse blog](https://blog.eklipse.gg/tools/ai-clip-maker-gaming.html)

**NVIDIA Highlights / NVIDIA App**
- [DOC] (page read) "This is a legacy SDK. Developers may download and continue to use, but it is no longer supported." The page says Highlights "enables automatic video capture of key moments, clutch kills, and match-winning plays" and that it was adopted by Unreal Engine 4.18 and Unity 5.6. It does not describe the trigger mechanism — [NVIDIA Highlights](https://developer.nvidia.com/highlights)
- [3P] (snippet) A developer forum post says the SDK's GitHub repository is unavailable with no ETA — [NVIDIA forum](https://forums.developer.nvidia.com/t/cant-download-access-highlights-on-github/293943)
- [MKT] (snippet) The NVIDIA App page still advertises automatic capture of key moments — [NVIDIA App](https://www.nvidia.com/shadowplay)

**SteelSeries Moments**
- [MKT] (page read) Auto-clipping is "powered by Moments AI"; "Specific games in Moments automatically save highlights as event markers to your timeline". A custom hotkey is the alternative. The page does not explain detection — [SteelSeries Moments](https://steelseries.com/gg/moments)
- How Moments AI detects moments is not publicly documented in anything I found.

**Athenascope (defunct)**
- [PRESS] (snippet) Launched by Xfire co-founder Chris Kirmse and described as using "computer vision" — [Yahoo Finance](https://finance.yahoo.com/news/xfire-creator-launches-athenascope-free-191900122.html); [PC Gamer](https://pcgamer.com/this-tech-uses-ai-to-automatically-create-highlight-clips-for-you-in-fortnite-and-pubg)

**Allstar.gg**
- [DOC] (snippet) Allstar's FAQ says clips arrive automatically through Leetify, FACEIT and Refrag; users check match history under Highlights or Play of the Game — [Allstar CS2 FAQ](https://help.allstar.gg/hc/en-us/articles/17552790931735-CS2-FAQ)
- [MKT] (snippet) Typing `!allstar` in match chat clips the round for free and does not count against the limit — [Allstar](https://allstar.gg/)
- [COMP] (snippet) A competitor says Allstar renders supported game data and demos in the cloud, with zero FPS drop — [Eklipse: Allstar alternatives](https://eklipse.gg/compare/allstar-alternatives/). I found no Allstar document confirming demo parsing; a Reddit commenter calls it probably proprietary — [r/GlobalOffensive mirror](https://redlib.hbubli.cc/r/GlobalOffensive/comments/1iiuzwi/using_demo_parsing_tools_to_create_clips/mb97udo)

**Powder**
- [3P] (snippet) One roundup credits telemetry-based detection for 40+ titles, and "Universal Game Support" for other games identifies heightened emotions and key moments via audio. The summary did not tie each detail to one page; result set includes [Toolmage](https://www.toolmage.com/en/tool/powder-1/), [G2](https://ai.g2.com/marketplace/tools/powder) and [Kompozy roundup](https://kompozy.io/roundups/best-ai-gaming-clip-generators-2026)

**Newer or adjacent products**
- Xbox Highlight Reels: [DOC] (page read) "Gaming Copilot will capture clips of gaming moments while you play". The Xbox Wire post gives no method. Preview date 2 Mar 2026 — [Xbox Wire](https://news.xbox.com/en-us/2026/03/02/xbox-insiders-try-highlight-reels-on-the-rog-xbox-ally-x-starting-today/). [PRESS] (snippet) TechSpot's headline says it uses NPUs, and other coverage says Microsoft has not explained how moments are chosen — [TechSpot](https://www.techspot.com/news/111441-microsoft-using-npus-automatically-capture-xbox-game-highlights.html)
- PlayStation 5: [DOC] (snippet) Auto-capture is event-based: trophy videos and screenshots under Settings > Captures and Broadcasts > Auto-Captures > Trophies — [PlayStation support](https://www.playstation.com/en-us/support/games/capture-ps5-gameplay-screenshots). [3P] (snippet) Challenge videos are a separate toggle, on by default — [SeekingTech](https://seekingtech.com/how-to-disable-automatic-video-captures-for-challenges-on-ps5/)
- Streamlabs AI Highlighter / Replay: [3P] (snippet) One guide says it detects kills or eliminations, deaths, victories and defeats. No Streamlabs source I saw explains the technique — [Streamlabs](https://streamlabs.com/content-hub/post/streamlabs-ai-game-highlighter); [Macmyths guide](https://macmyths.com/how-to-use-streamlabs-ai-game-highlighter-replay/)
- FragCut: [3P] (snippet) Said to use CLIP visual detection and Gemini audio analysis to find kills, reactions and clutches — [Aura++ listing](https://auraplusplus.com/launches/fragcut-ai-gaming-clip-generator)
- Insights Capture: [MKT] (snippet) Windows app that detects kills, deaths and objectives; method not stated — [Insights](https://insights.gg/)
- Eklipse: [MKT] (snippet) Can pick up a "clip it" command or detect hype; primarily cloud-based — [Eklipse blog](https://blog.eklipse.gg/tools/ai-clip-maker-gaming.html)
- FlashBack and Clutch: two searches found nothing identifiable under those names as gaming clip apps.

### Inferences
- The dominant pattern is "structured event plus a retroactive recording buffer". Medal, Overwolf and PlayStation all document or describe it that way. This is why precision can be high but coverage is limited to integrated games.
- NVIDIA's mention of engine adoption suggests per-game developer integration, but the page I read does not state the trigger, so this is inference only.
- Allstar's "arrives through Leetify, FACEIT and Refrag" pattern is consistent with post-match server-side processing of match data, but demo parsing is confirmed only by a competitor.
- FragCut's reported CLIP + LLM-audio approach is the closest match in this set to what a finished-video pipeline can actually use, but the source is a launch listing.

### Gaps
- Where Overwolf GEP data physically comes from, per game: not on the page I read.
- NVIDIA's exact trigger mechanism, and whether the App still ships per-game Highlights support.
- SteelSeries Moments AI, Xbox Highlight Reels and Streamlabs: detection method undocumented.
- Whether any product ranks clips by quality: no documentation found for any of them.

## Which games are supported by automatic detection, and what happens for unsupported games?

### Takeaway
Official auto-clip lists are short and curated: Medal's is 15 games, SteelSeries shows about 18–19, and Xbox's preview had 7. In every case where behaviour is stated, unsupported games fall back to a hotkey or to session recording, not to automatic detection. The only documented-style exception is Powder's audio fallback, and that is from third-party listings.

### Cited Findings
- Medal: [DOC] (page read) 15 games as of 5 May 2026: Counter-Strike 2, Dota 2, EA Sports FC Online, Fortnite, GTA V, League of Legends, Minecraft, PUBG, Rematch, R.E.P.O., Rocket League, RuneScape: Dragonwilds, Valorant, War Thunder, YAPYAP. GTA V and Minecraft events are set per server — [Medal auto-clipping](https://medal.tv/auto-clipping)
- Medal unsupported: [DOC] (page read) "Auto clipping only works in the games listed above"; F8 still works everywhere — [Medal auto-clipping](https://medal.tv/auto-clipping)
- Medal conflict: [3P] (snippet) one roundup claims "over 100 games", contradicted by the official 15-game list — [Clypse roundup](https://clypse.ai/blog/best-ai-clip-maker-for-gaming); [Medal auto-clipping](https://medal.tv/auto-clipping)
- Outplayed: [DOC] (page read) the auto-highlights developer page lists 11 games: LoL, Dota 2, Fortnite, CS2, PUBG, R6, Apex, RL, HotS, Valorant, Overwatch — [Overwolf auto-highlights](https://dev.overwolf.com/ow-native/guides/general-tech/auto-highlights-supported-games); [MKT] (snippet) a marketing page claims 600+ supported games — [Overwolf Outplayed](https://go.overwolf.com/outplayed). These are not reconciled.
- Outplayed: [DOC] (snippet) real-time support needs ongoing upkeep and developer permission, so only select games qualify; an unlisted game can be enabled manually — [Outplayed set-up guide](https://support.overwolf.com/support/solutions/articles/9000268210-outplayed-quick-set-up-guide)
- NVIDIA: [DOC] (page read) names only PUBG and Fortnite on the legacy page; no current list found — [NVIDIA Highlights](https://developer.nvidia.com/highlights)
- SteelSeries: [MKT] (page read) labels include Apex Legends, Fortnite, CS2, Valorant, Battlefield 6, League of Legends, Call of Duty: Black Ops 7, Dota 2, Marvel Rivals, Rocket League, MultiVersus, Path of Exile 2, Fall Guys, Helldivers 2, Overwatch 2, Warzone, Brawlhalla, Destiny 2, and Street Fighter 6 in a banner. Gallery labels are ambiguous and the page does not state unsupported behaviour — [SteelSeries Moments](https://steelseries.com/gg/moments). (snippet) Regional versions of the page differ — [SteelSeries PL](https://steelseries.com/pl-pl/gg/moments)
- SteelSeries unsupported: [COMP] (snippet) manual capture by shortcut — [DOR](https://clip.dor.gg/en/blog/steelseries-moments-not-clipping)
- Allstar: [COMP] (snippet) CS2, Dota 2, League of Legends, Fortnite; not a general screen recorder — [Eklipse: Allstar alternatives](https://eklipse.gg/compare/allstar-alternatives/)
- Powder: [3P] (snippet) about 40 titles including Fortnite, Valorant, CS2, League of Legends, Rocket League, Call of Duty, Helldivers 2; other games via audio-based Universal Game Support — [Toolmage](https://www.toolmage.com/en/tool/powder-1/); [G2](https://ai.g2.com/marketplace/tools/powder)
- Xbox: [DOC] (page read) initial preview: Among Us, Lies of P, Elden Ring, Overwatch, Fortnite, Palworld, Forza Horizon 5 on ROG Xbox Ally X — [Xbox Wire](https://news.xbox.com/en-us/2026/03/02/xbox-insiders-try-highlight-reels-on-the-rog-xbox-ally-x-starting-today/)
- Streamlabs: [PRESS/MKT] (snippet) Fortnite only at launch in Sept 2024, others to follow — [Business Wire](https://www.businesswire.com/news/home/20240917543459/en)

### Inferences
- The 600+ Outplayed figure likely counts games the recorder can capture rather than games with event-based highlights. Neither source says so.

### Gaps
- Current NVIDIA App Highlights game list (not retrieved).
- Current Outplayed in-app list; the docs say it lives in the app.
- Whether Xbox Highlight Reels expanded beyond Insiders and the Ally X after March 2026.

## Does the product work on a finished VOD or YouTube link, or only during local play?

### Takeaway
This is the most important finding for CutCut. The event-based products (Medal auto-clip, Outplayed, NVIDIA, SteelSeries, PlayStation, Xbox) depend on the game running while capture is active, so their detection signals do not exist for a finished YouTube stream. The only products in this set reported to take finished footage are Powder (link import, third-party sources only, and possibly shut down), Streamlabs (file import) and the cloud-first tools such as Eklipse.

### Cited Findings
- Medal: [DOC] (page read) auto clipping runs in the Windows app on NVIDIA, AMD or Intel GPUs, with no Mac app, and uses match data or the replay system — [Medal auto-clipping](https://medal.tv/auto-clipping). Developer events require the Medal app recording while the game plays — [Medal developer quickstart](https://medal.tv/developer/auto-clipping)
- Outplayed: [DOC] (page read) GEP events are real-time, not stored, and an app must have a listener registered, otherwise events are missed — [Overwolf GEP intro](https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro/)
- Xbox: [DOC] (page read) requires background recording while playing; the reel is compiled at session end — [Xbox Wire](https://news.xbox.com/en-us/2026/03/02/xbox-insiders-try-highlight-reels-on-the-rog-xbox-ally-x-starting-today/)
- SteelSeries: [MKT] (page read) highlights are saved as markers to the timeline as you play — [SteelSeries Moments](https://steelseries.com/gg/moments)
- Allstar: [COMP] (snippet) works from game data and demos in the cloud, not from arbitrary video — [Eklipse: Allstar alternatives](https://eklipse.gg/compare/allstar-alternatives/). This is post-match, but it still needs match data rather than video.
- Powder: [3P] (snippet) users could record gameplay or import a VOD; one guide says import takes a stream link from Twitch, YouTube or Kick — [StreamDesignz](https://streamdesignz.com/blogs/live-streaming/how-to-record-edit-gaming-videos-for-beginners-free-tool). Windows-only and on-device — [Toolmage](https://www.toolmage.com/en/tool/powder-1/)
- Streamlabs: (snippet) records automatically when live streaming a supported game; existing footage is imported as a video file — [Streamlabs](https://streamlabs.com/content-hub/post/streamlabs-ai-game-highlighter)
- Eklipse: [MKT/3P] (snippet) focuses on streams and VODs rather than local capture; one Eklipse page says its AI reads event signals from Twitch VOD data — [Eklipse: AI highlight generator](https://eklipse.gg/help-category/ai-highlight-generator-for-games)

### Inferences
- A pipeline working on finished YouTube streams cannot use Overwolf-style events, Medal's replay or match feed, or trophy events. It is limited to what is in the video and audio file, plus chat or metadata if available.
- Powder's audio-based fallback is the closest analogue among the desktop apps to what CutCut can do, but it is thinly sourced.
- Demo-based rendering (Allstar's reported approach) could only help CutCut if the match demo is available, which a YouTube link does not provide.

### Gaps
- Whether Medal runs any detection on already-uploaded or imported video. Nothing found says it does.
- Whether SteelSeries or NVIDIA can process imported footage. Nothing found.
- Whether Powder's link import still works.

## What are the pricing tiers and limits in 2026, and does any offer bring-your-own-API-key?

### Takeaway
Current official pricing is largely unverified: Medal's pricing URL returned 404 and Allstar's prices were not retrievable. Allstar's clip quotas are the clearest limits found. No product in this set was seen offering bring-your-own-API-key, though I did not run a dedicated search for it.

### Cited Findings
- Medal: [MKT] (page read, dated 18 Nov 2024) Free: uploads to 10 minutes, 720p max, watermark on downloads, ads, no cloud sync. Premium: uploads to 30 minutes, up to 1440p, removable watermark and outros, ad-free, automatic cloud upload with "unlimited space". No price stated — [Medal blog](https://blog.medal.tv/posts/medal-vs-medal-premium-benefits-and-features)
- Medal conflict: [3P] (snippet) a review says downloads carry a free-plan watermark while noting Eklipse claims locally captured clips do not — [Hamirev](https://hamirev.com/medal-tv-pricing-and-review/)
- Allstar: [MKT] (snippet) Free 4 clips a month, Player+ 25 clips a month, Premium no monthly limit; `!allstar` clips do not count — [Allstar](https://allstar.gg/). Prices not found.
- Outplayed: [COMP] (snippet) free with ads; Premium removes ads — [Insights vs Outplayed](https://insights.gg/blog/insights-vs-outplayed). Current price not found.
- Overwolf platform: [DOC] (page read) "From November 1, 2026, Overwolf only approves apps with Overwolf monetization" — [Overwolf GEP intro](https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro/)
- SteelSeries: [MKT] (page read) Free Download; auto-clip pricing not stated — [SteelSeries Moments](https://steelseries.com/gg/moments). [COMP] (snippet) GG paid plans said to start at $19.99 a year, unverified — [Eklipse blog](https://blog.eklipse.gg/basic-knowledge/best-clipping-software-for-valorant.html)
- Eklipse: [3P] (snippet) Premium about $19.99 a month, about $14.99 a month annually, 1080p, unlimited auto-processing, up to 100 highlights per stream, 90-day storage — [Kompozy roundup](https://kompozy.io/roundups/best-ai-gaming-clip-generators-2026)
- BYOK distinction: Medal's per-event API key authenticates a game sending events to Medal; it is not a way to bring your own AI provider key — [Medal developer quickstart](https://medal.tv/developer/auto-clipping)

### Inferences
- Local-capture apps avoid per-minute AI cost by using game events and the user's own GPU, which fits free tiers with paid storage or cosmetic upsells. This is inference from the feature tables above.

### Gaps
- 2026 Medal Premium price (medal.tv/pricing 404; [G2 pricing](https://www.g2.com/products/medal/pricing) and Hamirev were not opened).
- Allstar and Outplayed prices.
- BYOK: absence in the pages read is weak evidence; no dedicated search was done.

## What output features exist (9:16, facecam, captions, hooks, auto-publishing)?

### Takeaway
The event-based local apps document saving, trimming, montage and manual sharing rather than short-form packaging. Medal says outright that it never posts for you. I found no documented 9:16 reformat, facecam layout or hook generation for Medal, Outplayed, NVIDIA or SteelSeries in the pages read, although these pages were not comprehensive feature lists.

### Cited Findings
- Medal: [DOC] (page read) clips saved on device, Create Link for sharing, "Medal never posts a clip anywhere for you" — [Medal auto-clipping](https://medal.tv/auto-clipping)
- Medal: [MKT] (page read, 19 Mar 2026) smart trimming, improved captions and subtitles, every-game auto clipping and auto-montage are listed as "Coming Soon" — [Medal x General Intuition](https://medal.tv/blog/posts/medal-x-general-intuition-how-clips-and-gameplay-actions-create-spatial-intelligence)
- SteelSeries: [MKT] (page read) direct upload to YouTube, Discord, Reddit and X, trimming, multi-track audio, montage; vertical, captions and watermarks not mentioned — [SteelSeries Moments](https://steelseries.com/gg/moments)
- NVIDIA: [DOC] (page read) the legacy page describes sharing to Facebook, YouTube or Weibo and 15-second GIFs through the GeForce Experience overlay — [NVIDIA Highlights](https://developer.nvidia.com/highlights)
- Xbox: [DOC] (page read) short replay clips plus an auto-created reel per session, viewed and shared in the Xbox PC app — [Xbox Wire](https://news.xbox.com/en-us/2026/03/02/xbox-insiders-try-highlight-reels-on-the-rog-xbox-ally-x-starting-today/)
- PS5: [3P] (snippet) trophy video length is 15 or 30 seconds — [SeekingTech](https://seekingtech.com/how-to-customize-ps5-trophy-screenshot-and-video-captures/)
- Streamlabs: (snippet) upload directly to YouTube or download — [Streamlabs](https://streamlabs.com/content-hub/post/streamlabs-ai-game-highlighter)

### Inferences
- If the gap holds, packaging for Shorts (9:16, facecam, captions, hooks) is where stream-clipper tools differ from local capture apps. This needs confirming against each product's full feature list.

### Gaps
- Allstar's vertical and montage output, and Outplayed's editor features: not retrieved.
- Powder's output features: not retrieved.

## Medal in depth: AI features, engineering posts, data use and training-data news

### Takeaway
Medal's shipped auto-clipping is event-based on 15 games. Its AI-based "every game" clipping is a stated future goal, tied to General Intuition, the lab spun out of Medal, which trains on data from Medal clips. I found no engineering post describing a detection model.

### Cited Findings
- [MKT] (page read, 19 Mar 2026) "By learning from the moments people actually clip, we can power auto clipping for every game on the planet", under "Coming Soon" — [Medal x General Intuition](https://medal.tv/blog/posts/medal-x-general-intuition-how-clips-and-gameplay-actions-create-spatial-intelligence)
- [MKT] (page read) The models use "data generated from uploaded clips and controller overlays", with actions described as semantic labels ("Player moved forward") rather than raw key presses — [Medal x General Intuition](https://medal.tv/blog/posts/medal-x-general-intuition-how-clips-and-gameplay-actions-create-spatial-intelligence)
- [MKT] (page read) Medal says users can opt in or out at any time in Settings > Medal AI and that opting out "will remove all of your past data" — [Medal x General Intuition](https://medal.tv/blog/posts/medal-x-general-intuition-how-clips-and-gameplay-actions-create-spatial-intelligence)
- Location conflict: [DOC] (snippet) Medal's support article places the AI-research toggle under Privacy & Security settings — [Medal opt-out](https://support.medal.tv/support/solutions/articles/48001281414-opt-out-of-ai-training)
- Default state: [3P] (snippet) one review says clips are used for AI and research by default; Medal's blog implies this but does not state it — [Lilach Bullock](https://www.lilachbullock.com/is-medal-tv-safe/)
- [3P] (snippet) The same review reports that the terms cover developing and training AI models, and that General Intuition Inc. works with Medal on training using clip data with some identifiers removed — [Lilach Bullock](https://www.lilachbullock.com/is-medal-tv-safe/). Terms not read directly.
- [PRESS] (page read, 16 Oct 2025) General Intuition, spun out of Medal, raised $133.7M seed led by Khosla Ventures and General Catalyst. Pim de Witte leads both companies. The Information reported that OpenAI tried to buy Medal for $500M in late 2024; neither company commented. The article does not address user consent — [TechCrunch](https://techcrunch.com/2025/10/16/general-intuition-lands-134m-seed-to-teach-agents-spatial-reasoning-using-video-game-clips)
- Scale figures differ: 2B videos a year from 10M MAU — [TechCrunch](https://techcrunch.com/2025/10/16/general-intuition-lands-134m-seed-to-teach-agents-spatial-reasoning-using-video-game-clips); 15M+ monthly users and 2.5B+ clips "this year", vendor figure, Mar 2026 — [Medal x General Intuition](https://medal.tv/blog/posts/medal-x-general-intuition-how-clips-and-gameplay-actions-create-spatial-intelligence)
- [PRESS] (snippet) June 2026 reports say General Intuition was raising about $300M at about $2B or more; final amount and valuation vary between reports — [SiliconANGLE](https://siliconangle.com/2026/06/18/game-clip-ai-startup-general-intuition-talks-raise-300m-2b-valuation/); [TechCrunch](https://techcrunch.com/2026/06/25/general-intuitions-2-3b-bet-that-video-games-can-train-ai-agents-for-the-real-world/). One search summary attached a >$2B valuation to the 2025 seed; the TechCrunch seed article as read did not, so I treat that as unconfirmed.

### Inferences
- As of the 26 Oct 2026 auto-clipping page, which still lists only games and says auto clipping works only in those games, the "every game" model does not appear to have shipped.
- User clip choices act as implicit labels of what is worth clipping. De Witte's quoted "selection bias" remark supports this reading of the dataset's value, but no source describes a clip-worthiness model's design.

### Gaps
- No Medal engineering post on detection found.
- Exact mechanics of how Medal reads the replay or match data per game.
- Whether Medal AI is default-on for new users: no primary statement read.
- Retention periods and the legal relationship between Medal and General Intuition.

## What are the known user complaints?

### Takeaway
Primary user complaint data was largely not retrievable. What I can support is vendor-documented failure modes: disabled replays or Streamer Mode, Overwolf event outages, and FPS issues tied to settings. Anti-cheat conflicts remain unevidenced.

### Cited Findings
- Medal missed moments: [DOC] (page read) in-game Streamer Mode and disabled replays stop detection — [Medal support](https://support.medal.tv/support/solutions/articles/48001167701-what-is-automatic-event-detection-auto-clipping-)
- Outplayed missed moments: [DOC] (snippet) when highlights and apps are down, highlights are simply not captured automatically — [Overwolf common capture issues](https://support.overwolf.com/support/solutions/articles/9000181387-common-capture-issues). [DOC] (page read) events can vanish after game updates or studio requests — [Overwolf GEP intro](https://dev.overwolf.com/ow-native/live-game-data-gep/live-game-data-gep-intro/)
- Outplayed performance: [DOC] (snippet) Overwolf links FPS drops to conflicts with RivaTuner and to encoding presets or resolution set too high — [Overwolf performance guide](https://support.overwolf.com/support/solutions/articles/9000184425-performance-issues-fps-cpu-memory-). [MKT] (snippet) the store page claims no FPS harm, with no independent test seen — [Overwolf Outplayed](https://go.overwolf.com/outplayed)
- Outplayed dependency: [COMP] (snippet) needs the Overwolf client — [Insights vs Outplayed](https://insights.gg/blog/insights-vs-outplayed)
- Medal paywall and watermark: [MKT] (page read, Nov 2024) free downloads carry a watermark and are limited to 720p — [Medal blog](https://blog.medal.tv/posts/medal-vs-medal-premium-benefits-and-features)
- Medal privacy: AI-training use and its opt-out are documented above. I found no primary evidence of widespread user backlash; one search aimed at it returned none.
- PS5: [3P] (snippet) trophy clips use storage, and a forum post reports captures persisting on PS Portal cloud streaming with the setting off — [Tom's Guide](https://tomsguide.com/news/this-ps5-feature-eats-up-your-storage-how-to-turn-it-off); [Push Square](https://www.pushsquare.com/news/2025/01/talking-point-ps5-saves-video-clips-when-you-earn-trophies-do-you-leave-that-feature-on)
- Athenascope quality: [COMP] (snippet) "off-target" clips, per a competitor only — [Eklipse: Athenascope alternatives](https://eklipse.gg/compare/athenascope-alternatives/)
- Athenascope closure: (snippet) sources disagree on the date: April 2022, 5 April 2022, or highlights stopped 30 March 2022. No official reason found — [Framedrop](https://framedrop.ai/blog/athenascope-alternative); [Eklipse reviews](https://blog.eklipse.gg/?p=5041). CB Insights is reported to say it is now part of Roblox; unverified, though an acquisition would not necessarily conflict with a product shutdown — [CB Insights](https://www.cbinsights.com/company/athenascope)
- Powder status: [COMP] (snippet) Eklipse says Powder shut down in July 2026; no independent confirmation — [Eklipse: Powder alternatives](https://eklipse.gg/compare/powder-alternatives/). powder.ai redirects to a GoDaddy for-sale page, but I guessed that domain and it is not established as Powder's, so it is not evidence either way.

### Inferences
- Event-based detection fails in a specific way: it silently misses when the feed breaks, instead of producing bad clips. Vendor docs on outages and Streamer Mode support this.

### Gaps
- Anti-cheat conflicts: one search returned only general Vanguard material, nothing linking Medal or Overwolf to anti-cheat problems. Not established either way.
- False-positive rates and measured FPS cost: no independent measurements found for any product.
- Reddit sentiment: not retrieved in usable form.
- Why Athenascope closed.
