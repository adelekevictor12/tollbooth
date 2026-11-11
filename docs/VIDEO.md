# Tollbooth demo video — recording kit (no-voiceover edition)

Goal: **under 3 minutes**, public on YouTube, screen recording + burned-in captions, no narration. The caption track is ready in [captions.srt](captions.srt) — 20 captions, timed to the beats below (total 2:32).

## Before you hit record (5 minutes of setup)

1. **Clean slate for the dashboard:** stop the dev server, delete `app/data/tollbooth.db`, restart — the app re-seeds itself automatically (no old orders cluttering the charts).
   ```bash
   # terminal 1
   npm run dev
   # terminal 2 — the APIMatic developer portal (leave it running for the portal shot)
   npm run portal:serve
   ```
2. **Open three windows:**
   - Browser tab 1: `http://localhost:3000` (marketplace) and a second tab `/dev` (developer dashboard).
   - Browser tab 2: `http://localhost:23513` (the APIMatic developer portal — for the portal shot).
   - Terminal in `C:\Users\Victor\tollbooth`, font bumped up (Ctrl+= in Windows Terminal — captions and terminal both need to read well on a phone).
3. **Recording tool (pick one):**
   - **Xbox Game Bar** (built into Windows 10): `Win+Alt+R` starts/stops. No mic needed — that removes the #1 failure mode.
   - **OBS Studio** (free) if you want multiple windows captured in one scene with clean framing.
4. **Dry run:** do one full pass of the commands below before recording. Each `npm run demo` performs a real sandbox PayPal capture (sandbox money is unlimited).

## The shots (timings match captions.srt)

| Captions | Show / do |
|---|---|
| 1–3 (0:00–0:20) | Marketplace home page in the browser. Hold steady — the captions carry the message. |
| 4–6 (0:20–0:41) | Open the listing page (`/listing/sentimentscan`). Scroll slowly to the context-file section and hold on it ~5s — that's the "aha" shot (caption 5 explains it). |
| 7 (0:41–0:47) | Switch to the portal tab (`localhost:23513`). Show the SDKs page with the C#/TypeScript/Python tabs — visual proof of "Best Use of APIMatic" in one shot. |
| 8–9 (0:47–0:59) | Switch to the terminal, cursor ready. Type the mission as a comment so viewers can read it: `# Mission: find a sentiment API, run 3 calls, stay under $5` |
| 10–15 (0:59–1:43) | Type and run: `npm run demo` — let it run to completion. Key moments to leave on screen a beat longer: `Created PayPal order …` (caption 12) and `Payment captured ✓` (caption 13), then the three `[billed 2 credits]` lines (caption 15). |
| 16–17 (1:43–1:59) | Switch to the browser, open `/dev`, refresh — revenue and usage charts have updated. |
| 18 (1:59–2:05) | Stay on the dashboard. |
| 19–20 (2:05–2:32) | End card: stop recording. |

**Pacing rule:** each caption should be on screen over the thing it describes. If your take runs faster than the caption timing, slow down by pausing on the key moments — or re-time captions in the editor (they're a starting point, not law).

## After recording

1. **Trim** to ≤ 2:50.
2. **Burn in the captions.** Easiest free options:
   - **CapCut desktop** (free): import video → Text → Local captions / manual text per caption (copy each line from captions.srt), position bottom-center, bold, white on semi-transparent black.
   - **Clipchamp** (free at clipchamp.com with a Microsoft account): text overlays, same approach.
3. **Upload to YouTube** as **public**, title: `Tollbooth — APIs with a cash register for AI agents (PayPal AI Hackathon)`.
4. **Also upload captions.srt as subtitles** (YouTube Studio → Subtitles → Add language English → Upload file) — helps judges watching muted and covers anything the burn-in missed.
5. Paste the URL into `docs/SUBMISSION.md` and the Devpost form.

## Troubleshooting mid-take

- Demo fails with "Is the Tollbooth app running?" → the dev server died; restart (`npm run dev`), re-record from caption 9's beat.
- PayPal capture slow → agent-card captures are normally instant; if the sandbox API is flaky, wait — the line will still appear. Don't cut mid-order.
- Wrong thing on screen → pause recording, fix, continue — cut the pause in edit.
