# H5 — "Stop guessing what a stock is worth"

**Angle:** pain → relief on the **5-year Bull/Base/Bear valuation model**. Self-selects DIY-valuation
types. **Persona voice:** 40s-male retail investor (VO only). **Formats:** `9x16` video + `1x1` static.

## The real product moment (capture this — your browser)
The full valuation model is Basic-gated, so seed a paid account to un-blur it:
1. DevTools console (on `http://localhost:3000`), paste:
   ```js
   const now=Date.now(), acc={email:"demo@apex.test",passwordHash:"x",salt:"x",verified:true,tier:"basic",
   signedUpAt:now,proSince:now,cadence:"annual",termStartedAt:now,renewsAt:now+300*864e5,isIntroTerm:true,
   deepDives:[],usage:{period:new Date().toISOString().slice(0,7),reports:0,checks:0}};
   localStorage.setItem("apex-alpha-user",JSON.stringify({state:{...acc,accounts:{[acc.email]:acc},
   sessionEmail:acc.email,pending:null},version:1}));
   ```
   (`renewsAt` is ~300 days out so the renewal banner stays hidden.)
2. Reload, go to `http://localhost:3000/valuation?ticker=NVDA` → the **Bull/Base/Bear model** renders
   live. Screen-record sliding an assumption and the fair-value updating (~6s). Save `screen-valuation-NVDA.mp4`.
3. When done, `localStorage.removeItem('apex-alpha-user')` to return to anonymous.

## 9x16 storyboard (~8s)
| t | Visual | Caption |
|---|---|---|
| 0.0–1.5 | Text card, a shrugging "🤷 $?" over a price chart | "Stop guessing what a stock is worth." |
| 1.5–5.5 | **Real valuation model** (your capture), assumption slider moves, fair-value recalcs | "Build a 5-year model — Bull, Base, Bear." |
| 5.5–7.0 | Fair-value estimate held | "On live fundamentals. You set the assumptions." |
| 7.0–8.0 | End-card: logo + CTA | "Start free — no card." |

**VO (40s male, ~7s):** "Stop guessing what a stock is actually worth. ApexAlpha builds a five-year
valuation — bull, base, and bear — from live fundamentals, so you set the assumptions. Free to start.
It's research, not advice."

## 1x1 static
Real valuation screenshot · headline "Stop guessing what a stock is worth." · subhead "Your own 5-year
Bull/Base/Bear model — free to start." · footer not-advice line + CTA chip.

## Higgsfield generation plan
- `generate_audio` — VO (male, 40s). → `_shared/vo-h5.mp3`.
- `generate_image` — opener "🤷 $?" card + end-card. NO product UI (model is the real capture).
- Assemble: opener → real model → end-card; captions; VO; export 9x16 + 1x1.

## Compliance check
- [ ] Real valuation screen (no fabricated UI). [ ] Projections framed as hypothetical/educational.
- [ ] No price target as a recommendation; no returns. [ ] Not-advice line legible. [ ] No synthetic presenter.
