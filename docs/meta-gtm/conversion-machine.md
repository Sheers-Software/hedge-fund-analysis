# Step 2 — The Offer & The Subscription Conversion Machine (US, Meta-Only)

> **What this is.** The conversion machine — the **funnel + LTV ladder**, not a feature list — derived
> from [meta-recon.md](./meta-recon.md). US market only, acquisition 100% Meta, revenue 100%
> subscription (no affiliate). Every element moves one of the two numbers that decide survival: **lift
> CVR / cut CAC**, or **lift LTV**, so that **LTV : CAC ≥ 3:1 holds at the $180 planning CAC.**
>
> **Status: AS BUILT.** The product realignment ([product-revision.md](./product-revision.md)) is
> complete — this rerun maps each rung to the **shipped code** and validates it against the spec.
> Boundaries to later steps (full CAPI send = Step 5, audiences = Step 7, renewal nurture = Step 9) are
> called out in §10. Still **no deploy** (Step 7).
>
> **The won configuration (recon rows C–E):** free ungated verdict → account gate → **$7 tripwire** →
> **annual $99 intro → $279/$299 renewal** → **≥20% Premium expansion** → **retention r ≥ 0.58–0.60**.
> Blended **LTV ~$528–598 = 2.9–3.3:1** at $180 CAC.

---

## The machine at a glance

```
  Meta ad (UGC, real product moment) ── "type any ticker → AI verdict in 5 sec"
        ▼
① FREE HOOK  ── one real fair-value verdict, ZERO gate           [CVR ↑ / CAC ↓]   ViewVerdict
        ▼   (the "wow": instant verdict + teased memo/valuation/charts/intel)
② GATE  ── capture account on the 2nd action (after the wow)     [launch event]    CompleteRegistration
        ▼
③ TRIPWIRE ── $7 single-ticker deep-dive, card-on-file          [impulse → buyer] Purchase(tripwire)
        ▼
④ CORE OFFER ── annual $99 intro → $279/$299 renewal            [the LTV engine]  Purchase(subscription) ★
        ▼
⑤ EXPANSION ── Basic → Premium AI-Intelligence (order-bump+upsell)[more LTV]      Purchase(expansion)
        ▼
⑥ RETENTION ── renewal model (renewsAt/isIntroTerm), r ≥ 0.58–0.60[LTV compounds]
        ▲
⑦ RETARGET ── free/abandoner Custom + Special Ad Audiences       [CAC ↓]          (Step 7)
```

**★ = the single event we ultimately optimize for. We *launch* on ② and graduate down (§7).** All
conversion events fire through the pixel **and** CAPI with a shared `event_id` for dedup
([analytics.ts](../../src/lib/analytics.ts)).

---

## ① The free hook — value before any gate ✅ BUILT

Cold Meta traffic gets a **full fair-value verdict with no account, no modal.** This was the most
expensive leak in the pre-realignment funnel (signup was forced before the first check); it is now
fixed.

- **As built:** `guardQuota` allows **one anonymous verdict** via a localStorage counter
  (`apex-alpha-anon-verdicts`) before any gate ([useGate.ts:66–96](../../src/lib/useGate.ts)). The ad's
  ticker pre-fills through `?check=TICKER` on `/app`.
- **The wow + the tease:** `FairValueCheck` renders the verdict, then surfaces locked CTAs to the full
  memo / Intelligence / valuation **and** the dual unlock block (③) — proof of depth behind the gate
  ([FairValueCheck.tsx:147–193](../../src/components/app/FairValueCheck.tsx)).
- **Event:** `trackViewVerdict(ticker)` fires once per ticker
  ([FairValueCheck.tsx:60–64](../../src/components/app/FairValueCheck.tsx)).
- **Free-tier copy** now leads with "1 free fair-value verdict — no account needed"
  ([tiers.ts:107](../../src/lib/tiers.ts)).

**Rule (enforced):** the first verdict is free and ungated, every time — the top-of-funnel CVR
multiplier and the cheapest CAC lever we own.

## ② The gate — capture the account right after the wow ✅ BUILT

**What we capture:** email + password. **When:** the 2nd action — a second verdict, the full memo,
save, or export. Not before.

- **As built:** once `anonVerdictsUsed() ≥ 1`, `guardQuota` opens signup with post-wow copy ("Save your
  results — create a free account to run another check.") and resumes the pending action after auth
  ([useGate.ts:74–80](../../src/lib/useGate.ts)). Reports (the heavier action) gate at signup
  immediately — the natural ② trigger.
- **Why this ordering converts:** the visitor already holds a result, so the ask is "save / continue,"
  not a toll on a stranger — reciprocity + endowment. This is the difference between a 30%-and-an-
  account funnel and a 5%-bounce funnel at finance CPMs.
- **Event (launch optimization target):** `trackCompleteRegistration()` fires on successful email
  verification ([SignupModal.tsx:69](../../src/components/conversion/SignupModal.tsx)), deduped via CAPI.

## ③ The tripwire — $7 card-on-file deep-dive ✅ BUILT

A **$7 single-ticker deep-dive** (full memo + valuation + charts + export for that one name). Chosen
over a $1 trial because it (1) puts a **real card on file** — the strongest predictor of downstream
annual conversion, (2) **recovers some revenue against CAC**, and (3) **self-selects intent** ($7
filters tire-kickers).

- **As built:** `TRIPWIRE` product ($7) in [tiers.ts:168](../../src/lib/tiers.ts);
  `startTripwireCheckout` / `buyDeepDive` record ownership on `account.deepDives[]`
  ([checkout.ts:119–129](../../src/lib/checkout.ts), [store.ts:420–428](../../src/lib/store.ts)).
- **Placement:** offered next to the annual plan both in `FairValueCheck` (post-verdict block) and at
  the top of the paywall for the in-context ticker
  ([UpgradeModal.tsx:65–78](../../src/components/conversion/UpgradeModal.tsx)).
- **Unlock scope:** the tripwire covers memo/valuation/charts/export but **NOT** the Premium-only AI
  Intelligence desk (`tripwireCovers`, [useGate.ts:114–118](../../src/lib/useGate.ts)).
- **Event:** `Purchase{value:7, content_type:"tripwire", ticker}`.

## ④ The core offer — annual, reverse-engineered to clear 3:1 ✅ BUILT

**$99 first-year intro → $279/$299 renewal, annual billing only.**

- **As built:** cadence is `"annual"`; `ANNUAL_INTRO_PRICE=99`,
  `ANNUAL_RENEWAL_PRICE` defaults $279 and is **runtime-switchable** to $299 via
  `NEXT_PUBLIC_ANNUAL_RENEWAL_PRICE` ([tiers.ts:75–83](../../src/lib/tiers.ts)) — this is the Step 3
  WTP A/B with no redeploy.
- **Why this price, not Fool's $99→$199:** at $199 the model only hits ~2.1:1 at $180 CAC; the
  Seeking-Alpha-tier **$279–299 renewal** pushes blended LTV to $528–598 = **2.9–3.3:1** (recon §4).
- **Presentation:** renewal struck through to the $99 intro, "Renews at $X/yr · cancel anytime," plus a
  **category anchor** ("Seeking Alpha $299/yr · Motley Fool $199/yr — same category, a fraction of the
  price") on both the paywall and the marketing pricing table
  ([UpgradeModal.tsx:93–143](../../src/components/conversion/UpgradeModal.tsx),
  [PricingTable.tsx:47–66](../../src/components/marketing/PricingTable.tsx),
  [CATEGORY_ANCHORS](../../src/lib/tiers.ts)).
- **Event:** `Purchase{content_type:"subscription", cadence:"annual", plan, value}`, with
  `predicted_ltv = MODELED_LTV (560)` — **never** `value×12` (the old monthly bug is gone).

## ⑤ The expansion — Basic → Premium AI Intelligence ✅ BUILT

The Premium **AI Intelligence terminal** as an **annual add-on**, target **≥20% attach, +$100/yr**
(`PREMIUM_EXPANSION_DELTA`) — a *required input* to the 3:1 math.

- **As built, two paths:**
  1. **Order-bump at checkout** — a checkbox on the Basic plan adds the desk; checkout buys Premium and
     `applyPurchase` decomposes it into base subscription + expansion events
     ([UpgradeModal.tsx:101–114](../../src/components/conversion/UpgradeModal.tsx),
     [checkout.ts:65–73](../../src/lib/checkout.ts)).
  2. **In-app `/intel` upsell** — `startExpansionCheckout` for Basic users who open the desk
     ([checkout.ts:107–117](../../src/lib/checkout.ts)).
- **Event:** `Purchase{content_type:"expansion", plan:"premium"}` so per-customer LTV is measurable.

## ⑥ Retention — the mechanic that compounds annual LTV ✅ MODEL BUILT / nurture pending

Retention is a **P0 number**: the model needs **r ≥ 0.58–0.60** annual renewal or 3:1 collapses.

- **As built:** the account carries `termStartedAt`, `renewsAt` (term + 1yr), and `isIntroTerm`
  (first-year $99 vs renewal — drives both nurture and the correct CAPI `value`);
  `renewalStatus()` returns `active | renewing-soon | lapsed`
  ([store.ts:145–152, 255–301, 391–408](../../src/lib/store.ts)).
- **Levers in place:** annual lock-in by default (a year before any churn decision); engagement
  surfaces (history/watchlist) already exist.
- **Pending (Step 9):** the HubSpot renewal nurture (value recap → reminder → win-back) that consumes
  `renewalStatus()`. The data model is ready for it.

## ⑦ The ONE Meta event + the audiences

- **The ONE event:** **`Purchase` (annual subscription)**. Because volume is thin at launch, optimize
  on **`CompleteRegistration` (②)**, graduate to **`Purchase`-tripwire (③)**, then **`Purchase`-annual
  (④)** as each clears ~50 conv/ad-set/wk (graduation thresholds → Step 5).
- **Audiences (Special-Ad-Category-legal — no classic Lookalikes; Step 7 build):**
  - **Custom Audiences** from the funnel events: `ViewVerdict`-no-`CompleteRegistration`,
    signed-up-no-tripwire, tripwire-no-annual → the retargeting ladder.
  - **Seed:** a **Special Ad Audience** from `Purchase`-annual buyers (the finance-category replacement
    for a purchaser Lookalike).
  - **Suppression:** exclude existing customers from prospecting.
- **As built (product side):** all five events emit with payloads + dedup ids so the audiences above are
  populatable the moment the campaign is wired ([analytics.ts:109–153](../../src/lib/analytics.ts)).

## ⑧ Objection-killers, risk-reversal & the not-advice line ✅ BUILT

| Objection | Killer (in the funnel) | As built |
|---|---|---|
| "Is it any good?" | Free ungated verdict | ① `guardQuota` anon verdict |
| "Will it work for *my* ticker?" | Hook runs on **their** ticker | `?check=TICKER` |
| "$99 is a lot to risk." | $7 tripwire on-ramp | ③ |
| "What if I don't like it?" | **30-day money-back guarantee** | UpgradeModal/PricingTable/LandingHero |
| "Is this hype / a scam?" | Real screens + not-advice line | disclaimers throughout |
| "Why annual not monthly?" | Member price vs $199–299 category; $99 is the deal | category anchor |

**Risk-reversal stack (descending commitment):** free verdict → $7 tripwire → money-back guarantee —
each also satisfies a Meta compliance principle (real value, no pressure, clear terms). The **not-advice
line is permanent** on hook, report, and paywall (recon §3).

---

## 9. Build conformance — spec vs. shipped

| Rung | Spec | Shipped | Where |
|---|---|---|---|
| ① Free hook | 1 anonymous ungated verdict + `ViewVerdict` | ✅ | useGate.ts, FairValueCheck.tsx |
| ② Gate | signup on 2nd action + `CompleteRegistration` | ✅ | useGate.ts, SignupModal.tsx |
| ③ Tripwire | $7 card-on-file, single-ticker unlock | ✅ | tiers.ts, checkout.ts, store.ts |
| ④ Annual | $99→$279/$299, runtime-switch, anchors, strike | ✅ | tiers.ts, UpgradeModal.tsx, PricingTable.tsx |
| ⑤ Expansion | order-bump + `/intel` upsell, +$100/yr | ✅ | UpgradeModal.tsx, checkout.ts |
| ⑥ Retention | renewsAt/isIntroTerm/renewalStatus | ✅ model · ⏳ nurture | store.ts (nurture = Step 9) |
| ⑦ Events | 5 events, value+plan+cadence, dedup id | ✅ | analytics.ts |
| ⑧ Risk-reversal | guarantee + not-advice + free-first | ✅ | UpgradeModal/PricingTable/LandingHero |
| LTV fix | `predicted_ltv` = modeled, not value×12 | ✅ | tiers.ts MODELED_LTV, analytics.ts |

---

## 10. What is NOT in this step (boundaries)

- **Full CAPI server send → Step 5.** `/api/meta/capi` is a **stub** that accepts the deduped beacon and
  no-ops until `META_CAPI_DATASET_ID` + `META_CAPI_ACCESS_TOKEN` are wired
  ([capi/route.ts](<../../src/app/api/meta/capi/route.ts>)). The client already emits correct
  names/payloads/`event_id`s.
- **Audiences + campaign → Step 7** (Meta Ads MCP). Product emits the events; the audiences aren't built.
- **Renewal nurture → Step 9** (HubSpot). The `renewalStatus()` data model is ready.
- **Price decision ($279 vs $299) → Step 3** WTP test, then a powered follow-on (see
  [wtp-test.md](./wtp-test.md)).
- **No deploy → Step 7.**

---

## 11. Verification checklist (walk the funnel before any spend)

- [ ] Cold visitor on `/app?check=NVDA` (cleared `apex-alpha-anon-verdicts`) sees a **full verdict, no
      modal**; `ViewVerdict` fires.
- [ ] A **2nd** check/report opens signup; on verify, `CompleteRegistration` fires (deduped).
- [ ] `$7 this ticker` → tripwire checkout → returns unlocking the full memo for that ticker only;
      `Purchase{tripwire}` fires once; Intelligence stays locked.
- [ ] Paywall shows **renewal struck → $99 first year**, category anchor, money-back guarantee, **no
      `/mo` anywhere**; renewal price flips with `NEXT_PUBLIC_ANNUAL_RENEWAL_PRICE=299`.
- [ ] Annual purchase fires `Purchase{subscription, cadence:"annual", plan, value, predicted_ltv:560}`;
      account gets `renewsAt`/`isIntroTerm`.
- [ ] Basic order-bump and `/intel` upsell both fire `Purchase{expansion}` and set Premium.
- [ ] Not-advice disclaimer present on hook, report, paywall; no performance-claim copy.

---

#### Inputs / references
- [meta-recon.md](./meta-recon.md) · [wtp-test.md](./wtp-test.md) · [product-revision.md](./product-revision.md)
- Shipped code: [tiers.ts](../../src/lib/tiers.ts) · [useGate.ts](../../src/lib/useGate.ts) ·
  [checkout.ts](../../src/lib/checkout.ts) · [store.ts](../../src/lib/store.ts) ·
  [analytics.ts](../../src/lib/analytics.ts) · [capi/route.ts](<../../src/app/api/meta/capi/route.ts>) ·
  [FairValueCheck.tsx](../../src/components/app/FairValueCheck.tsx) ·
  [UpgradeModal.tsx](../../src/components/conversion/UpgradeModal.tsx) ·
  [SignupModal.tsx](../../src/components/conversion/SignupModal.tsx) ·
  [PricingTable.tsx](../../src/components/marketing/PricingTable.tsx)
