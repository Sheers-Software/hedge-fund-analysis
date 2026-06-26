# H2 — "I cancelled my $199 stock-picking subscription"

**Angle:** ex-Fool / Seeking-Alpha churn. Self-selects the highest-LTV buyer (already pays for
research). Contrast: analysis you control vs. someone else's hot tip. **Persona voice:** 40s-male
ex-subscriber (VO only). **Formats:** `9x16` video + `1x1` static.

## The real product moment (capture this — your browser)
- The **AI memo**: `http://localhost:3000/report/NVDA`. Needs a Gemini key — add one via the Settings
  gear (or set `GEMINI_API_KEY` server-side), then click **Generate** and screen-record the memo
  streaming in (Executive Summary → Investment Judgment). Save `screen-memo-NVDA.mp4`.
- Fallback if no key: capture the report scaffold (company header + financial metrics + section list)
  and lean the cut on the verdict + valuation screens instead.

## 9x16 storyboard (~9s)
| t | Visual | Caption |
|---|---|---|
| 0.0–1.5 | Text card, a "$199/yr" price striking through | "I cancelled my $199 stock-picking sub." |
| 1.5–5.5 | **Real memo** streaming (your capture), scroll through sections | "Now I get the full memo myself." |
| 5.5–7.5 | Memo + verdict | "The analysis — not a hot tip." |
| 7.5–9.0 | End-card: "$99 first year · vs $199–299 incumbents" + CTA | "First verdict free." |

**VO (40s male, ~8s):** "I was paying a hundred and ninety-nine a year for stock picks. Now I just type
the ticker and get a full, hedge-fund-style memo — the analysis, not a hot tip. First verdict's free.
It's research, not advice."

## 1x1 static
Real memo screenshot · headline "I stopped paying $199 for stock picks." · subhead "Hedge-fund-style
research from $99 your first year." · category anchor "vs Seeking Alpha $299 · Motley Fool $199" ·
footer not-advice line.

## Higgsfield generation plan
- `generate_audio` — VO (male, 40s, slightly wry). → `_shared/vo-h2.mp3`.
- `generate_image` — opener "$199 strike" card + end-card with price anchor. NO product UI.
- Assemble: opener → real memo → anchor end-card; captions; VO; export 9x16 + 1x1.

## Compliance check
- [ ] Real memo screen (no fabricated UI). [ ] Price claims are our real prices + true category list.
- [ ] No "beat the market" / returns. [ ] Not-advice line legible. [ ] No synthetic presenter.
- [ ] Competitor names used factually for price comparison only.
