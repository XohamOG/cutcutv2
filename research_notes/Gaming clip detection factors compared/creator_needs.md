# What YouTube gaming creators want from an auto-clipping tool, and where the market leaves them unserved (as of 8 November 2026)

Reading notes on evidence quality:
- **[Fetched]** means the page was opened and the quote extracted from it. **[Snippet]** means it came only from a search-result summary; the page was not opened and the quote may lack context.
- Review quotes come from a fetch tool that extracts text. Trustpilot text was sometimes truncated ("See more").
- Vendor blogs are marked **(vendor)**. They are competitors or sellers and are biased.
- This is not legal advice. Policy text is reported as found.

## Objective: ranked unmet needs and differentiators

### Takeaway
The best-supported opening is not "better AI" in general. It is a YouTube-first, gameplay-aware selector with a fast review screen and predictable cost. Clip selection quality is the most repeated complaint, and credit/billing anger is the second. Chat-replay use on YouTube looks like a real gap, but that rests on an absence of documentation. Reddit voices are missing from this evidence base (see Gaps).

### Cited Findings
Theme counts below are distinct named reviewers or sources found in this session. They are small samples and do not measure prevalence.

| Theme | Support | Strength | Example |
|---|---|---|---|
| AI picks uninteresting or wrong moments | At least 7 reviewers, 3 review listings (Eklipse Trustpilot, OpusClip Trustpilot, Eklipse G2), plus 1 vendor critique | Repeated | "sometimes it'll just cut random clips that aren't very interesting" — John Bunton, 4★, 1 Mar 2026, [Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5) |
| Credits, renewals, refunds, deleted projects | 7 named reviewers, 2 products, plus 2 snippet reviews | Repeated | "they have reduced how far my credits go" — James Whitehead, 3★, 22 Jul 2026, [Trustpilot, Fetched](https://www.trustpilot.com/review/opus.pro?page=4) |
| Clips need manual clean-up, or the editor is weak | 4 reviewers, 2 products | Repeated, moderate | "the PvP clips typically needed to be adjusted and sorted significantly better" — Rob_blizzy, 3★, 15 Mar 2026, [Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5) |
| Caption errors, especially non-English | 1 Trustpilot snippet, 1 blog, 1 second-hand claim | Thin | see the language section |
| Talk-trained AI misses gameplay | 2 articles, 1 quoted reviewer, all secondary | Plausible, weakly evidenced | see the gameplay section |
| YouTube served worse than Twitch | 1 truncated review | One-off | "Not so much for youtube though." — Damon, 4★, 13 Mar 2026, [Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=3) |
| Misses reactions or funny chat moments | 1 user review | One-off | [Snippet, likely Eklipse's curated review page](https://eklipse.gg/compare/eklipse-review/) |

Positive demand also repeats, so the job is real:
- "This app has really saved me from the manual portion of finding clips" — Raistru, 5★, 16 Mar 2026, [Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5).
- "very helpful for new streamers with no mods" — Sunflower Child, 5★, 27 Mar 2026, [same page](https://uk.trustpilot.com/review/eklipse.gg?page=5).
- Both main tools have good aggregate scores: Eklipse 4.1 from 971 reviews ([Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=3)); opus.pro 4.0 from 520 reviews ([Fetched](https://www.trustpilot.com/review/opus.pro?page=4)). A separate regional page showed 2 out of 5 from 18 reviews ([Snippet](https://nl-be.trustpilot.com/review/opus.pro)), so scores vary by listing and date.

### Inferences
Ranked by evidence strength multiplied by fit with CutCut:
1. **Selection you can inspect.** Show why each clip was chosen (audio peak, chat spike, transcript hook, and retention if connected). Selection quality is the top complaint, and no reviewed product was documented as explaining its choices.
2. **Long-VOD-friendly cost.** BYOK removes the per-source-minute meter that a 3 to 4 hour gaming stream consumes quickly.
3. **No hostage projects.** Local or user-owned outputs directly answer the "deleted all my projects" complaints.
4. **Fast multi-clip review with cut-point nudging.** This responds to the "needed to be adjusted and sorted" complaints.
5. **Owner-only signals.** YouTube audience retention through OAuth could become a signal clip tools built on pasted links cannot get.
6. **Hinglish and regional languages.** Plausibly open, but this rests on missing evidence rather than documented complaints.

### Gaps
- **No Reddit evidence.** The search tool refused reddit.com as a domain filter, and unfiltered searches returned no usable thread text. Two Reddit mirror sites appeared in results and were deliberately not opened, because they would sidestep that restriction. The requested subreddits (r/NewTubers, r/Twitch, r/YouTubeGaming, r/SmallStreamers, r/content_creation) are therefore **not represented, and no Reddit quotes are included**. A person should read these directly before the themes are treated as complete.
- App store reviews were not reached. G2 was seen only in snippets. Creator forums appeared only for music-copyright topics.
- Trustpilot reviewers skew toward billing and support events, and most reviews are not from gaming-specific or YouTube-specific users.

## Is the YouTube-streamer segment underserved compared with Twitch? Which tools read YouTube chat replays?

### Takeaway
YouTube ingestion itself is common, so "YouTube support" is not a differentiator. No mainstream commercial tool was found documenting analysis of YouTube **chat replay**. Treat this as unconfirmed, since vendors rarely publish their signals. YouTube's own AI highlights feature, announced in September 2025, is the most serious competitive threat and its current availability is unverified.

### Cited Findings
- Eklipse says it links to Twitch, Kick and YouTube and auto-produces vertical clips — [Eklipse, Snippet (vendor)](https://eklipse.gg/features/automate-stream-clips/). The page returned 403 when fetched, so its signals could not be read.
- Eklipse is described as using computer vision trained on specific games to read kill feeds, claiming 1,000+ titles with roughly 30 to 50 deep models. Eklipse's only chat-like feature mentioned is saying "Clip it!" during a stream — [Two Average Gamers, 21 Apr 2026, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). That article has no formal test method and discusses affiliate programs despite claiming no affiliate links.
- OpusClip's free plan imports YouTube only, with no Twitch — [same article](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/); [Snowball, 28 Apr 2026 (vendor), Fetched](https://snowball-for-streamers.com/en/blog/opus-clip-doesnt-work-for-gaming). Twitch is the paid feature there, which is the opposite of YouTube being neglected at ingestion.
- StreamSnip targets YouTube livestreams, with viewers triggering clips by a `!clip` chat command through Nightbot and Discord. That is live command use, not replay analysis — [StreamSnip, Snippet (vendor)](https://streamsnip.com/).
- Replay-link tools for YouTube include [Transcriptr](https://transcriptr.ai/blog/ai-livestream-clip-maker) and [Autoclipper](https://autoclipper.live/en/tools/youtube-live-clip-maker) (both Snippet, vendor). Live-capture options listing YouTube include [Cutline](https://cutline.co/) and [ClipMe](https://clipme.com/) (both Snippet, vendor).
- Powder (November 2023) targeted shouting and chat spikes for gaming — [TechCrunch, 20 Nov 2023, Snippet](https://techcrunch.com/2023/11/20/powder-an-ai-clipping-tool-for-gaming-can-detect-when-a-creator-yells-during-a-stream). Its current status and YouTube chat coverage were not established.
- An open-source project, Auto-Clipper, lists audience-retention data, chat spikes and timestamped comments for YouTube and Twitch/Kick — [Shyft listing, Snippet](https://www.shyft.ai/skills/autoclipper). How it obtains chat is unconfirmed.
- The official chat API lists a `forbidden (403)` `liveChatEnded` error, "The specified live chat is no longer live" — [YouTube Data API, Fetched](https://developers.google.com/youtube/v3/live/docs/liveChatMessages/list). The page does not state outright that replays are unsupported.
- YouTube announced that AI highlights "finds the most compelling moments from the livestream and automatically creates ready-to-share Shorts" — [YouTube Blog, 16 Sep 2025, Fetched](https://blog.youtube/news-and-events/live-updates/). Eligibility and dates were not given in the post.

### Inferences
- Chat replay is the most defensible technical differentiator found, but the official API appears not to provide it, so it probably depends on unofficial extraction. See the legal section.
- The native YouTube feature means CutCut should not compete on "automatic Shorts exist". It should compete on control, transparency, and gaming-specific selection.

### Gaps
- Could not verify whether YouTube's AI highlights has rolled out, to whom, or how good it is.
- No first-party statement was found from any commercial vendor saying it does or does not read YouTube chat replays.
- No market-size comparison of YouTube and Twitch streamers' tool spending was found. The "Twitch-centric market" premise is not proven by this research.

## How do creators review and fix AI clips today, and how much time does it take? Which editing controls matter?

### Takeaway
Creators treat AI output as a candidate pile to sort. Reliable time measurements do not exist in what was found, only vendor estimates. Evidence supports selection, trimming and editor quality as pain points. Specific demand for facecam placement and hook regeneration was not found in reviews.

### Cited Findings
- Time estimates, vendor only: manual CapCut editing at 20 to 45 minutes per clip, or 2 to 5 hours at 7 clips per week; reviewing Twitch's clips page at 10 to 15 minutes — [Snowball (vendor), Fetched](https://snowball-for-streamers.com/en/blog/opus-clip-doesnt-work-for-gaming). No method is given.
- Yield: "when the AI clip farming only captures 5-10 useable clips it's disheartening" — [reviewer, Snippet; listing not pinned, G2 or Trustpilot](https://www.g2.com/products/eklipse/reviews_and_filters). A brand partner's stated usable rate was about 80 to 85% for podcasts and about 60% for gaming — [Two Average Gamers, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). Single, unaudited source.
- "could use a better manual editing UI" — Darren Francis, 4★, 24 Mar 2026, [OpusClip Trustpilot, Fetched](https://www.trustpilot.com/review/opus.pro?page=4).
- "I do wish the editing was a bit cleaner overall" — Andrea Psomas, 4★, 18 Mar 2026; "auto editing mode could be a bit better with zoom effects and more action packed" — Daniyal Arshad, 4★, 16 Mar 2026 — [Eklipse Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5).
- Counter-signal: one reviewer praised "the studio for manual editing" — Adam, 5★, 25 Jun 2026, [Eklipse Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=3).
- Feature baseline: Eklipse free has trim, cut, crop, text, stickers and templates. OpusClip free has no editing, Starter has basic editing, and Pro adds filler-word removal, B-roll and XML export to Premiere and DaVinci Resolve — [Two Average Gamers, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). Snowball separately claims the OpusClip editor is locked on Starter ([vendor](https://snowball-for-streamers.com/en/blog/opus-clip-doesnt-work-for-gaming)), which conflicts on detail.

### Inferences
- Priority order from this evidence: multi-clip triage (keep or reject), then cut-point adjustment, then captions. Layout, facecam placement and hook regeneration are sensible product features but have no direct demand evidence here.
- Paywalling the editor is a visible weakness. A free, complete review screen would be easy to communicate.

### Gaps
- No independent measurement of review time per clip or per stream.
- No review quotes specifically requesting facecam placement, moving cut points by name, or regenerated hooks. Reddit is the likeliest place for these.

## Small streamers, non-English and Hinglish, non-FPS games, and no-facecam or no-commentary streams

### Takeaway
These segments are under-documented, not proven to be underserved. Kill-feed vision suits shooters, and audio or chat signals suit reactive streamers, so silent, low-chat streams are structurally hard for every approach, including CutCut's. Stock Whisper on Hinglish is a known weak spot, with community fine-tunes available.

### Cited Findings
**Gameplay vs. talk**
- "Opus Clip listens to your voice. It does not watch your game." The author tested Valorant VODs and reports no counts — [Snowball (vendor), 28 Apr 2026, Fetched](https://snowball-for-streamers.com/en/blog/opus-clip-doesnt-work-for-gaming).
- OpusClip's AI was described as mainly trained on podcasts and talking heads, with a reviewer quoted saying "visual-heavy content without clear dialogue still underperforms" — [Two Average Gamers, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/).
- Shooter praise: "I like how all kills from my Call of Duty streams are captured by Eklipse." — Daniyal Arshad, 4★, 16 Mar 2026, [Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5).

**Horror, Minecraft, GTA RP**
- Eklipse says its newer engine catches highlights in horror games such as Phasmophobia "where the hype is in the reactions" — [Eklipse, Snippet (vendor)](https://eklipse.gg/compare/eklipse-review/). It also publishes [Minecraft](https://eklipse.gg/use-case/minecraft-highlights) and [GTA V](https://eklipse.gg/use-case/grand-theft-auto-v-highlights) pages (vendor).
- A vendor guide says GTA streams are "primarily audio-driven for highlight detection" — [AutoClip (vendor), Snippet](https://autoclip.dev/blog/how-to-clip-gta-funny-moments).

**Small streamers**
- Free-tier length limits are a friction point: "it wont clip anything over 2 hours" — Loyd Stewart, 1★, 20 Mar 2026, [Eklipse Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=5).

**Language**
- Eklipse captions drew complaints of inconsistency "particularly for non-English content", according to a blog summarising Trustpilot — [Two Average Gamers](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). Two Trustpilot pages read directly did not show such reviews, so this is unconfirmed.
- OpusClip is claimed to support 20+ languages at about 95 to 97% accuracy on clean audio — [same source](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). Vendor-derived, and game audio is not clean audio.
- A Trustpilot reviewer: "most of the times clipping is terrible, you have audio issues and there are plenty of caption mistakes" — [OpusClip, Snippet](https://nl-be.trustpilot.com/review/opus.pro).
- A fine-tuned model self-reports Hindi WER of about 12.9 vs about 30.8 for base whisper-large-v3 on Common Voice Hindi under its own normaliser, while its English error is worse (6.93 vs 4.81 on FLEURS-en) — [Trelis model card, Snippet, self-reported](https://huggingface.co/Trelis/whisper-hinglish-preview).
- A blog, not a rigorous study, says Whisper large-v3 has no dedicated Hinglish mode and tends to output all-Devanagari with English transliterated — [convertaudiototext](https://convertaudiototext.com/blog/hindi-transcription-code-switching).

### Inferences
- CutCut's audio plus chat design inherits the same weakness as talk-trained tools on silent streams. A low-signal warning ("this stream has little chat or commentary; expect weaker picks") would be more honest than guessing, and gameplay-aware visual cues would need to be added to serve silent streams.
- Chat-spike thresholds need normalising to each stream's own baseline, as small channels will not produce absolute spikes.
- For Hinglish, offering a fine-tuned model choice is plausible, but a test on real game-audio streams is needed before claiming any advantage. Roman-script Hinglish in chat also needs handling separately from speech transcription.

### Gaps
- **Found nothing on BGMI or mobile-game clipping complaints or support**, and no language-specific Hinglish chat analysis in any tool.
- No creator testimony on no-commentary or no-facecam failures. The silent-stream claim above is reasoning from how the tools work.
- No independent stock-Whisper benchmark on Hinglish, and none on speech mixed with game audio.

## Copyright: in-game music, Content ID, publisher policies

### Takeaway
No clipping tool was found that pre-checks clips for in-game music risk, so this appears open, though the search was not exhaustive. Publisher rules vary. Nintendo's is the clearest current official text and bars "mere copies" without creative input, which matters for automated clips.

### Cited Findings
- Nintendo guidelines (published 29 Nov 2018, updated 2 Sep 2024): monetization is allowed only through listed methods, including "YouTube - YouTube Partner Program". "Videos and images that contain mere copies of Nintendo Game Content without creative input or commentary are not permitted." Gameplay posted "using Nintendo system features" is an exception — [Nintendo, Fetched](https://www.nintendo.co.jp/networkservice_guideline/en/index.html).
- Riot reportedly permits ad revenue within its guidelines, but in-game music can cause monetization problems unless on its creator-safe list — [clip.dor.gg guide, Snippet, unverified](https://clip.dor.gg/en/blog/game-clip-copyright-guide).
- Capcom's policy (2021) permitted gameplay footage and platform monetization — [EventHubs, 6 Jan 2021, Snippet](https://eventhubs.com/news/2021/jan/06/capcom-video-content-rules). Dated.
- Rockstar: only a 2013 report of GTA V rules was found — [Game Informer, 16 Sep 2013, Snippet](https://www.gameinformer.com/b/news/archive/2013/09/16/rockstar-details-allowable-content-and-uses-of-game-footage.aspx). The official page timed out.
- Twitch reportedly mutes VOD portions matched in the Audible Magic database, including in-game music — [PSU, Snippet, older report](https://www.psu.com/news/twitch-blocking-in-game-music-with-new-copyright-rules-imposed-on-streamers/).
- Blog guides state that a Content ID claim is typically not itself a strike, that removal of an active stream can bring a strike and seven-day livestream restriction, and that scans occur during the live stream — [wildandfreetools](https://wildandfreetools.com/blog/music-copyright-youtube-live-streams/) and [itechguides](https://www.itechguides.com/how-to-avoid-copyright-claims-on-a-youtube-gaming-vod-livestream/) (Snippet; the summary did not separate which said what; not official).
- Developers report that streamers are told not to stream with certain game music on, and that claim disputes lack an "incorrect Content ID" option — [Steam discussion](https://steamcommunity.com/app/1465470/discussions/0/4517758483710705658); [itch.io thread](https://itch.io/t/2571709/avoiding-content-claiming-on-music-for-youtube-and-twitch-content-creators-as-of-08) (Snippet, attribution approximate). Anecdotal.
- The only detector mentioned was a third-party Content ID lookup vendor page, per a search summary whose source was unclear. Treat as unverified.

### Inferences
- A cheap differentiator is a per-clip rights warning: game-level policy notes plus flagging of segments with licensed-sounding music, leaving the decision to the creator. Claiming actual Content ID prediction would be unsafe, as no public matching access was found.
- Adding commentary, captions or edits may be relevant to "creative input" under Nintendo-type rules, but whether auto-generated captions qualify is not addressed by the text.

### Gaps
- **No current official policy read for Rockstar, Riot, Krafton/BGMI, Microsoft/Mojang (Minecraft), or Activision.** Krafton/BGMI searches returned nothing.
- No official YouTube Content ID documentation was read in this session.

## Bring-your-own-key economics, local processing, and privacy

### Takeaway
Hosted credit pricing runs at about $3.90 to $6 per source hour, while hosted Whisper transcription costs cents per hour. That gap is real, but it is not like-for-like, because credits also pay for LLM, rendering, storage and product. Local and BYOK alternatives already exist as small open-source projects. Direct evidence that mainstream creators value BYOK was not found.

### Cited Findings
- OpusClip meters about 1 credit per source minute. Free is 60 credits/month, Starter $15 for 150, Pro $29 for 300 — [Two Average Gamers, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). Pro annual conflicts: $14.50/month with 3,600 upfront in older captures, vs $19.43/month with 300 monthly credits and two-month rollover in a capture dated 6 Oct 2026 — [UsagePricing, Snippet](https://www.usagepricing.com/blueprint/activity/opus-clip-2026-10-06-pro-annual-price-rise). The later figure is probably current; confirm on OpusClip's site.
- Eklipse is flat-rate: $19.99/month, or about $12.50/month annually, with no credits — [Two Average Gamers, Fetched](https://www.twoaveragegamers.com/eklipse-vs-opusclip-head-to-head-for-gaming-streamers-2026/). It is the main counterexample to credit fatigue.
- Groq lists Whisper Large v3 at $0.111/hour and Turbo at $0.04/hour as of an Oct 2026 snapshot, with a 10-second per-request minimum — [Search summary citing Groq console](https://groq.com/?p=5881); [UsagePricing Groq](https://usagepricing.com/blueprint/groq). Deepgram Nova-3 at $0.26/hour batch is from a third party, unverified — [dev.to](https://dev.to/pietrus914/speech-to-text-api-comparison-whisper-api-options-in-2026-400h).
- Complaints tied to metering and lock-in: "I paid for the PRO version but it was never credited." (Carlos Scandiffio, 1★, 15 Jul 2026); "Received no email for renewal and they deleted all my projects!" (Vincent, 2★, 10 Jul 2026); "My handed in projects were deleted after me not continuing my pro feature" (Leopold, 1★, 14 Jul 2026) — [OpusClip Trustpilot, Fetched](https://www.trustpilot.com/review/opus.pro?page=4). Also "wouldnt refund me few days later of autorenew for a whole year" — George, 1★, 25 Aug 2026, [Eklipse Trustpilot, Fetched](https://uk.trustpilot.com/review/eklipse.gg?page=3).
- Support can go well: "He refunded my credits for a video that was stuck in que" — Tyrone Burston, 5★, 17 Jul 2026, [Trustpilot, Fetched](https://www.trustpilot.com/review/opus.pro?page=4).
- Existing BYOK or local projects: [BridgeClip](https://github.com/bridge-mind/bridgeclip/wiki) (renders locally, audio and transcripts go to OpenRouter), [AutoClip](https://github.com/artbyjazi/autoclip) (offline Whisper plus Ollama, or BYOK), [OpenClip](https://github.com/aionixos/openclip) (early stage), [VibeClip](https://hunted.space/product/vibeclip) (Snippet; self-reported).

Calculated from the figures above:

| Item | Per source minute | Per source hour | 4-hour stream |
|---|---|---|---|
| OpusClip Starter ($15/150) | $0.100 | $6.00 | $24.00 |
| OpusClip Pro monthly ($29/300) | $0.097 | $5.80 | $23.20 |
| OpusClip Pro annual, Oct 2026 capture ($19.43/300) | $0.065 | $3.89 | $15.54 |
| Groq Whisper Large v3 | $0.00185 | $0.111 | $0.44 |
| Groq Whisper Large v3 Turbo | $0.00067 | $0.04 | $0.16 |

Plan figures assume every credit is used. Pro's 300 credits equal 5 hours of source video, about one or two long streams monthly.

### Inferences
- The strongest pricing pitch is against metering of long VODs. It is weaker against Eklipse's flat rate, so CutCut's comparison should not assume all rivals use credits.
- BYOK adds setup friction, and BYOK and local tools are an existing niche among technical users. The market may be narrower than the pricing gap suggests. A simple key setup and a cost estimate before each run would reduce that friction.
- Privacy messaging must be precise: as the open-source projects show, "local" usually covers rendering while transcripts still reach the LLM provider.

### Gaps
- **OpenAI transcription pricing could not be verified**: the pricing page returned 403.
- **LLM cost per stream was not established.** No current token prices were sourced, so the table covers transcription only.
- No survey or creator testimony found on willingness to adopt BYOK, or on privacy expectations among gaming creators.

## Publishing: YouTube Shorts rules, monetisation policy, and own-stream clips

### Takeaway
Shorts can run to three minutes if square or vertical. Current policy text targets mass-produced, template-driven content and reused content without added value. The text read does not settle how clips of a creator's own stream are treated. Safe-zone figures are unofficial and inconsistent.

### Cited Findings
- "Any videos uploaded on or after [15 Oct 2024] with a square or vertical aspect ratio up to three minutes in length will be categorized as Shorts" — [YouTube Help, Snippet](https://support.google.com/youtube/answer/15424877?hl=en). A wider ratio such as 16:9 keeps a video out of Shorts — [same page](https://support.google.com/youtube/answer/15424877?hl=en).
- Inauthentic content (renamed from "repetitious content" on 15 Jul 2025) covers "AI-generated content made with generic or unoriginal templates giving the impression of mass production". The same intro and outro is fine if "the bulk of your content is different" — [YouTube monetization policies, Fetched](https://support.google.com/youtube/answer/1311392).
- Reused content reviews "commentary, clips, compilations, and reaction videos". Disallowed examples include "Clips of moments from your favorite show edited together with little or no narrative" and "Short videos you compiled from other social media websites". It "applies even if you have permission from the original creator" — [same page, Fetched](https://support.google.com/youtube/answer/1311392).
- Blogs describe an October 2026 Shorts change favouring original over reposted content — [Mark Studios, Snippet](https://www.markstudios.com/blog/youtube-shorts-original-content-update-2026). An August 2026 Partner Program overhaul appears in a single site — [air.io, Snippet](https://air.io/en/monetization/youtube-monetization-policy-changes-2026-a-complete-dated-timeline). **Both are unconfirmed against official sources.**
- Safe zones: all sources agree on 1080×1920. Bottom-exclusion estimates range from 180px to 390px, right edge 80 to 96px, top about 120px — [Reap](https://reap.video/blog/short-form-video-safe-zones), [Pixotter](https://pixotter.pages.dev/blog/youtube-shorts-size/), [wildandfreetools](https://wildandfreetools.com/blog/vertical-video-safe-zones-guide-2026/) (Snippets, unofficial; individual figures were not tied to specific pages).

### Inferences
- The likelier risk for CutCut users is the inauthentic-content language: many near-identical Shorts in one template. Caption style variety and human review before publishing are reasonable mitigations, but no text says they are sufficient.
- Designing to the conservative end of the safe-zone range (about 300 to 390px bottom, 100px right, 120px top) and adding a preview overlay is low-cost.

### Gaps
- **Whether clips of a creator's own stream are at risk is not answered by the text read.** The extract does not expressly address a creator's own material.
- No official YouTube safe-zone specification was found.

## Legal and platform risk of yt-dlp in a product; OAuth and API access

### Takeaway
YouTube's Terms bar downloading and automated access without authorization, and the API policies separately bar API clients from downloading or caching audiovisual content without written approval. No court or YouTube statement specific to commercial yt-dlp products was found. OAuth gives channel owners legitimate access to captions and retention data, but no official route to source-video download was confirmed.

### Cited Findings
- You are not allowed to "access, reproduce, download, distribute" any part of the Service or Content except as expressly authorized or with prior written permission from YouTube and, where applicable, rights holders. You may not "access the Service using any automated means (such as robots, botnets or scrapers)" — [YouTube Terms, dated 5 Jan 2022, Fetched](https://www.youtube.com/static?template=terms).
- API clients must not "download, import, backup, cache, or store copies of YouTube audiovisual content without YouTube's prior written approval" (III.E.1.a), or "separate, isolate, or modify the audio or video components of any YouTube audiovisual content" (III.I.7) — [YouTube API Developer Policies, Fetched](https://developers.google.com/youtube/terms/developer-policies).
- Also from those policies: users "must have final control over the data that will be published" (III.C.3); deletion on request "within 7 calendar days" (III.E.4.g); non-analytics Authorized Data generally refreshed or deleted within 30 days; analytics may be stored longer with re-authorization checks every 30 days — [same page](https://developers.google.com/youtube/terms/developer-policies).
- Captions download requires `youtube.force-ssl` or `youtubepartner`, "requires the user to have permission to edit the video", and costs 200 quota units per call — [Data API, Fetched](https://developers.google.com/youtube/v3/docs/captions/download).
- The audience retention report requires the `elapsedVideoTimeRatio` dimension and a `video` filter that "must specify a single video ID", with metrics including `audienceWatchRatio`, `relativeRetentionPerformance`, `startedWatching` and `stoppedWatching` — [Analytics API channel reports, Fetched](https://developers.google.com/youtube/analytics/channel_reports). Metric definitions: [Analytics metrics, Fetched](https://developers.google.com/youtube/analytics/metrics).
- Commentary, not legal authority: blogs separate the legality of the tool from its use, and flag commercial products built on scraped video as the high-risk case — [Tunelio](https://tunelio.dev/blog/is-yt-dlp-safe/), [audioutils](https://audioutils.com/blog/is-yt-dlp-legal). One GitHub contributor warned of store removal and legal action for a Play app using a yt-dlp library — [GitHub issue, 2024, Snippet](https://github.com/yausername/youtubedl-android/issues/271).

### Inferences
- Combining an approved OAuth API client with yt-dlp in the same product creates tension with III.E.1.a and III.I.7. Those are terms of the API relationship, so a policy audit could put API access at risk. Worth counsel's review before OAuth verification.
- Lower-exposure designs to evaluate: run the download on the user's own machine (a local tool rather than a hosted server), or accept a user-supplied file. Neither removes the Terms text. Restricting to a verified channel owner helps with rights in the content, but the Terms text cites permission from YouTube as well.
- Retention data is a strong owner-only signal, since only the audience retention report is keyed to points in the video.

### Gaps
- **Official source-video download for owners.** No Data API endpoint was confirmed in this session. From prior knowledge, and unverified here, the Data API has none, and YouTube Studio offers owners a manual download.
- **Chat replay access.** The official API appears not to serve ended chats. From prior knowledge, unverified here, yt-dlp can retrieve `live_chat` replay data; it would fall under the same Terms text.
- **Retention granularity.** From prior knowledge, unverified here, `elapsedVideoTimeRatio` has about 100 buckets, which would be roughly 2.4 minutes per bucket on a 4-hour VOD. That would make it a coarse signal. Test on a real channel.
- No 2026 rulings or YouTube statements on commercial yt-dlp use were found. Jurisdiction-specific and DMCA anti-circumvention analysis was not found and needs counsel.
