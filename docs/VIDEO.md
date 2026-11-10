# Tollbooth demo video — recording kit

Goal: **under 3 minutes**, public on YouTube, unlisted-ok-until-submission. This page is a shot-by-shot plan you can follow in one take. The spoken script is in `docs/SUBMISSION.md`; the beats below tell you exactly what to show while you say each line.

## Before you hit record (5 minutes of setup)

1. **Clean slate for the dashboard:** stop the dev server, delete `app/data/tollbooth.db`, restart — the app re-seeds itself automatically (no usage/orders history cluttering the charts).
   ```bash
   # in terminal 1
   npm run dev
   ```
2. **Open two windows, side by side:**
   - Browser: `http://localhost:3000` (marketplace) — also open `/dev` in a second tab (developer dashboard).
   - Terminal: `C:\Users\Victor\tollbooth`, font size bumped up (Ctrl+= a few times in Windows Terminal — judges watch on small screens).
3. **Recording tool (pick one):**
   - **Xbox Game Bar** (built into Windows 10): `Win+Alt+R` to record, `Win+Alt+M` toggles mic. Simplest option.
   - **OBS Studio** (free) if you want both windows captured in one scene with clean framing.
   - Either way: record a 5-second test clip and check **audio is not silent** — that's the #1 submission-video failure.
4. **Do one full dry run** of the commands below before recording (a real sandbox capture happens each run — each is $5 of sandbox money, which is unlimited).

## The shots (with timings)

| Time | Say (short version) | Show / do |
|---|---|---|
| 0:00–0:10 | "AI agents are about to consume millions of APIs. But they can't discover them, can't read them, and can't pay for them." | Terminal window, idle. Title card text can be a text file open in the editor behind you, or just say it over the terminal. |
| 0:10–0:25 | "Tollbooth is the missing commerce layer. Watch a developer publish an API, and an AI agent buy it — with no human in the loop." | Switch to browser: marketplace home page. |
| 0:25–0:55 | "A developer pastes an OpenAPI spec. Tollbooth generates an SDK and — this is the key part — a context file that agents can actually read instead of HTML docs. The listing goes live with per-call pricing." | Open a listing page (`/listing/sentimentscan`). Click/scroll to the context file section and let it sit on screen for ~5s — this is the "aha" shot. |
| 0:55–1:15 | "Now the demand side. I give an agent one mission: find a sentiment API, run three calls, stay under five dollars." | Switch to terminal. Type (don't paste — typing reads as more real, but pasting is fine if you're nervous): `npm run demo` |
| 1:15–1:50 | (narrate the steps as they print — the demo output is written to be read aloud) "It registers… searches the marketplace… reads the context file… creates a PayPal order for 500 credits — and there, PayPal captures the payment. That's a real sandbox transaction, no browser, no human." | Let the demo run. Point (or just pause) at lines: `Created PayPal order …` then `Payment captured ✓`. |
| 1:50–2:20 | "Credits land, and now every API call goes through the metered gateway — two cents each, failed calls are never billed." | The three sentiment calls print with `[billed 2 credits]`. Then `Done. Credits remaining: 494.` |
| 2:20–2:45 | "Meanwhile, on the developer side — revenue, usage, and payouts to the seller's PayPal account. Zero humans touched this transaction." | Switch to browser tab `/dev`. Refresh. Revenue and usage charts have updated. Hover the payout button area if there is one. |
| 2:45–2:55 | "Every API, ready for the machine economy. Tollbooth. Repo link in the description." | Stop recording. Add the GitHub URL as an on-screen end card (or say it: "github.com/adelekevictor12/tollbooth"). |

## After recording

1. Trim to <3:00 if needed. **Clipchamp** (free, on Windows 10) or CapCut both do trims + a title card.
2. Upload to YouTube as **public** (Devpost requires public or listed videos), title: `Tollbooth — APIs with a cash register for AI agents (PayPal AI Hackathon)`.
3. Paste the URL into `docs/SUBMISSION.md` and the Devpost form.

## Troubleshooting mid-take

- Demo fails with "Is the Tollbooth app running?" → the dev server died; restart it (`npm run dev`), re-record from 0:55.
- PayPal capture slow → agent-card captures are normally instant; if the sandbox API is flaky, wait — the output line will still appear. Don't cut mid-order.
- Wrong thing on screen → pause recording, fix, continue — cut the pause in edit. Only restart the whole take if audio died.
