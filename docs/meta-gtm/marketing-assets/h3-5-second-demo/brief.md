# H3 — "Watch an AI judge a stock in 5 seconds"

**Angle:** cold-open demo / wow. Broadest reach, strongest scroll-stopper. **Persona voice:** 40s-male
retail investor (VO only). **Formats:** `9x16` screen-first video (primary) + `4x5` feed video.

## The real product moment (capture this — your browser)
1. `localStorage.removeItem('apex-alpha-anon-verdicts')` in console (ungated first verdict).
2. Screen-record the **type → verdict** flow: load `http://localhost:3000/app`, click the **NVDA**
   sample chip, let the `.fvc-card` resolve. Capture from blank → verdict (~5s). Save
   `screen-type-to-verdict.mp4`.
3. Optional: also capture `/app?check=AAPL` resolving, for a variant.

## 9x16 storyboard (~7s) — screen-first cold open
| t | Visual | Caption |
|---|---|---|
| 0.0–1.0 | **Real app**, cursor clicks a ticker (your capture), hard cut on motion | "Watch AI judge a stock…" |
| 1.0–4.5 | Verdict streams in on the real screen | "…in 5 seconds." |
| 4.5–6.0 | Verdict + fair-value held, quick zoom | "Over- or undervalued, live data." |
| 6.0–7.0 | End-card: logo + CTA | "Try any ticker free." |

**VO (40s male, ~6s):** "Watch an AI judge a stock in five seconds. Type a ticker… and there's your
fair-value verdict — over- or undervalued, on live data. Free to try. Research and education — not
investment advice."

## Higgsfield generation plan
- `generate_audio` — VO (male, 40s). → `_shared/vo-h3.mp3`.
- `generate_image` — end-card frame only (brand + CTA). Opener is the real screen (no generated UI).
- Assemble: real screen cold-open → verdict → end-card; captions; VO; export 9x16 + 4x5.

## Compliance check
- [ ] Real screen only. [ ] No returns / hype. [ ] Not-advice line legible. [ ] No synthetic presenter.
- [ ] "5 seconds" describes the product speed (true), not a performance/returns claim.
