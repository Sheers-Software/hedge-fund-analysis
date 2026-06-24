# Product Revision — Realign the App to the Meta Conversion Machine

> **Purpose.** Translate [conversion-machine.md](./conversion-machine.md) into a concrete,
> file-by-file revision of the existing app so the product *is* the funnel the Meta math requires.
> US-only, acquisition 100% Meta, revenue 100% subscription. This is the build blueprint for **Step 4**
> (and the checkout scaffolding Step 3 tests) — **it does not authorize a deploy** (Step 7).
>
> **Design constraint (carried from recon):** every change must serve **LTV : CAC ≥ 3:1 at $180 CAC**.
> The won configuration: free ungated verdict → account gate → **$7 tripwire** → **annual $99 intro →
> $279–299 renewal** → **≥20% Premium expansion** → **retention r ≥ 0.58–0.60**.
>
> **Do not refactor for taste.** Edit existing code; keep the not-advice disclaimer; minimal product
> change. Where this doc says "Step 3" the path goes in now behind gating for the WTP test; where it
> says "Step 4" it's the full refinement.

---

## 1. Gap analysis — current product vs. the machine

| # | Machine requires | Current state (file) | Verdict |
|---|---|---|---|
| ① | **1 free ungated verdict** for cold traffic | `guardQuota` forces signup **before** the 1st check ([useGate.ts:38](../../src/lib/useGate.ts)) | ❌ **Backwards — top priority** |
| ② | Account gate **after** the wow, as the launch event | Gate exists but fires on action #1 | ⚠️ Re-sequence |
| ③ | **$7 card-on-file tripwire** | Does not exist | ❌ Build new |
| ④ | **Annual $99→$279–299**, annual billing | **$9/mo monthly**, `priceMonthly` ([tiers.ts:85](../../src/lib/tiers.ts)) | ❌ Reprice + re-model cadence |
| ⑤ | Premium expansion as annual add-on, order-bump | $19/mo Premium, upgrade modal `/mo` ([UpgradeModal.tsx:67](../../src/components/conversion/UpgradeModal.tsx)) | ⚠️ Reprice + add bump |
| ⑥ | Retention: renewal date, nurture, win-back | `proSince` only; usage is monthly; no renewal concept | ❌ Add renewal model |
| ⑦ | One purchase event, **server-side CAPI**, value+plan+cadence; audiences | **Browser pixel only** (`fbq`), `predicted_ltv = value*12` is monthly-wrong ([analytics.ts:67](../../src/lib/analytics.ts)) | ❌ Add CAPI + fix events |
| ⑧ | Risk-reversal + money-back + not-advice | Not-advice present; no guarantee, no free-verdict-first | ⚠️ Add guarantee + reorder |

---

## 2. The revised pricing & billing model (`src/lib/tiers.ts`)

The single source of truth flips from **monthly** to an **annual ladder + one-off tripwire**.

### 2a. New shape
- Replace `priceMonthly: number` with an explicit cadence model:
  ```ts
  interface TierConfig {
    id: Tier;
    name: string;
    cadence: "annual" | "oneoff" | "free";
    introPrice: number;   // first-term price (annual: $99)
    renewalPrice: number; // recurring price (annual: 279 | 299 — Step 3 winner)
    tagline: string;
    limits: TierLimits;
    features: string[];
  }
  ```
- **Free** — unchanged hook quota (`reportsPerMonth: 1`, `checksPerMonth: 3`) **but** the first verdict
  becomes anonymous-allowed (see §3). Keep the teaser flags (`valuationFull:false`, etc.).
- **Basic → the core annual plan** — `introPrice: 99`, `renewalPrice: 279|299`, `cadence:"annual"`.
  Same capability set it has today (unlimited memos/checks, full valuation/charts/export, history).
- **Premium → annual + expansion** — `introPrice`/`renewalPrice` set so the **delta over Basic ≈
  +$100/yr** (the recon expansion assumption). Adds `intelFull`.
- **New: the tripwire SKU** (not a `Tier` — a one-off product):
  ```ts
  export const TRIPWIRE = {
    id: "deepdive",
    price: 7,
    name: "Single deep-dive report",
    // unlocks the full memo+valuation+charts+export for ONE ticker
  };
  ```

### 2b. Constants & helpers to update
- `BASIC_PRICE` / `PREMIUM_PRICE` / `PRO_PRICE` / `priceFor()` are **monthly** today and feed the UI —
  rename/repoint to `introPriceFor()` / `renewalPriceFor()`. Grep for every consumer before changing.
- `STRIPE_PAYMENT_LINKS` gains a **tripwire link** + the annual links; env vars:
  `NEXT_PUBLIC_STRIPE_LINK_ANNUAL`, `…_ANNUAL_PREMIUM`, `…_TRIPWIRE`.
- Keep `FEATURE_MIN_TIER` / `QUOTA_UNLOCK_TIER` / `meetsTier` — the **gating taxonomy is correct**;
  only the prices and cadence change.

> **Step 3 hook:** ship `renewalPrice` as a runtime-switchable value (`279` vs `299`) so the WTP test
> can A/B it without a redeploy.

---

## 3. The gating rewrite (`src/lib/useGate.ts`) — value before gate

**This is the highest-leverage change in the whole revision.**

- **`guardQuota` must allow one anonymous verdict.** Today it calls `openSignup` immediately when
  `!isSignedUp`. New rule for **checks**:
  1. Anonymous **+ 0 verdicts used** → **run it, no gate.** Track an anonymous verdict count (local).
  2. Anonymous **+ already used the free verdict** → `openSignup` ("save your results / run another").
  3. Signed-up + over quota → `openUpgrade` — but the upgrade surface now leads with the **$7 tripwire**
     beside the annual plan (see §5).
- Reports (the full memo) stay gated at signup (heavier action) — that's the natural ② gate.
- Add a `guardTripwire(ticker)` helper that routes to the $7 checkout for a single-ticker unlock, and a
  `hasDeepDive(ticker)` check the report/valuation/charts pages consult.

**Acceptance:** a brand-new visitor landing on `/app?check=NVDA` from an ad sees a **full fair-value
verdict with no modal**, then is asked to sign up only when they go for a *second* action.

---

## 4. The data model (`src/lib/store.ts`)

The account model must express cadence, renewal, tripwire ownership, and expansion — none exist today.

- **`Account`** gains:
  - `cadence: "annual" | null` and `plan: Tier` (already via `tier`).
  - `termStartedAt` / `renewsAt` (replace the bare `proSince` for renewal logic ⑥).
  - `isIntroTerm: boolean` (first-year $99 vs renewal price) — drives renewal nurture + correct CAPI
    `value`.
  - `deepDives: string[]` — tickers unlocked via the $7 tripwire (so `hasDeepDive` works).
- **`upgrade(tier)`** → `subscribeAnnual(tier, { intro })` and a new `buyDeepDive(ticker)`; each must
  set the fields above and emit the right analytics event (§6).
- **Usage** stays monthly for the free quota; renewal is annual — keep them separate (they already are).
- **Retention surface:** a derived `renewalStatus()` (`active | renewing-soon | lapsed`) the app/HubSpot
  use for the nurture in ⑥.

> Validation-MVP billing still has no backend; `subscribeAnnual` flips tier optimistically on Stripe
> return, exactly as `upgrade` does now. Real billing is a later concern.

---

## 5. Screen changes (minimal, message-matched to Meta)

| Screen / component | Change |
|---|---|
| `/app` welcome ([app/page.tsx](<../../src/app/(app)/app/page.tsx>)) | First verdict ungated; usage meter only after signup; CTA copy = the won ad hook ("type any ticker → AI verdict in 5 sec") |
| `FairValueCheck` | After the anonymous verdict, show the **teased** memo/valuation/charts + dual CTA: **"$7 full deep-dive"** vs **"$99/yr unlock everything"** |
| `UpgradeModal` ([UpgradeModal.tsx](../../src/components/conversion/UpgradeModal.tsx)) | Prices show **/yr** not `/mo`; show **renewal struck-through to $99 intro**; **category anchor** ("vs Seeking Alpha $299, Motley Fool $199"); add the **$7 tripwire** as the low-commitment option; **Premium order-bump** checkbox; **money-back guarantee** line |
| `SignupModal` | Reason copy = "save your results / run another" (post-wow framing); fire `CompleteRegistration` (CAPI) on verify |
| `(marketing)/pricing` | Reframe to the annual ladder + guarantee; remove `/mo` anchoring |
| `(marketing)` landing | Lead with the free-verdict hook; one-page path to `/app?check=` |
| `/intel` (Premium) | Basic users see the desk teaser + "Add AI Intelligence" annual upsell (⑤ touchpoint 2) |

**Compliance copy (every surface):** keep "Research & education — not investment advice."; no
returns/"get rich"/guarantee-of-performance language (distinct from the money-**back** guarantee, which
is allowed). Real screens only.

---

## 6. Analytics / event rewrite (`src/lib/analytics.ts`) — the Meta core

Current file is **browser-pixel only** and its events don't match the machine. This is the Step 5
spec's product-side prerequisite; stub the surface now so the funnel emits correctly.

- **Add server-side CAPI** alongside `fbq`, with **event deduplication** (shared `event_id`) so the
  optimized event is attributed once. (Full spec → Step 5; the event *names + payloads* are fixed here.)
- **The event ladder (rename to match the machine):**
  | Machine rung | Event | Payload |
  |---|---|---|
  | ① free verdict | `ViewVerdict` (custom) | `{ ticker }` |
  | ② account | `CompleteRegistration` | `{}` ← **launch optimization event** |
  | ③ tripwire | `Purchase` | `{ value: 7, currency:"USD", content_type:"tripwire", ticker }` |
  | ④ annual | `Purchase` | `{ value: 99\|279\|299, currency:"USD", content_type:"subscription", plan, cadence:"annual" }` ★ |
  | ⑤ expansion | `Purchase` | `{ value: ~100, content_type:"expansion", plan:"premium" }` |
- **Fix `predicted_ltv`:** `trackSubscribe` currently sends `value*12` (monthly assumption) — wrong for
  annual. Send the **modeled blended LTV** (~$528–598) or omit; never a monthly extrapolation.
- **Deprecate** `StartTrial`/`Lead` semantics in the header comment; the launch event is
  `CompleteRegistration`, graduating to `Purchase` (per recon §4 / machine §7).
- **Finance-domain caveat:** verify Purchase/Lead aren't filtered on our domain; keep a `trackCustom`
  fallback event ready (recon §3).

---

## 7. Meta-specific requirements (non-product, but the product must respect)

- **Special Ad Category** declared on every campaign → **no income/behavior targeting, age 18–65+, no
  classic Lookalikes.** Product implication: the **free-verdict hook + self-selecting creative** must
  do the targeting the platform won't. Build the hook to qualify hard.
- **Audiences the product must feed** (via the CAPI events above):
  - Custom Audiences: `ViewVerdict`-no-`CompleteRegistration`, signed-up-no-tripwire,
    tripwire-no-annual → retargeting ladder.
  - **Special Ad Audience** seeded from `Purchase`-annual buyers (the Lookalike replacement).
- **Suppression:** exclude paying customers from prospecting (needs the customer audience populated).

---

## 8. Rollout sequencing & guardrails

1. **Now (for Step 3 WTP test):** ship behind existing gating — the **$7 tripwire path**, the **annual
   $99→$279/$299 Stripe paths** (runtime-switchable price), and the **value-before-gate** change so the
   test sends real traffic the real funnel. **No deploy** (Step 7).
2. **Step 4:** full screen refinement (§5), expansion order-bump, retention model (§4 ⑥).
3. **Step 5:** wire CAPI + dedup per the event table (§6).
4. **Kill-switch (carried from recon):** if measured CAC pushes blended **LTV : CAC < 3:1**, stop scaling
   — the model breaks at the $250 stress CAC, so the lever is driving CAC down (creative/retargeting),
   not discounting below the category floor.

---

## 9. Definition of done (acceptance criteria)

- [ ] Cold visitor on `/app?check=TICKER` gets a **full verdict with zero modal**; gate appears only on
      the 2nd action. (`ViewVerdict` fires.)
- [ ] Signup fires **`CompleteRegistration`** server-side, deduped.
- [ ] A **$7 deep-dive** can be bought (card-on-file) and unlocks the full report for that ticker;
      `Purchase{content_type:"tripwire"}` fires once.
- [ ] Paywall shows **annual $99 intro / $279–299 renewal** with category anchor + money-back guarantee;
      no `/mo` anywhere in the headline path.
- [ ] Annual purchase fires **`Purchase{content_type:"subscription", cadence:"annual", plan, value}`**;
      `predicted_ltv` is the modeled LTV, not `value*12`.
- [ ] Premium expansion offered as an order-bump **and** an in-app `/intel` upsell;
      `Purchase{content_type:"expansion"}` fires.
- [ ] Account model carries `cadence`, `renewsAt`, `isIntroTerm`, `deepDives`; `renewalStatus()` works.
- [ ] Not-advice disclaimer intact on hook, report, paywall; no performance-claim copy anywhere.

---

#### Inputs
- [meta-recon.md](./meta-recon.md) · [conversion-machine.md](./conversion-machine.md)
- Code touched: [tiers.ts](../../src/lib/tiers.ts) · [useGate.ts](../../src/lib/useGate.ts) ·
  [store.ts](../../src/lib/store.ts) · [analytics.ts](../../src/lib/analytics.ts) ·
  [UpgradeModal.tsx](../../src/components/conversion/UpgradeModal.tsx) ·
  [app/page.tsx](<../../src/app/(app)/app/page.tsx>)
