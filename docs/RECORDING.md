# Recording procedure — the perfect take

Step-by-step delivery procedure for the demo video. Timings match [captions.srt](captions.srt) (20 captions, 2:32); the shot plan rationale is in [VIDEO.md](VIDEO.md). Everything runs against the **live hosted deployment** — no local servers needed.

## Phase 0 — Setup (10 minutes before)

1. **Kill distractions.** Windows Settings → System → Focus assist → *Alarms only*. Close Slack/Discord/email. Hide the bookmarks bar (`Ctrl+Shift+B`).
2. **Warm the servers.** Open https://tollbooth-gljd.onrender.com now and again right before recording (free tier sleeps after ~15 min idle; ~30s wake). Open https://tollbooth-docs.onrender.com once.
3. **Prepare 4 browser tabs, in this order** (switch with `Ctrl+Tab` during the take):
   1. `https://tollbooth-gljd.onrender.com` — marketplace home
   2. `https://tollbooth-gljd.onrender.com/listing/sentimentscan` — listing page
   3. `https://tollbooth-gljd.onrender.com/dev` — developer dashboard
   4. `https://tollbooth-docs.onrender.com/sdks` — portal SDK page

   Zoom ~125% (`Ctrl +`). Stay on tab 1.
4. **Prepare the terminal.** Windows Terminal, dark theme, font bumped (`Ctrl+=` ×3–4). `cd C:\Users\Victor\tollbooth`, `cls`. Browser and terminal side by side, half screen each.
5. **Test the recorder.** Xbox Game Bar: `Win+G` once, then `Win+Alt+R` → 5s → `Win+Alt+R`. Watch the clip (Videos → Captures): both windows visible, text legible. Fallback: OBS Studio with one Display Capture scene.
6. **Dry run** (no recording): the two commands from Beat 4–5 below, once, to learn the pauses. The demo run takes ~15–25s; its caption window is 44s.

## Phase 2 — The take (2:32)

Start recording, count 2 seconds of silence, begin. Captions carry the message — the only job is the right thing on screen at the right time, unhurried.

| Beat | Captions | Time | Action |
|---|---|---|---|
| 1 | 1–3 | 0:00–0:20 | Marketplace home. Do nothing. Establish shot. |
| 2 | 4–6 | 0:20–0:41 | `Ctrl+Tab` → listing page. Sit 3s, scroll slowly to the context-file section, hold ~5s (the "aha" shot), continue to pricing. |
| 3 | 7 | 0:41–0:47 | `Ctrl+Tab` → portal SDK page. Hold 6s — C#/TypeScript/Python tabs visible. |
| 4 | 8–9 | 0:47–0:59 | Click terminal. **Type** (don't paste): `# Mission: find a sentiment API, run 3 calls, stay under $5` |
| 5 | 10–15 | 0:59–1:43 | Type and run `TOLLBOOTH_URL=https://tollbooth-gljd.onrender.com npm run demo`. Watch with the audience; pause the cursor 2s on `Created PayPal order …` and on `Payment captured ✓`; let the three `[billed 2 credits]` lines scroll. |
| 6 | 16–17 | 1:43–1:59 | Browser → `/dev` tab → `F5`. Hover the charts slowly. |
| 7 | 18 | 1:59–2:05 | Stay on the dashboard. Stillness. |
| 8 | 19–20 | 2:05–2:32 | Stop recording. |

**Fumbles:** pause the recording, fix, resume, cut the gap in edit. Restart the take only if the demo errors or the site hangs (warm the URL, go again from Beat 1).

## Phase 3 — Post-production (20 minutes)

7. **Trim** leading/trailing dead air and pauses. Target ≤ 2:50, hard ceiling 3:00.
8. **Burn captions** (CapCut desktop, free): import clip → for each of the 20 SRT captions add a text box (Text → Default), bottom-center, white bold ~6% frame height, semi-transparent black background, in/out times from the SRT. Watch once at 1× to confirm caption-over-shot alignment.
9. **Upload** to YouTube as **Public**. Title: `Tollbooth — APIs with a cash register for AI agents (PayPal AI Hackathon)`. Then YouTube Studio → Subtitles → English → upload `captions.srt`.
10. **Submit** on Devpost; paste the video URL into the form and `docs/SUBMISSION.md`.

## The three rules

1. **Slow is confident** — every caption has 6–9 seconds; when in doubt, hold still.
2. **One action per caption** — switch window, settle, next.
3. **The cursor points, it doesn't wander** — park it next to the line that just printed.
