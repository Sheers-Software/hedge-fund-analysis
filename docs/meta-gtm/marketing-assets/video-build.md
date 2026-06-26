# Video build spec — captions-first, screen-rec-led (highest-conversion path)

> **The method.** Build **sound-off native**: a real **screen-recording** + **burned-in captions** —
> ~80% of Reels/feed play muted, so captions are the conversion driver and are **mandatory**. Sound-on
> layer = **fully AI voiceover** (user decision): **Sterling** (male, professional/trust) via
> ElevenLabs, generated per hook (`vo-h*-sterling.mp3` in each hook folder, ~14–15s each). Cut each
> video to ~15s to match the VO. (Note for the record: AI TTS typically under-performs a real human
> voice on UGC authenticity — if a variant underdelivers, A/B it against a phone-recorded human read.)

Pairs with the [static frames](./static-ads.html) and the per-hook [briefs](./README.md). Real screens:
`docs/screenshots/webapp/` (ticker **MU**).

## Global caption + format style (sound-off optimized)
- **Beats:** 2–4 words, one idea per beat, swap on the screen action. Never a full sentence on screen.
- **Type:** Inter / system bold (700–800), white `#fff`, on a `rgba(0,0,0,.55)` scrim; **accent
  `#3b82f6` highlight** on the key word. Bottom-third, but **inside Reels safe area** (keep captions
  ≥ 240px from bottom and ≥ 220px from top on a 1920-tall frame, clear of the UI chrome).
- **First 3 seconds carry the hook** (the thumb-stopper) — the product moment + the hook caption land
  before anyone can scroll.
- **Export:** `9x16` 1080×1920 (Reels/Stories, primary) and `1x1` 1080×1080 / `4x5` 1080×1350 (feed),
  MP4 H.264, 6–12s, end on the brand + CTA end-card (1–2s, from static-ads.html).
- **Every video** ends with / persistently shows: "Research & education — not investment advice."

## Per-hook shot + caption tracks

### H3 — 5-second demo (hero, 9:16, ~8s)
| t (s) | Screen (real capture) | Caption beat |
|---|---|---|
| 0.0–1.0 | home / type screen (`154852`) | "Type any ticker." |
| 1.0–2.5 | generating (`155035`) | "Watch AI judge it…" |
| 2.5–4.0 | exec summary resolves (`155051`) | "…in **5 seconds**." |
| 4.0–6.0 | memo scroll (`155116`) | "Over- or undervalued — **with the analysis**." |
| 6.0–8.0 | end-card | "First one's **free**. Research, not advice." |
**Optional VO (your voice):** "Watch an AI judge a stock in five seconds — type a ticker, and there's
your fair-value read, with the analysis behind it. First one's free. Research, not advice."

### H1 — is it overvalued? (9:16 or 1:1, ~7s)
| t | Screen | Caption |
|---|---|---|
| 0.0–1.5 | home (`154852`) | "Thinking of buying **Micron**?" |
| 1.5–3.5 | metrics (`155013`) | "Check the **fair value** first." |
| 3.5–5.0 | metrics hold (`155013`) | "PE 23.7 — vs a typical 20–28." |
| 5.0–7.0 | end-card | "Free to check. Research, not advice." |

### H2 — ex-newsletter (9:16, ~9s)
| t | Screen | Caption |
|---|---|---|
| 0.0–1.5 | opener / strike card | "I cancelled my ~~$199~~ stock-picking sub." |
| 1.5–5.0 | memo streaming (`155035`→`155051`) | "Now I read the **whole memo** myself." |
| 5.0–6.5 | core thesis (`155116`) | "The analysis — **not a hot tip**." |
| 6.5–8.0 | anchor end-card | "**$99** your first year (vs $299 / $199)." |
| 8.0–9.0 | end-card | "First verdict free. Research, not advice." |

### H5 — stop guessing valuation (9:16 or 1:1, ~8s)
| t | Screen | Caption |
|---|---|---|
| 0.0–1.5 | opener | "Stop **guessing** what a stock's worth." |
| 1.5–4.5 | Bull/Base/Bear (`155326`) | "Build a **5-year model**." |
| 4.5–6.0 | model hold (`155348`) | "On live fundamentals — **you** set the assumptions." |
| 6.0–8.0 | end-card | "Start free. Research, not advice." |

## How to capture the screen-recordings (you, ~10 min)
1. Use a **Premium** account (flows straight into the full report — matches these captures).
2. Record a **vertical crop** for 9:16: narrow the browser window or use DevTools device mode
   (~430×930) so the captured panel fills a phone frame; or record wide and crop in the editor.
3. **H3/H1:** record `home → type MU → report generating → Executive Summary` in one take (~6s).
   **H2:** record the memo streaming + scroll through sections. **H5:** record sliding an assumption
   and the fair-value recalculating.
4. Save into the matching hook folder; assemble in your editor (CapCut / Premiere / Higgsfield
   Marketing Studio timeline): screen-rec → burn captions per the track above → end-card → export.

## Sound-on layer — AI voiceover (generated ✅)
- **VO files:** `vo-h1-sterling.mp3` / `vo-h3-…` / `vo-h2-…` / `vo-h5-…` in each hook folder. Voice
  **Sterling** (preset `dc382508-c8bd-443c-8cb2-46e57b8d2e6f`, ElevenLabs). Lay under the captions;
  align the caption beats to the VO timing (the VO runs the full ~15s, so beats stretch vs. the 8s draft).
- **Swap the voice:** regenerate via `generate_audio` (model `text2speech_v2_elevenlabs`) with another
  `voice_id` from `list_voices` — Harrison, Arthur, or Orion are the next-best professional-male presets.
- **Music bed** (optional, not generated): keep any bed low (~12–15%) under the VO so the words stay clear.

## Compliance check (every video)
- [ ] Real screen only (no fabricated UI). [ ] No returns / "get rich" / performance guarantee.
- [ ] Not-advice line present. [ ] No AI-generated human presenter. [ ] Prices shown are our real prices.
