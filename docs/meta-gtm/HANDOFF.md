# ApexAlpha Meta GTM — Continuation Handoff

> **Read this first.** Self-contained state for picking up the Meta GTM work cold. Project root:
> `H:\Source\repos\hedge-fund-analysis`. Branch: `nextjs-version`. Date of handoff: 2026-06-25.

## What the project is
ApexAlpha — a live Next.js web app: type a ticker → instant fair-value verdict + streaming
hedge-fund-style AI memo + 5-year valuation model + charts, plus a Premium "AI Intelligence" terminal.
**Research & education, not investment advice.** GTM = **pure Meta acquisition + subscription-only
revenue** (no affiliate). Note `AGENTS.md`: this is a modified Next.js — read `node_modules/next/dist/docs/`
before writing Next code.

## The playbook (the spine of this work)
`docs/michia/playbook-apexalpha-meta.md` — 9 steps, run top-to-bottom. Steps 1–3 prove the offer on Meta
*before* the product is refined. Tooling: **Meta Ads MCP** (acquisition), **Higgsfield** (creative),
**Supermetrics** (spend/rev), **HubSpot** (nurture), **Stripe MCP** (billing — connected, LIVE),
**Vercel MCP** (deploy).

## Step status
- **Step 1 — Recon** ✅ `docs/meta-gtm/meta-recon.md` (US-only, offer reverse-engineered from CAC).
- **Step 2 — Conversion machine** ✅ `docs/meta-gtm/conversion-machine.md` (as-built; validated vs code).
- **Step 3 — WTP test** ✅ `docs/meta-gtm/wtp-test.md` + A/B implemented in code & Stripe (this is the
  most recent work).
- **Product revision blueprint** ✅ `docs/meta-gtm/product-revision.md` (built by a separate agent; the
  realignment is complete and in the working tree).
- **Step 4 — Product refinement** ✅ `docs/meta-gtm/product-refinement.md` (as-built; validated vs code).
  The realignment pre-did most of §5; this step closed the one open gap — the **retention surface**
  (`RenewalBanner` consuming `renewalStatus()`, renewing-soon nudge + lapsed win-back, fires
  `RenewalPrompt` for the win-back retargeting audience) — and documented the full retargeting/audience
  map + DoD. tsc clean; both banner states verified in preview.
- **Step 5 — Conversion tracking** ✅ `docs/meta-gtm/conversion-tracking.md` (as-built spec). CAPI
  `/api/meta/capi` is now a **real Graph API send** (SHA-256 email hashing, `user_data` assembly,
  IP/UA enrichment, shared `event_id` dedup, test-event support, dev `would_send` echo); client relay
  forwards email + `_fbp`/`_fbc` + `event_time`. Documents the optimization graduation ladder
  (CompleteRegistration → tripwire Purchase → annual Purchase + value-opt at ~50 conv/ad-set/wk) and
  the CAC:LTV ≥ 3:1 kill-switch ($187 breakeven CAC). tsc clean; `would_send` transform verified vs
  `sha256sum`. **Live Graph send not exercised** (needs real dataset token — verify in Test Events at Step 7).
- **Step 6 — Native/UGC creative** ✅ `docs/meta-gtm/marketing-assets/` (brief + 4 per-hook briefs +
  `static-ads.html` (5 finished frames) + `video-build.md`). Built on the user's real MU screens in
  `docs/screenshots/webapp/`. **Build: captions-first/screen-rec-led for sound-off (captions mandatory)
  + fully AI voiceover** as the sound-on layer (user-directed). VO generated: **Sterling** male preset
  via ElevenLabs, 4 tracks `vo-h*-sterling.mp3` saved per hook (~14–15s, ~2.4 credits total). No
  synthetic on-camera presenter (finance compliance). Static ads are pixel-exact HTML (diffusion garbles
  ad copy). **AI image-to-video (Kling 3.0) tried for the footage and REJECTED — it warps UI text/numbers**
  (`clip-*.mp4` kept as motion reference only). Footage method = **self-shot screen recording** (real app,
  pixel-perfect) per `marketing-assets/self-shoot-guide.md`. Remaining = user records 4 screens + assembles
  in CapCut: frame to 9:16 → lay Sterling VO → burn captions (video-build.md beats) → end-card.
- **Content engine (cross-step)** ✅ `docs/meta-gtm/content-repurposing.md` — plan to atomize a
  **~22-min walkthrough** (user on webcam + real screens) into 8–15 shorts + mid-form + carousels + blog
  + email; clips double as organic reach AND Meta paid creative + video-view retargeting. Clip→hook map
  (C1–C8 → H1/H2/H3/H5 + charts/intel), Opus Clip/Klap auto-clip → CapCut polish, format transforms.
- **Steps 7–9** ⏳ not started. **Next up: Step 7 (Vercel deploy + verify live funnel in Events Manager
  Test Events + build the Advantage+ campaign in Meta Ads MCP).** Then 8 (CRO), 9 (scale).

### Session state — YOU ARE HERE (2026-06-26)
User is **producing the ads themselves** (rejected AI video for quality). They shot a real 22-min CapCut
project (webcam + screen). **Export guidance given:** per-ad ~15s cuts (NOT the 22-min master), **9:16**
(canvas was 16:9 — needs reframe), codec **H.264** (not HEVC), mp4/1080p/30fps, uncheck CapCut "sync to
space". The 4 Sterling VO tracks + static frames + end-card are in `marketing-assets/` ready to assemble.
Then pivot to the content-repurposing engine. Offered next: draft YouTube SEO for the pillar, or a
clip-by-clip timestamped shot list (needs the user's rough 22-min timeline).

## The offer (reverse-engineered — the core model)
Meta sets CAC (we can't pick it). US finance cold CAC ≈ **$120 / $180 (plan) / $250 (stress)**. Rule:
**LTV : CAC ≥ 3:1**. Solved-backward offer:
- **Free hook:** 1 ungated verdict (value before gate).
- **Gate:** account on the 2nd action (launch optimization event).
- **Tripwire:** **$7** single-ticker deep-dive (card-on-file).
- **Core:** annual **$99 intro → $279/$299 renewal** (Seeking-Alpha-tier, NOT Fool's $199 — $199
  fails 3:1). Premium = **+$100/yr** expansion (intro $199 → renewal $379/$399).
- **Retention** must hit **r ≥ 0.58–0.60**. Blended **LTV ≈ $528–598** → 2.9–3.3:1 at $180 CAC.
- **The $9/$19 monthly model is dead** — it never repays finance CAC. Demoted to expansion rung.
- **Optimized event:** ultimately `Purchase` (annual); launch on `CompleteRegistration`, graduate
  signup → tripwire → annual at ~50 conv/ad-set/wk.

## Stripe (LIVE — `acct_1Rqms71awWwGP4dI`, "Sheers Software Sdn Bhd", settles MYR, prices USD)
> ⚠️ **LIVE mode.** Real charges on card submit. Nothing deployed yet, links only in `.env.local`.

**Products:** Basic `prod_UlRIuc4UZCgUyG` · Premium `prod_UlRID8SwlFQupx` · Deep-dive `prod_UlRIXN0A9Xi41p`

**Prices (USD):**
- Basic A $279/yr `price_1TluQv1awWwGP4dIjPzhTLXw` · Premium A $379/yr `price_1TluRL1awWwGP4dIWSGvNwsa`
- Basic B $299/yr `price_1TlueH1awWwGP4dIKVlDXvvW` · Premium B $399/yr `price_1TlueY1awWwGP4dI6O20dM9E`
- Tripwire $7 `price_1TluRY1awWwGP4dIF2NcYrP8`

**Coupons (duration: once = first invoice only):** A −$180 `Q6Nnj3vP` · B −$200 `YPoMYzmF`
**Promo codes (prefilled into links → seamless $99 intro):** `INTRO99`→Q6Nnj3vP · `INTRO99B`→YPoMYzmF

**Payment Links (allow_promotion_codes=true, redirect → `apexalpha.app/app?upgraded=1`):**
- Basic A: `https://buy.stripe.com/14A4grgUggSS0XW0q3fAc03` (`plink_1TluSK1awWwGP4dIgcHZUrIZ`)
- Premium A: `https://buy.stripe.com/28EcMXfQc5aa8qo1u7fAc04` (`plink_1TluSb1awWwGP4dIEYFewKoH`)
- Tripwire: `https://buy.stripe.com/28EbIT9rOgSS2201u7fAc05` (`plink_1TluT31awWwGP4dIkEOaD4dL`)
- Basic B: `https://buy.stripe.com/3cIfZ97jGgSSdKIgp1fAc06` (`plink_1TlufP1awWwGP4dI7VezMcOY`)
- Premium B: `https://buy.stripe.com/5kQdR1cE0gSS0XW0q3fAc07` (`plink_1Tlufd1awWwGP4dIM8vbmkyb`)

**Key constraint discovered:** Payment Links API has **no `discounts` field** (create or update) — coupons
can't be auto-attached programmatically. Solution = promo code + `?prefilled_promo_code=` URL param
(auto-applies, no typing). This is why the env links carry the promo param.

## Code (all uncommitted in working tree; realignment + Step 3 A/B both present)
**Funnel core:**
- `src/lib/tiers.ts` — annual cadence; `ANNUAL_INTRO_PRICE=99`, `PREMIUM_EXPANSION_DELTA=100`,
  `MODELED_LTV=560`, `TRIPWIRE`, `CATEGORY_ANCHORS`. **Step 3:** `WtpCell`, `WTP_CELLS` (binds
  renewal price ↔ Stripe link per cell), `renewalPriceForCell`, `stripeLinkForCell`.
- `src/lib/experiment.ts` (**new, Step 3**) — `resolveWtpCell()` / `useWtpCell()`: `?cell=a|b` wins →
  sticky localStorage → 50/50 fallback.
- `src/lib/useGate.ts` — value-before-gate (1 anon verdict via `apex-alpha-anon-verdicts`),
  `guardQuota`/`guardTripwire`/`guardPro`, `hasDeepDive`, `renewalStatus`.
- `src/lib/checkout.ts` — `startSubscriptionCheckout`/`startExpansionCheckout`/`startTripwireCheckout`,
  `applyPurchase`, crumb-based return flow. **Step 3:** resolves cell, routes to cell link, tags purchase.
- `src/lib/analytics.ts` — pixel + CAPI dedup (shared `event_id`); events `ViewVerdict`,
  `CompleteRegistration`, `Purchase{tripwire|subscription|expansion}`; `predicted_ltv=MODELED_LTV`.
  **Step 3:** subscription Purchase carries `wtp_cell`. **Step 4:** `trackRenewalPrompt(status,plan)`
  fires `RenewalPrompt` (custom, CAPI-deduped) for the renewal-nurture / win-back audiences.
- `src/lib/store.ts` — account model: `subscribeAnnual`, `buyDeepDive`, `deepDives[]`, `renewsAt`,
  `isIntroTerm`, `renewalStatus()`.
- `src/app/api/meta/capi/route.ts` — CAPI relay **real Graph API send** (Step 5): SHA-256 email hash,
  `user_data` (em/external_id/fbp/fbc/ip/ua), `action_source`, shared `event_id` dedup, `test_event_code`
  support; no-ops (with dev `would_send` echo) until `META_CAPI_DATASET_ID`/`_ACCESS_TOKEN` are set.
**UI (cell-aware where prices show):** `UpgradeModal.tsx` (paywall: tripwire + ladder + order-bump +
category anchor + money-back guarantee), `PricingTable.tsx`, `FairValueCheck.tsx` (hook + tripwire CTA),
`SignupModal.tsx` (fires CompleteRegistration), `LandingHero.tsx`.
- `src/components/conversion/RenewalBanner.tsx` (**new, Step 4**) — retention surface mounted in the
  `(app)` shell: renewing-soon nudge + lapsed win-back off `renewalStatus()`, fires `RenewalPrompt`.

## Env vars (`.env.local`, gitignored; `.env.example` has the template)
`NEXT_PUBLIC_STRIPE_LINK_ANNUAL` / `…_ANNUAL_PREMIUM` (cell A, with `?prefilled_promo_code=INTRO99`),
`…_ANNUAL_B` / `…_ANNUAL_PREMIUM_B` (cell B, `…INTRO99B`), `…_TRIPWIRE`,
`NEXT_PUBLIC_ANNUAL_RENEWAL_PRICE=279` (legacy/superseded by cells). Step-5 blanks:
`NEXT_PUBLIC_FB_PIXEL_ID`, `META_CAPI_DATASET_ID`, `META_CAPI_ACCESS_TOKEN`. Existing: `GEMINI_API_KEY`,
`FINNHUB_API_KEY`.
> ⚠️ Newly-added `NEXT_PUBLIC_*` links need a **dev server restart** to load (Next inlines at boot). The
> cell→price *display* works without restart.

## Compliance constraints (bind everything)
Declare Meta **Financial Products & Services Special Ad Category**: age 18–65+, **no income/behavior
targeting**, 15-mi min radius, **no classic Lookalikes** (use **Special Ad Audiences**). Creative:
research/education framing, not-advice line, real screens only, no returns/"get rich". **Verify CAPI
events aren't finance-filtered in Step 5** (keep `trackCustom` fallback).

## Verification done
`tsc --noEmit` clean. Browser preview: `/pricing?cell=a` → $279/$379, `/pricing?cell=b` → $299/$399,
sticky cell, no console errors. Live Stripe redirect NOT exercised (real charge on submit).

## Open items / next actions
1. **Step 6** — produce native/UGC Meta creative with Higgsfield (screen-rec "watch AI judge a stock
   in 5 sec" + Advantage+ value variants), compliant by construction; save to
   `docs/meta-gtm/marketing-assets/`, foldered by hook.
2. Set all env vars in **Vercel** before Step 7 deploy (incl. `NEXT_PUBLIC_FB_PIXEL_ID`,
   `META_CAPI_DATASET_ID`, `META_CAPI_ACCESS_TOKEN`); verify each rung once in Events Manager → Test
   Events (use `META_CAPI_TEST_EVENT_CODE`); restart dev to load link env locally.
3. **WTP test is a go/no-go smoke test** at $150–300 (NOT a powered price A/B — that needs ~$9–18k).
   Ad sets land on `…/app?check=TICKER&cell=a|b`. Don't scale until 3:1 shown.
4. Nothing committed or deployed yet. Don't deploy until Step 7.

## Decisions log (so they aren't relitigated)
- US-only market. Offer reverse-engineered from CAC, not guessed.
- Stripe kept on **LIVE** (user chose live after considering test) — real links.
- Intro discount via **prefilled promo code** (Payment Links can't auto-apply coupons) — seamless + simple,
  chosen over a server-side Checkout Session rewrite to keep the static-link architecture.
- Monthly $9/$19 demoted; annual ladder is the headline.

#### Memory (auto-loaded each session)
`intel-honest-model-naming.md`, `tier-and-auth-model.md` — note the tier memory predates the annual
repricing; tiers are now annual ($99→$279/$299 + $7 tripwire), not $9/$19 monthly.
