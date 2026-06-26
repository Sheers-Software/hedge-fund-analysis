# Step 6 — Native/UGC Meta Creative (brief + production tracker)

> **What this is.** The creative brief and asset index for Step 6 of
> [playbook-apexalpha-meta.md](../../michia/playbook-apexalpha-meta.md): produce high-velocity,
> native Meta creative with the **Higgsfield MCP (Marketing Studio)**, built on the REAL product and
> the won offer. Creative is the #1 lever on Meta CAC — so this is a *batch* of hooks × openers, not a
> few polished ads. **No deploy / no ad upload here** (campaign build = Step 7).

Inputs: [conversion-machine.md](../conversion-machine.md) · [meta-recon.md](../meta-recon.md).

---

## 1. The hard compliance line (binds EVERY asset — build compliant by construction)

US finance is **Special Ad Category**. An ad that breaks these gets rejected and burns budget:

- ❌ **No promised/implied returns**, "beat the market," "get rich," "guaranteed," fabricated track records.
- ❌ **No fabricated UI.** The product moment shown must be a **real screen** of the live app.
- ✅ **Lead with a real product moment** (instant verdict / streaming memo / valuation model).
- ✅ **"Research & education — not investment advice."** legible on every asset.
- ✅ Money-**back** guarantee is allowed (it's not a performance guarantee).

**Pipeline that stays compliant:** the *product moment* = a real screen capture of the app; **Higgsfield
wraps it** (UGC creator opener, captions, motion, voiceover, music) and produces the static variants.
Higgsfield never generates the product UI itself.

---

## 2. The buyer & the message (from recon)

Self-directed US investor, **male-skewed, 35–60, college-educated, $75k+ HHI**, currently pays for or
churned from **Motley Fool / Seeking Alpha**, mobile-first. Special Ad Category bans income/behavior
targeting → **the creative must self-select this person.** Speak to: "is my stock overvalued," distrust
of stock-picking newsletters, wanting the analysis not a hot tip, value vs. the $199–299 incumbents.

---

## 3. The hook matrix (the spine — batch hooks × openers)

Each **hook** = the reason to stop scrolling, paired with the **real product moment** it demos.

| ID | Hook (angle) | Lead product moment (real screen) | Self-selects |
|----|------|------|------|
| **H1 verdict-on-your-ticker** | "Is NVDA actually overvalued right now?" | type ticker → instant fair-value verdict | holders of a specific name |
| **H2 ex-newsletter** | "I cancelled my $199 stock-picking subscription." | the AI memo + verdict (analysis, not a tip) | ex-Fool / SA churners |
| **H3 5-second demo** | "Watch an AI judge a stock in 5 seconds." | cold-open: ticker typed → verdict streams | curious / demo-driven |
| **H4 coffee-price value** | "Hedge-fund-style research for the price of a coffee." | streaming hedge-fund memo | value-conscious researchers |
| **H5 stop-guessing valuation** | "Stop guessing what a stock is worth." | 5-year Bull/Base/Bear valuation model | DIY valuation types |

**Openers (first ~1.5s, swap per hook for velocity):** (a) UGC talking-head POV; (b) screen-first cold
open; (c) bold text-hook card; (d) problem→solution split. Batch = hooks × openers × formats.

**Formats:** `9x16` UGC screen-rec video (Reels/Stories, primary) · `1x1` & `4x5` static value cards
(feed / Advantage+) · `4x5` feed video. All carry the not-advice line + a clear CTA ("Check any ticker
free — no card").

---

## 4. Folder convention (save assets here)

```
marketing-assets/
  <hook-slug>/                 e.g. h1-verdict-on-your-ticker/
    brief.md                   per-hook script + caption + compliance check
    9x16-verdict.mp4           named for the product moment used
    1x1-verdict-card.png
    ...
  _shared/                     reusable openers, VO, music, end-cards
```

---

## 5. Production status

**Direction (locked):** product moment = real screen captures (user-supplied; the headless screenshot
tool is non-functional here) · hooks = H1, H3, H2, H5 · persona = relatable 40s-male retail investor,
**voiced via AI voiceover only — NO synthetic human presenter** (an AI-generated face giving stock
opinions is a Meta finance-policy rejection risk) · audio = AI VO + burned-in captions.

**Real screens: RECEIVED** — `docs/screenshots/webapp/` (Premium account, ticker **MU / Micron**).

Static frames → [static-ads.html](./static-ads.html). Video build (captions-first, no AI VO —
highest-conversion path) → [video-build.md](./video-build.md). Open static-ads.html in a browser →
screenshot each block at its true aspect ratio; drop the named real screen into each dashed slot.

**Video method:** real screen-recording + **burned-in captions** (sound-off native — the conversion
driver) **+ fully AI voiceover** as the sound-on layer (user decision). VO = **Sterling** (male,
professional/trust) via **ElevenLabs**, generated and saved per hook below. Captions remain mandatory
(~80% play muted). Note: VO tracks run ~14–15s, so cut each video to ~15s (gives the screen demo more room).

| Hook | Static | VO (Sterling) | Higgsfield clip (9:16, 5s, silent) | Final assemble |
|---|---|---|---|---|
| H1 verdict | ✅ 1:1 | ✅ [vo-h1](./h1-verdict-on-your-ticker/vo-h1-sterling.mp3) 14.5s | ✅ [clip-h1-header.mp4](./h1-verdict-on-your-ticker/clip-h1-header.mp4) (src `154912`) | ⏳ editor: lay VO + captions |
| H3 5-sec demo | ✅ 9:16 | ✅ [vo-h3](./h3-5-second-demo/vo-h3-sterling.mp3) 15.3s | ✅ [clip-h3-home.mp4](./h3-5-second-demo/clip-h3-home.mp4) (src `154852`) | ⏳ editor: lay VO + captions |
| H2 ex-newsletter | ✅ 1:1 | ✅ [vo-h2](./h2-ex-newsletter/vo-h2-sterling.mp3) 14.6s | ✅ [clip-h2-memo.mp4](./h2-ex-newsletter/clip-h2-memo.mp4) (src `155051`) | ⏳ editor: lay VO + captions |
| H5 valuation | ✅ 1:1 | ✅ [vo-h5](./h5-stop-guessing-valuation/vo-h5-sterling.mp3) 14.2s | ✅ [clip-h5-valuation.mp4](./h5-stop-guessing-valuation/clip-h5-valuation.mp4) (src `155326`) | ⏳ editor: lay VO + captions |
| _shared end-card | ✅ 9:16 | — | — | — |

Voice: **Sterling** `dc382508-c8bd-443c-8cb2-46e57b8d2e6f` (preset, ElevenLabs, ~0.6 cr/line).

> ⚠️ **AI clips rejected for quality.** The Kling `clip-*.mp4` files warp the UI text/numbers — kept only
> as motion reference. **Footage method = self-shot screen recording** (pixel-perfect). Full instructions:
> [self-shoot-guide.md](./self-shoot-guide.md). Per-hook beats + VO timings: [video-build.md](./video-build.md).
> **Assembly:** record real screen → frame to 9:16 (Ken-Burns) → lay Sterling VO → burn captions → end-card.

**Step 6 deliverables complete** (briefs, static ads, caption/video build spec). Remaining is execution
you own: capture the 4 screen-recordings (steps in [video-build.md](./video-build.md)) and assemble in
an editor. Then → **Step 7** (deploy + build the Meta campaign).

Bonus b-roll: `Intelligence/155257` (multi-model desk — Premium expansion creative), `Charts/155405`
(projected-revenue chart — strong motion visual). Ticker shown is **MU**, so all copy names Micron.

### Tooling split (important)
- **Static ad frames** (opener cards, end-cards, 1:1/4:5 value cards) = **HTML/SVG** (copy must be
  pixel-exact — the not-advice line, prices, CTA). A diffusion image model garbles text, so we do NOT
  use Higgsfield for text cards. These frame the real screenshot (drop-in slot).
- **Higgsfield** = **AI voiceover (TTS)** + optional motion/b-roll/music only. No synthetic presenter.

_Next: build the static frames (HTML) → fire Higgsfield VO (4 lines) → composite frame + real screen +
captions + VO in an editor; log each here._

---

## 6. Boundaries
- **Step 6** = produce + organize creative. **Step 7** = upload to Meta, build the Advantage+ campaign,
  attach audiences. Do not publish here.
- Real screen captures are the raw material; Higgsfield supplies the UGC wrapper, statics, VO, music.
