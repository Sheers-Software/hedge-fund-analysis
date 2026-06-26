# H1 — "Is your stock overvalued right now?"

**Angle:** runs on the viewer's own ticker → instant verdict. Highest-intent; self-selects holders of
a specific name. **Persona voice:** relatable 40s-male retail investor (VO only — no synthetic face).
**Formats:** `9x16` UGC screen-rec video (primary) + `1x1` static value card.

## The real product moment (capture this — your browser)
1. In your browser open `http://localhost:3000` → DevTools console → run
   `localStorage.removeItem('apex-alpha-anon-verdicts')` (so the first verdict is ungated).
2. Go to `http://localhost:3000/app?check=NVDA` → the **fair-value verdict card** renders with no modal.
3. Screen-record ~6s (or screenshot the `.fvc-card`). Repeat for **AAPL** and **TSLA** for variants.
4. Save to this folder as `screen-verdict-NVDA.mp4|png` (etc.).

## 9x16 storyboard (~8s)
| t | Visual | Caption (burned-in) |
|---|---|---|
| 0.0–1.5 | Bold text card over a blurred ticker grid (Higgsfield static, motion zoom) | "Thinking about buying NVDA?" |
| 1.5–5.0 | **Real verdict screen** (your capture), slow push-in on the verdict + fair-value | "Get the verdict first." |
| 5.0–7.0 | Verdict + price/fair-value side by side | "Over- or undervalued — with the analysis." |
| 7.0–8.0 | End-card: logo + CTA | "Check any ticker free — no card." |

**VO (40s male, conversational, ~7s):** "Thinking about buying Nvidia? Type the ticker into ApexAlpha
first — you get an instant fair-value verdict, with the analysis behind it. First one's free. It's
research, not advice — you make the call."

## 1x1 static
Real verdict screenshot framed on a dark card · headline "Is NVDA overvalued right now?" · subhead
"Instant AI fair-value verdict — free." · footer "Research & education. Not investment advice." · CTA chip.

## Higgsfield generation plan
- `generate_audio` — the VO line (voice: male, ~40s, American, calm/credible). → `_shared/vo-h1.mp3`.
- `generate_image` — opener text card + end-card frame (brand, CTA). NO product UI (composited from capture).
- Assemble: opener → real screen (push-in) → end-card; burn captions; lay VO; export 9x16 + 1x1.

## Compliance check
- [ ] Real screen only (no fabricated UI). [ ] No returns / "get rich" / guarantee-of-performance.
- [ ] "Research & education — not investment advice." legible. [ ] No synthetic human presenter.
