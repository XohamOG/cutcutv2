# Evidence on which signals predict a good gaming or livestream highlight

Evidence tags: **[PR]** peer-reviewed venue. **[Thesis]** examined PhD thesis. **[Preprint]** arXiv or working paper, peer review not confirmed. **[Course]** student project. **[Platform]** the platform's own statement. **[Vendor]** blog or tool marketing, unverified. **[NG]** result comes from non-gaming video. Unless marked otherwise, numbers were read from the source's full text. "Snippet only" means I saw only an abstract or search excerpt.

## Which factors have the strongest evidence for gaming streams specifically, and which transfer poorly?

### Takeaway
The best-supported gaming signals are video with temporal context, audio, and chat volume or content that has been shifted back to correct for reaction lag. Almost all of the quantitative evidence comes from League of Legends and Dota esports broadcasts, so it may not carry over to single-creator streams. Facecam emotion, sentiment, kill-feed OCR, Twitch clip counts, timestamped comments and hook timing have little or no gaming-specific quantitative validation.

### Cited Findings

#### Chat: velocity, content and repetition
- **Predictive value, deep chat model vs video.** Fu et al. tested on LoL esports (321 videos: 218 NALCS, 103 LMS; 30 to 50 minutes each; about 7,490 chats per video; labels from community highlight reels). Test F-scores: chat only 43.2 (NALCS) and 39.7 (LMS); video only 72.2 and 69.2 — [Fu et al. 2017, EMNLP, PR](https://ar5iv.labs.arxiv.org/html/1707.08559).
- **Message density alone is weak.** On LoL Worlds data, Ringer's Density baseline gets F1 0.190 (P 0.212, R 0.173). The char-LSTM gets 0.300, TASTE Small 0.314 and TASTE (a temporal transformer over chat) 0.416, all before offset correction — [Ringer 2022, Table 5.4, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Simple features can still do well for top-K retrieval.** LIGHTOR uses logistic regression on message count, length and similarity in 25-second windows. It reports Chat Precision@10 of 0.82 from one labelled training video, and end-to-end Precision@K of 70 to 90% on Dota 2 (60 videos) and LoL (173 videos) — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201). Precision@K on the top few peaks and frame-level F1 measure different things, so these numbers do not contradict Ringer's 0.19.
- **Repetition.** Ringer describes a "cheering" effect in esports chat, where a small set of tokens is used rapidly and repeatedly. This may be why a density model and a content-only model perform almost the same (F1 0.190 vs 0.182) — [Ringer 2022, Ch. 5, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). LIGHTOR's message-similarity feature is the closest tested measure of copypasta — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201).
- **Emotes.** Emotes need their own preprocessing. Ringer lemmatises emote variants (for example, Kappa variants) and reports that non-standard tokens rule out pretrained vectorisation. TwitchChat shrinks from 1,658,055 to 10,011 unique tokens after cleaning — [Ringer 2022, Ch. 5, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). The same thesis cites Kobs et al. for the sentiment value of emotes (secondary citation; not read).
- **Lag calibration matters more than most model choices.** Shifting TASTE's output by -15 s raises F1 to 0.529, and adding iterative thresholding at offset -17 s gives 0.539, against 0.416 uncorrected. Positive offsets hurt — [Ringer 2022, Fig. 5.20-5.21, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Estimates of lag differ.** LIGHTOR learns a peak-to-start constant of 23 to 27 s. It stayed stable as training videos varied, and it beat an uncorrected volume method (Toretter, below 20% precision) by about 3x — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201). Ringer's best offset is -15 s. Fu et al. simply use the next 7 s of chat, with no explicit correction — [Fu et al. 2017, PR](https://ar5iv.labs.arxiv.org/html/1707.08559). LIGHTOR argues a learned offset is what lets it beat Chat-LSTM even with 123 labelled videos — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201).
- **Small chat.** LIGHTOR states it needs more than 500 chat messages per hour, and more than 100 viewers for its seek-data stage. Over 80% of 200 recent VODs from top-10 Dota channels met the chat bar — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201). That sample is drawn from top channels, so it says nothing about typical small streamers.
- **Per-stream variance.** TASTE's per-video F1 ranges from 0.074 to 0.719, wider than visual (0.377 to 0.613) — [Ringer 2022, Table 6.2, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Failure modes.** Chat is often off-topic, so LIGHTOR treats it as noisy implicit feedback — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201). Chat also responds to crowd energy unrelated to the game: some matches attract "particularly vocal audiences" — [Ringer 2022, Ch. 6, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). The shortest clips may lack enough chat to use at all — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439).
- **Compute and cost.** TASTE runs at about 0.0167 s per sample with about 27.87 MB of inference memory. Ringer calls it easily real-time — [Ringer 2022, Table 5.12, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). LIGHTOR's logistic regression trains in seconds on a labelled video — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201).
- **Sentiment.** A student's public comment describes sentiment alone as "too naive", which is opinion rather than evidence — [Reddit, r/TwitchMains](https://cal1.lr.ggtyler.dev/r/TwitchMains/comments/1hzhtjm/real_time_highlight_detection_application/m78e7bm/?context=3). In a course project, GPT excitement ratings on chat windows came with an admitted lack of thorough evaluation — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).

#### Audio: energy, events and separation
- **Audio is the best single modality on LoL esports.** With a 3D-CNN ranking model (257 broadcasts, 193+ h; 676 highlight videos, 178+ h; test 20 games, 18 h 6 min), mean AP was Audio 0.366, Flow 0.335, RGB 0.328, Frame 0.151 and Random 0.118. Audio's lead over RGB and Flow is small and the models are described as similar — [Ringer et al. 2022, MLwA, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).
- **Audio falls behind on a cross-setting test.** On Worlds data, Audio F1 is 0.432, below Visual 0.506 and TASTE 0.534. Ringer warns that TASTE was fine-tuned on Worlds group games and the audio-visual models were not, so this comparison is not a verdict on which modality is better — [Ringer 2022, Ch. 6, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Audio on personality streams is noisy.** On PUBG streams, the audio-only model produced far more clips (126, compared with 94 to 98 for other inputs). Only 56% were rated highlights, and the author attributes the excess to in-game audio such as gunfire — [Ringer 2022, Table 3.2, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Commentator voice is a known esports cue.** Commentators scream during highlight moments — [Song 2016, Preprint](https://arxiv.org/pdf/1611.08780). Audio's per-video range is wide (F1 0.178 to 0.699), which Ringer links to commentary style — [Ringer 2022, Ch. 6, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Cost.** Audio feature extraction costs 0.013 s per sample, against 0.215 s for RGB and 0.298 s for optical flow — [Ringer 2022, Table 4.10, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Voice affect.** Roohi et al. combine facial expression, transcript sentiment, voice emotion, pitch and loudness for game-stream emotion annotation. They reach up to 70.7% accuracy, on par with human inter-rater agreement, and 80.4% for detecting each video's 5 most intense events — [Roohi et al. 2019, CHI PLAY, PR, snippet only](https://www.bohrium.com/scholar/T2293348/Shaghayegh_Roohi). This measures emotional expression, not highlight quality.
- **YAMNet.** It predicts 521 AudioSet classes, including laughter, on 0.96 s frames with a 0.48 s hop, and provides 1,024-dimensional embeddings for downstream classifiers — [TensorFlow docs](https://www.tensorflow.org/tutorials/audio/transfer_learning_audio). I found no evaluation of it for game highlights.
- **Separation (Demucs) has mixed evidence, none of it on game audio.** On broadcast TV ASR, keeping only the vocal stem gave no WER gain at first, and it helped only in roughly the -5 to 5-8 dB SNR range — [BCN2BRNO, Preprint, NG](https://arxiv.org/pdf/2101.12729). Emilia-Pipe reports a modest, mixed effect — [Emilia, Preprint, NG](https://arxiv.org/pdf/2501.15907). Sommelier runs Demucs only on music-flagged segments because separation can damage speech — [Sommelier, Preprint, NG](https://arxiv.org/pdf/2603.25750).
- **Separation failure mode.** Standard cinematic separators often fail on laughter and screams, treating them as effects instead of speech. These are the vocalisations a highlight detector most needs — [DnR-nonverbal, Preprint, NG](https://arxiv.org/html/2506.02499v2).

#### Speech and transcript
- **Quantified stream evidence is thin.** Removing the text input from KuaiHL (ASR and comments) lowers Kendall's tau by 2.01%, compared with 4.72% for removing visual — [KuaiHL, Preprint, general live streaming on Kuaishou, gaming share not stated](https://arxiv.org/pdf/2407.12002).
- **LLM scoring of commentary.** A Korean thesis has an LLM score segments using commentary text plus audio volume, with no per-sport retraining. I saw no F1 — [UNIST repository, Thesis, sports, NG, snippet only](https://scholarworks.unist.ac.kr/handle/201301/84184).
- **Context dependence.** In one course project, adding "Twitch streamer playing League of Legends" to a GPT prompt produced a better rating for a Flash-usage transcript, because game knowledge changed its importance. This is anecdotal — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).
- **Streamer preference.** In the same project, streamers said they prioritise substantive and educational verbal content — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).

#### Vision: events, HUD, scene and motion
- **Temporal video features far outperform single frames.** Mean AP was RGB clips 0.328 and Flow 0.335, against 0.151 for single-frame features, close to the random baseline of 0.118 — [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).
- **Scene filtering first is high value and cheap.** Yahoo's two-stage cascade (scene type, then highlight) on about 300 h of HotS, LoL and Dota 2 gets AP 83.18 / 59.66 / 67.90 respectively, and runs at 18 FPS on one CPU. Scene classification itself exceeds 99% AP and recall. Labels came from one editor — [Song 2016, Preprint](https://arxiv.org/pdf/1611.08780).
- **Per-game event models are accurate but do not measure highlight quality.** Fine-tuned X-CLIP classifies one-second clips into FPS events with 94.3% test accuracy overall: CS:GO 95.0%, Valorant 95.0%, PUBG 90.9%, Overwatch 2 89.7% and Fortnite 87.6%, with Fortnite's F-score only 0.69 — [X-CLIP gameplay, Preprint](https://arxiv.org/pdf/2505.07721).
- **Kill detection transfers poorly to an unseen game.** On one 20-minute Apex Legends video, kill accuracy was 69.0%, death 100% and background 96.7%, using a tolerant 3-second window — [X-CLIP gameplay, Preprint](https://arxiv.org/pdf/2505.07721).
- **Kills are harder than deaths because deaths have obvious UI transitions** — [X-CLIP gameplay, Preprint](https://arxiv.org/pdf/2505.07721). Ringer found the same pattern: the greyscale `Dead' screen is easiest (F1 up to 0.948) — [Ringer 2022, Ch. 3, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Cost of event model.** Quantised to 192 MB, accuracy falls from 94.3% to 92.9%. Running alongside gameplay cost a 13 FPS drop on a workstation GPU, and fine-tuning took about 13 h 20 min — [X-CLIP gameplay, Preprint](https://arxiv.org/pdf/2505.07721).
- **OCR and metadata.** The X-CLIP authors claim OCR and game-engine methods are costly and generalise poorly across games and languages, but give no measurement — [X-CLIP gameplay, Preprint](https://arxiv.org/pdf/2505.07721). A CS:GO killstreak system found inaccurate metadata timestamps made detection "almost unusable" — [MediaEval 2018](https://ceur-ws.org/Vol-2283/MediaEval_18_paper_43.pdf).
- **Post-processing is worth as much as a modality.** Gaussian smoothing lifts hybrid mean AP from 0.462 to 0.511, statistically significant — [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).
- **Video-only on personality streams is the worst predictor.** On PUBG, 70% of game-only clips were rated "no highlight" — [Ringer 2022, Table 3.2, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).

#### Facecam
- **In-the-wild affect is hard.** On 10 LoL streamers (10 h, 7,200 five-second clips), the best F1 was 0.362 for positive valence and 0.286 for negative. Random baselines are 0.106 and 0.044 — [Ringer et al. 2019 / Thesis Ch. 3, Preprint](https://arxiv.org/pdf/1905.13694).
- **Facecam adds value for social and funny moments.** On PUBG, face plus audio gave 74% highlights and all modalities 77%, against 52% for face alone. Face is better for funny and interaction clips and has worse precision on action. Sample: two streamers, 11 videos, about 95 clips per condition, using unsupervised novelty detection — [Ringer 2022, Tables 3.1-3.2, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Failure mode.** Unusual gestures and face occlusion produce false "novelty" — [Ringer 2022, Ch. 3, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). Off-the-shelf FER is weak on streams: 45 to 55% on 61 hand-labelled stream screenshots, with DeepFace at 49% — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).
- **Non-highlight facial evidence.** Landmark features separate boring from stressful periods for 5 of 7 features, but no highlight task was tested — [Bevilacqua et al. 2018](https://doaj.org/article/126fa3f55b6d47b1bb1efd37093326ea).

#### Viewer behaviour
- **Most Replayed labels are large-scale and reusable.** Mr. HiSum has 31,892 videos with labels aggregated from over 50,000 users per video, under CC BY 4.0. The authors validate the labels via cross-dataset transfer and a user study — [Mr. HiSum, NeurIPS 2023 D&B, PR, abstract only](https://proceedings.neurips.cc/paper_files/paper/2023/hash/7f880e3a325b06e3601af1384a653038-Abstract.html); [GitHub](https://github.com/MRHiSum/MR.HiSum).
- **Benchmarks on it (mAP at rho 15% / 50%)**: SL-Module 24.95 / 58.63, PGL-SUM 27.45 / 61.60, SummDiff 33.83 / 65.44, TRINITY 40.98 / 69.06 — [TRINITY, Preprint, NG](https://arxiv.org/pdf/2608.29577).
- **Coverage limit.** The heatmap appears only after enough viewing data. One scraper vendor says at least 50K views, and vidIQ says tens of thousands, but neither is official (both from search excerpts) — [Apify, Vendor](https://apify.com/karamelo/youtube-most-replayed-scraper-heatmap-extractor); [vidIQ, Vendor](https://vidiq.com/ru/blog/post/most-replayed-scenes-youtube-video). Values are relative within a video — [Apify, Vendor](https://apify.com/karamelo/youtube-most-replayed-scraper-heatmap-extractor).
- **Seek and play logs refine boundaries.** LIGHTOR's crowd of about 500 AMT users improved start and end precision over iterations and beat SocialSkip and Moocer. It needs over 100 viewers and access to player interaction data — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201).
- **Behaviour-trained models work in production.** KuaiHL predicts per-segment long-view-through rate on 17,897 live rooms (19,334 h), with tau 0.5961 against 0.5782 to 0.5848 for baselines. A 4-day A/B test gave +2.9% CTR and +5.9% live play duration — [KuaiHL, Preprint](https://arxiv.org/pdf/2407.12002). The A/B outcome concerns ranking live rooms, not clip quality.
- **Community highlights are usable weak labels.** Fu et al., Ringer et al. and LIGHTOR all align fan-made reels to broadcasts — [Fu et al. 2017, PR](https://ar5iv.labs.arxiv.org/html/1707.08559); [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).

#### Game state and stakes
- **Late surprise predicts perceived quality.** Viewers of LoL S10 reported live win belief and rated games. The amount of surprise at the end of the game played a dominant role in predicting the rating — [Huang et al. 2021, Preprint](https://arxiv.org/abs/2106.02851).
- **Uncertainty effects vary by title.** A 10% drop in absolute win-probability difference goes with +3% viewership in CS:GO, with no evidence of the effect in Dota 2. Superstars add 18 to 19% in CS:GO — [Patten 2021, Preprint](https://joepatten.github.io/assets/blog/ESPORTS_Viewership.pdf). This measures match viewership, not moments.
- **Kills and closeness.** Online LCK viewers prefer games with more kills and a closer kill difference — [Determinants of LCK viewership, snippet only](https://pure.seoultech.ac.kr/en/publications/determinants-of-online-live-esports-viewership-with-advanced-data/).
- **Win-probability models exist for computing it.** One CS:GO framework was built on over 70 million events — [Xenopoulos et al. 2020, Preprint, abstract only](https://arxiv.org/abs/2011.01324).
- **VLMs can read the state.** Gemini 2.5 Pro identified a 12-6 match-point score and an "eco upset" narrative in a CS2 clip, while earlier models did not — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439).

#### Short-form performance
- **Platform statements are limited.** YouTube says user satisfaction surveys help its systems understand satisfaction, "not just watch time" — [YouTube Help, Platform](https://support.google.com/youtube/answer/16089387?hl=en).
- **Raw watch time is confounded by length.** Recommenders pick up and amplify a bias toward longer clips — [DVR, Preprint, NG](https://arxiv.org/pdf/2208.05190). D2Q deconfounds with within-duration quantiles and reports live deployment on Kuaishou — [D2Q, Preprint, NG](https://export.arxiv.org/abs/2206.06003).
- **Payoff placement.** The only rigorous gaming-adjacent evidence I found is the end-weighted surprise result above — [Huang et al. 2021, Preprint](https://arxiv.org/abs/2106.02851).
- **Vendor hook claims carry no usable data.** One clipping vendor states that "50-70% of viewers who will leave your video do so within the first 1-2 seconds", attributing it only to unnamed "platform analytics" — [ClipSpeed, Vendor](https://www.clipspeed.ai/blog/hook-first-second-video-retention.html). Another describes the typical curve as a cliff in the first two to three seconds, a gentler slide, and a small end bump if the clip loops, with no data source or sample size — [AutoClip, Vendor](https://autoclip.dev/blog/viral-clip-anatomy-3-second-hook-data). Treat both as practitioner opinion.

#### Personalisation and learned ranking
- **Generic vs personalised.** PHD-GIFs (13,822 users; 850 test users): mAP rises from 15.86% to 16.68% and Recall@5 from 28.42% to 30.71%. One prior video already beats the generic model, and gains had not plateaued at the longest histories — [Garcia del Molino & Gygli 2018, ACM MM, PR, NG](https://ar5iv.labs.arxiv.org/html/1804.06604). The absolute gain is small. The signal is GIF-creation history, not clicks or accept/reject decisions.
- **Streamer ID in a live model.** Removing the item input (apparently the ID embedding, which is my reading of the ablation table) lowered Kendall's tau by only 0.51% in KuaiHL — [KuaiHL, Preprint](https://arxiv.org/pdf/2407.12002).
- **Very little labelling can be enough for simple models.** LIGHTOR's chat model reached 0.82 Precision@10 from a single labelled video — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201).
- **Pairwise ranking suits this problem.** The ranker beat classifiers at deployment thresholds (F1 0.521 vs 0.343) — [Ringer 2022, Table 4.9, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Highlights depend on perspective.** TRINITY argues this and trains separate event, emotion and nature tracks. On Mr. HiSum it reports +7.15 / +3.62 mAP (rho 15% / 50%) over the prior best — [TRINITY, Preprint, NG](https://arxiv.org/pdf/2608.29577).

### Inferences
- Ranking of evidence for gaming, strongest first: (1) temporal video plus audio on esports; (2) chat with lag correction; (3) fan-reel or replay-derived labels for training; (4) late-game surprise for ordering; (5) facecam for personality streams only; (6) everything else is engineering judgement.
- Transfer risks: audio models trained with casters may not transfer to single-streamer VODs, because the signal changes from commentator excitement to streamer speech mixed with game sound. Kill-feed and event models need per-game work, and kill detection degrades on unseen titles. Most Replayed is suited to training labels and cannot serve as a feature for fresh uploads below the view threshold.
- Chat offset should be calibrated per platform or per stream. The range across the studies (7 to 27 s) suggests no single constant is safe. The -15 s versus 23 to 27 s difference may reflect peak-to-start definitions and context.
- The single-frame result (mean AP 0.151 against 0.328 to 0.335 for clips) suggests sparse-frame VLM judging may lose substantial signal unless frames are dense or audio is included. No study tests this directly on VLMs.
- Separation is justified mainly by the audio-only gunfire false positives, but laughter and scream loss is a direct risk. A sensible test is to compare event scores on raw and separated audio, not to assume separation helps.

### Gaps
- No gaming-stream F1 found for: emote type (emote-specific features), sentiment, unique-author counts, or kill-feed OCR.
- No published evaluation found of PANNs, or of Demucs on game soundtracks, or of laughter detection as a highlight predictor.
- No study found validating Twitch clip creation counts, clip timestamps, chapters or timestamped YouTube comments as highlight signals. Searches returned only tools and projects.
- No peer-reviewed study found on hooks, loopability, narrative arc or length for gaming Shorts. TikTok's own explainer could not be retrieved (HTTP 503), so its wording on completion signals is unverified.
- Widely repeated figures could not be traced to a source and are excluded: "84% of final views predictable from 3-second retention", "70-85% early retention gives 2.2x views", and "retention curves re-converge by 10 s". They surfaced in search summaries, but the pages I could open did not contain them (one page returned 404).
- Third-party guides reportedly say YouTube publishes no official swipe-away or retention thresholds. I could not open the page (HTTP 403), and I found no YouTube statement either way.
- No study found of learning a gaming creator's style from accepted and rejected clips, and no click-based learning-to-rank study for clip selection in gaming.
- Scene change as a stand-alone predictor has no reported gaming number beyond its use as a filter.
- No study found validating comeback or match-point detection as a highlight selector.
- The Mr. HiSum paper's own benchmark tables and gaming-category share could not be read (site unreachable). Baselines above come via TRINITY's table.

## Does multimodal fusion beat chat-only or audio-only, by how much? Which fusion methods work (weighted sum, learning to rank, transformers)?

### Takeaway
Yes, consistently on esports. Fusing audio, visual and chat gave F1 0.642, against 0.432 to 0.534 for single modalities. The gain over the best video model can be small, however: 2.5 points of F-score in Fu et al. Simple late or model fusion works well. Ranking beat classification when thresholds were set for deployment.

### Cited Findings
- **Three-way fusion on LoL Worlds.** F1: Audio 0.432, Visual 0.506, Auto-Highlight (A+V) 0.540, TASTE (chat) 0.534, Audio+Text 0.593, Visual+Text 0.624, Audio+Visual+Text 0.642. AVT is +48.6% over audio, +26.9% over visual and +20.2% over chat — [Ringer 2022, Table 6.1, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Caveat on that result.** The author states the study does not claim audio-visual is better or worse than chat, because TASTE was fine-tuned on Worlds group-stage games and the audio-visual models saw no Worlds data — [Ringer 2022, Ch. 6, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Why fusion helps.** Audio and chat models are the least correlated pair, and the author suggests their errors rarely coincide. Worst-case per-video F1 rises to 0.410 for AVT, against 0.178 for audio and 0.074 for chat — [Ringer 2022, Ch. 6, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Chat plus video vs video alone.** LV-LSTM test F: 74.7 vs 72.2 (NALCS) and 70.0 vs 69.2 (LMS), against 43.2 and 39.7 for chat only — [Fu et al. 2017, PR](https://ar5iv.labs.arxiv.org/html/1707.08559).
- **Audio-visual fusion.** Mean AP: RGB+Audio model fusion 0.444, RGB+Flow+Audio hybrid fusion 0.462 (0.511 with Gaussian smoothing), against best single modality 0.366. Hybrid fusion was nearly double some prior multimodal baselines (RGB+Audio+Frame model 0.264) — [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).
- **Fusion placement.** For joint affect and game-context tasks, fusing after temporal modelling improved with joint learning (+0.044 and +0.026 F1), while early fusion degraded by -0.036 — [Ringer 2022, Ch. 3, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Learning to rank vs classification.** At a fixed 12.5% selection threshold, ranker F1 was 0.521 (P 0.488, R 0.559), against classifier 0.343 and weighted classifier 0.131 (P 0.559, R 0.074). Mean AP was similar (0.511 vs 0.499) — [Ringer 2022, Tables 4.8-4.9, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Transformers.** KuaiHL's streamer-personalised Perceiver-style transformer reached tau 0.5961, against 0.5782 to 0.5848 for prior methods, a small absolute gain — [KuaiHL, Preprint](https://arxiv.org/pdf/2407.12002). TASTE, a temporal transformer over chat, more than doubled density's F1 (0.416 vs 0.190) — [Ringer 2022, Table 5.4, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Cost of fusion.** Feature extractors dominate cost. The decision network takes 0.004 s per sample and 2.7 MB in the small case, against over 1300 MB for extractors — [Ringer 2022, Ch. 4, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). A few minutes per video on consumer hardware was reported — [Ringer 2022, Ch. 4, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).

### Inferences
- Fusion's main practical benefit may be robustness, not peak score: the worst-video F1 rises sharply. That matters for a product serving many streamers.
- Late fusion of separately trained models is a sensible default, because it worked well with fixed weights and lets the system run when a modality is missing (no chat, no facecam).
- Lag correction, smoothing and thresholding each moved F1 or AP about as much as adding a modality. They should be built before any complex fusion architecture.

### Gaps
- No head-to-head comparison found of weighted sum, gradient-boosted learning to rank and transformer fusion on the same gaming dataset.
- All three-way fusion numbers come from one esports dataset (LoL Worlds). I found no such result for personality streams.

## Do personality-driven streams differ from game-driven ones (see Ringer's York PhD thesis and related work)?

### Takeaway
Probably yes in which signals matter, but the evidence is indirect. Game footage alone is the worst predictor on personality streams and competitive on esports. Ringer himself says the two formats share "minor differences", mainly the webcam, and no study compares them under matched conditions.

### Cited Findings
- **Thesis framing.** Ringer distinguishes the two, and develops methods for each from the same audio, visual and text foundations — [Ringer 2022, Thesis](https://etheses.whiterose.ac.uk/32406/).
- **Personality-driven (PUBG; two streamers; 11 videos; unsupervised novelty).** Share of generated clips rated highlights: Face+Game+Audio 77%, Face+Audio 74%, Audio 56%, Face 52%; 70% of game-only clips were non-highlights — [Ringer 2022, Table 3.2, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Game-driven (LoL esports; 20 test games).** Visual temporal models (mean AP 0.328 to 0.335) and audio (0.366) are similar in strength — [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf).
- **Highlight type mix.** Across all-modality PUBG clips, 26 funny, 25 action and 24 interaction clips were generated — [Ringer 2022, Table 3.1, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). About 92% of action clips and 69% of funny clips fall in the last half of a video, and 91% of second-half clips were interesting — [Ringer 2022, Ch. 3, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf). The author ties this to battle-royale design, so it may not generalise to other genres.
- **Author's conclusion.** The two formats "share minor differences", with the webcam as the primary one, handled by adding a visual input — [Ringer 2022, Ch. 7, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf).
- **Streamer preferences.** Streamers in one project valued verbal, substantive content — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).

### Inferences
- Personality-stream scoring should weight face and voice higher and treat game-event signals as corroboration, because action alone misses funny and social clips. On game-driven VODs, game events and caster audio can carry more weight.
- A product could classify a VOD's format, then choose weights accordingly. This is an untested recommendation.

### Gaps
- No controlled comparison with shared metrics, labels and games. The PUBG result uses human ratings on 2 streamers; the LoL result uses AP against fan reels.
- Nothing found on variety, IRL or "just chatting" formats.

## Are there public datasets (e.g. Twitch/LoL datasets, Han et al. 2017 EMNLP, GameStream, MR.HiSum for Most Replayed)?

### Takeaway
There are usable esports and viewer-replay datasets, but no large, current, multimodal public benchmark for personality-driven Twitch streams. "Han et al. 2017 EMNLP" appears to be a misattribution of Fu et al. 2017, and I could not find a dataset called GameStream.

### Cited Findings
- **Correction.** The EMNLP 2017 paper "Video Highlight Prediction Using Audience Chat Reactions" is by Fu, Lee, Bansal and Berg, not Han — [ACL Anthology](https://aclanthology.org/D17-1102/).
- **Fu et al. NALCS/LMS.** 321 LoL videos with community-reel labels, English and Traditional Chinese chat, frame-level — [Fu et al. 2017, PR](https://ar5iv.labs.arxiv.org/html/1707.08559).
- **LIGHTOR.** Dota 2 (60 videos, manually labelled, about 10 highlights each) and LoL (173 videos, about 14 highlights each), published on GitHub — [LIGHTOR, Preprint](https://arxiv.org/pdf/1910.12201); [repo](https://github.com/sfu-db/Lightor).
- **TwitchChat (Ringer).** 1,951 stream sessions, 666 streamers, 20 games, over 60 million tokens, June to October 2019, English-language channels. Median viewers 2,211. A footnote in that chapter links to an OSF deposit — [Ringer 2022, Ch. 5, Thesis](https://etheses.whiterose.ac.uk/32406/1/PhD_Thesis__Revised_.pdf); [OSF](https://osf.io/39ev7/). No highlight labels are described for this corpus.
- **Ringer LoL Worlds and autohighlight data.** 257 broadcasts and 676 highlight videos — [Ringer et al. 2022, PR](https://eprints.whiterose.ac.uk/186731/1/Highlight_Journal_MLwA_2_.pdf). Release status not confirmed.
- **Song 2016.** About 300 h of HotS, LoL and Dota 2 — [Preprint](https://arxiv.org/pdf/1611.08780). Release status not confirmed.
- **Ringer LoL streamer affect.** 10 streamers, 10 h, 7,200 five-second clips with affect and context labels — [Preprint](https://arxiv.org/pdf/1905.13694).
- **Mr. HiSum.** 31,892 videos; labels from Most Replayed; features from YouTube-8M; CC BY 4.0 — [GitHub](https://github.com/MRHiSum/MR.HiSum). General YouTube, not livestream-specific.
- **KLive.** 17,897 live rooms, 19,334 h; company approval and a signed agreement needed — [KuaiHL, Preprint](https://arxiv.org/pdf/2407.12002).
- **AntPivot/Anthighlight.** 3,256 live-stream records with ASR and binary labels — described in [KuaiHL, Preprint](https://arxiv.org/pdf/2407.12002).
- **PHD (gifs.com).** 13,822 users, 222,015 annotations, 119,938 YouTube videos — [PHD-GIFs, PR](https://ar5iv.labs.arxiv.org/html/1804.06604).
- **QVHighlights.** Query-driven highlights, standard for Moment-DETR and successors — [Lei et al. 2021, PR, NG](https://arxiv.org/pdf/2107.09609).
- **COHETS on Hugging Face.** Claims 65 streaming videos totalling 9,128 minutes, but the card is mostly placeholder text — [HF, unverified](https://huggingface.co/datasets/samjaylin/COHETS).
- **Access limit.** A 2024 project reports that Twitch rules restrict direct download of video and chat — [HiLAIT, Course](https://cs231n.stanford.edu/2024/papers/hilait-automatic-video-highlighting-system-leveraging-audio-text.pdf).

### Inferences
- Realistic training data for a clip product is a combination of LIGHTOR and Fu-style esports sets for evaluation, Mr. HiSum-style replay labels for pretraining, and the product's own accepted and rejected clips for personalisation.

### Gaps
- GameStream: no match in my searches. If the requester has a citation, it should be checked directly.
- Current availability of Fu et al.'s data and of Twitch VODs linked by older datasets was not verified; link rot is likely.

## How accurate are VLMs and LLMs at highlight detection as of 2025-2026?

### Takeaway
I found no published F1 or mAP for GPT, Gemini or Claude on gaming-stream highlight detection. On QVHighlights (non-gaming), purpose-built detectors still beat generative LLMs on saliency. For gaming clip understanding, Gemini 2.5 looks strong, but that evidence is summarisation quality on 56 clips, with 2.5 rated by one person.

### Cited Findings
- **QVHighlights test, highlight mAP / HIT@1** (a query-driven, non-gaming task): Moment-DETR 35.69 / 55.60; VTG-LLM 16.50 / 33.50; VideoChat-T 27.00 / 55.30; TempSamp-R1 30.00 / 57.60; BLIP-3 frame segmentation 34.48 / 56.74. Most generative LLM models report no highlight score at all — [Jiwanta & Purwarianti 2025, Preprint, NG](https://arxiv.org/pdf/2512.12246).
- **Purpose-built detector.** SG-DETR reaches 58.8 mAP and 71.0 HIT@1 on the QVHighlights test split and says it surpasses all existing methods, including LLM-based ones — [SG-DETR, Preprint, NG](https://arxiv.org/pdf/2410.01615).
- **Zero-shot pipeline.** Moment-GPT is listed at HIT@1 62.7 on a benchmark page. I did not confirm this against the paper — [HyperAI listing, NG](https://hyper.ai/en/sota/tasks/zero-shot-moment-retrieval/benchmark/zero-shot-moment-retrieval-on-qvhighlights).
- **Gaming clip summarisation.** Five Gemini models were rated on a 5-point Likert scale on 56 Twitch clips: CS 20, Variety 9, Dota 2 7, Path of Exile 2 7, WoW 6, Valorant 4, LoL 3. Mean scores per rater for Gemini 1.5 Flash ranged from 2.78 to 3.86. Gemini 2.5 Flash scored 4.42 and 2.5 Pro 4.80 — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439).
- **Limits of that study.** The 2.5 series was scored by one rater as a preliminary case study, without inter-annotator verification. Absolute scores varied by up to a full point across raters. The authors base their core arguments on qualitative evidence — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439). It is summarisation of already-selected clips, not detection of highlights in a VOD.
- **Modality finding.** Chat-only input was ineffective. Gemini 2.5 Pro could reach complete understanding from audio-visual input alone, while other models degraded without chat — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439).
- **Observed failures (older Gemini models).** Misattributing a triple kill to Faker because commentary and chat focused on him; confusing CS2 with CS:GO; stating an impossible bomb plant by a CT — [Lindroos et al. 2026, PR](https://jyx.jyu.fi/handle/123456789/109439).
- **Zero-shot CLIP-based highlight detection** on TVSum and SumMe shows mixed results, and the authors note mAP can be high even for random scores — [Byra et al. 2026, Preprint, NG](https://arxiv.org/pdf/2609.14790).

### Inferences
- A VLM is better positioned as a re-ranker, judge or explainer over a shortlist of candidates than as a full-VOD detector, given the absence of detection results, cost and the factual errors noted above. That is my inference; no study compares these designs.
- The multi-modal confusion failure suggests that VLM prompts should ask for on-screen evidence separately from chat or commentary claims.

### Gaps
- No published GPT-4o, GPT-5, Gemini or Claude vision F1 or mAP on any gaming highlight benchmark found.
- No cost or latency measurement of VLM judging on full-length VODs found.
