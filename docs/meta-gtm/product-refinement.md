# Step 4 — Product Refinement (as-built)

> **What this is.** Step 4 of [playbook-apexalpha-meta.md](../michia/playbook-apexalpha-meta.md):
> shape the EXISTING app + marketing pages for one-click Meta conversion at the won offer/price —
> minimal product change, no rebuild. This doc records the **as-built** state, validated against the
> code, and is the execution record for the [product-revision blueprint](./product-revision.md).
> **No deploy** (that's Step 7). Date: 2026-06-25. Branch: `nextjs-version`.

The won configuration (from Steps 1–3): free ungated verdict → account gate → **$7 tripwire** →
annual **$99 intro → $279/$299 renewal** → **Premium expansion (+$100/yr)** → **retention r ≥ 0.58–0.60**.
Every refinement below moves one of the two numbers the LTV : CAC ≥ 3:1 math depends on.

---

## 1. The four Step-4 requirements → as-built

### ① Value-before-gate — cold traffic gets one real verdict, account captured right after
- `guardQuota("checks", …)` runs the **first anonymous verdict with no modal**, tracked via the
  `apex-alpha-anon-verdicts` localStorage counter; the signup gate fires only on the **2nd** action.
  ([useGate.ts](../../src/lib/useGate.ts) `guardQuota`)
- Ad deep-link `/app?check=TICKER` runs straight into the ungated verdict.
  ([app/page.tsx](<../../src/app/(app)/app/page.tsx>))
- The full memo (the heavier action) is the natural account gate; `ViewVerdict` fires on the free
  verdict, `CompleteRegistration` on signup. ([FairValueCheck.tsx](../../src/components/app/FairValueCheck.tsx),
  [SignupModal.tsx](../../src/components/conversion/SignupModal.tsx))

### ② Frictionless path — message-matched, annual default + tripwire, guarantee visible
- **Landing** leads with the won hook ("type any ticker → AI fair-value verdict in seconds — free, no
  card") and hands off to `/app?check=`. ([LandingHero.tsx](../../src/components/marketing/LandingHero.tsx))
- **Pricing** + **paywall** show the **annual ladder** ($99 intro struck through from the renewal
  price), a **category anchor** (Seeking Alpha $299 / Motley Fool $199), and a **30-day money-back
  guarantee** on every surface. ([PricingTable.tsx](../../src/components/marketing/PricingTable.tsx),
  [UpgradeModal.tsx](../../src/components/conversion/UpgradeModal.tsx))
- **One-click checkout:** Stripe Payment Links with a prefilled promo code + email; the pending
  purchase is replayed on return (`?upgraded=1`). ([checkout.ts](../../src/lib/checkout.ts),
  [UpgradeReturnHandler.tsx](../../src/components/conversion/UpgradeReturnHandler.tsx))
- **Tripwire** ($7 single-ticker) appears beside the verdict and inside the paywall for the ticker in
  context. ([FairValueCheck.tsx](../../src/components/app/FairValueCheck.tsx) `fvc-unlock`)

### ③ Tiers re-packaged to the annual ladder; Basic→Premium expansion is a clear in-app upsell
- [tiers.ts](../../src/lib/tiers.ts): cadence is **annual** (`ANNUAL_INTRO_PRICE=99`,
  `ANNUAL_RENEWAL_PRICE`, `PREMIUM_EXPANSION_DELTA=100`); the $7 `TRIPWIRE` is a one-off product, not a
  Tier. The monthly model is retired.
- **Expansion, two touchpoints:**
  1. **Order-bump** — "＋ Add the AI Intelligence desk (+$100/yr)" checkbox on the Basic card in the
     paywall. ([UpgradeModal.tsx](../../src/components/conversion/UpgradeModal.tsx) `upg-bump`)
  2. **In-app upsell** — Basic subscribers landing on `/intel` see "Add AI Intelligence — +$100/yr".
     ([intel/page.tsx](<../../src/app/(app)/intel/page.tsx>) `intel-upsell`)
- The $7 tripwire genuinely unlocks the memo/valuation/charts/export for that ticker, enforced in
  [ProGate.tsx](../../src/components/app/ProGate.tsx) and `guardPro`/`guardQuota` (which consult
  `hasDeepDive(ticker)`), and **not** the Premium-only Intelligence terminal.

### ④ Retargeting + retention hooks — re-touch free users and hold subscribers on Meta
- **Funnel events** (pixel + CAPI, shared `event_id`) delineate every retargeting segment:
  `ViewVerdict`, `CompleteRegistration`, `Purchase{tripwire|subscription|expansion}`.
  ([analytics.ts](../../src/lib/analytics.ts))
- **NEW this step — the retention surface.** `renewalStatus()` existed in the store but rendered
  nowhere; Step 4 wires it to a UI. [RenewalBanner.tsx](../../src/components/conversion/RenewalBanner.tsx)
  (mounted in the [app shell](<../../src/app/(app)/layout.tsx>)) shows:
  - **renewing-soon** (≤30 days before `renewsAt`): an informational nudge with the renewal date +
    price → cuts involuntary churn, lifts retention `r`.
  - **lapsed** (past `renewsAt`): a win-back with a one-click **Renew now** → `startSubscriptionCheckout`.
  - On appearance it fires **`RenewalPrompt{status, plan}`** (custom, CAPI-deduped) so Meta can build
    the **renewal-nurture** and **win-back** retargeting audiences. ([analytics.ts](../../src/lib/analytics.ts)
    `trackRenewalPrompt`)
  - Dismissible per session; gated behind a `mounted` check (persisted tier is unknown on the server),
    matching the `ProGate`/`AccountBadge` hydration pattern.

---

## 2. Retargeting / audience map (the product feeds these; built in Meta at Step 7)

| Audience | Built from (product signal) | Use |
|---|---|---|
| **Prospect retarget** | `ViewVerdict` **and not** `CompleteRegistration` | Re-touch anonymous verdict-viewers who didn't sign up |
| **Signup→tripwire** | `CompleteRegistration` **and not** `Purchase{tripwire}` | Push the $7 impulse buy |
| **Tripwire→annual** | `Purchase{tripwire}` **and not** `Purchase{subscription}` | Push the annual upgrade |
| **Special Ad Audience seed** | `Purchase{subscription, cadence:annual}` buyers | Lookalike replacement (finance Special Ad Category) |
| **Renewal nurture** | `RenewalPrompt{status:"renewing-soon"}` | Hold subscribers through renewal |
| **Win-back** | `RenewalPrompt{status:"lapsed"}` | Recover lapsed customers |
| **Suppression** | `Purchase{subscription}` buyers | Exclude payers from prospecting |

> Special Ad Category constraints (age 18–65+, no income/behavior targeting, no classic Lookalikes)
> mean the **free-verdict hook + self-selecting creative** do the qualifying the platform won't.

---

## 3. Compliance (intact on every refined surface)
- "Research & education — not investment advice." on the hook, verdict, report, paywall, and signup.
- No returns / "get rich" / performance-guarantee language. The **money-back** guarantee is allowed and
  is distinct from a performance guarantee.
- Real product screens only.

---

## 4. Definition of done (blueprint §9) — verified

- [x] Cold visitor on `/app?check=TICKER` gets a **full verdict with zero modal**; gate appears on the
      2nd action. `ViewVerdict` fires.
- [x] Signup fires **`CompleteRegistration`** (pixel + CAPI, deduped).
- [x] A **$7 deep-dive** unlocks the full report for that ticker; `Purchase{content_type:"tripwire"}`
      fires once.
- [x] Paywall shows **annual $99 intro / $279–299 renewal** + category anchor + money-back guarantee;
      no `/mo` in the headline path.
- [x] Annual purchase fires **`Purchase{content_type:"subscription", cadence:"annual", plan, value}`**
      with `predicted_ltv = MODELED_LTV` (never value×12), and `wtp_cell`.
- [x] Premium expansion offered as an **order-bump** AND an in-app `/intel` upsell;
      `Purchase{content_type:"expansion"}` fires.
- [x] Account model carries `cadence`, `renewsAt`, `isIntroTerm`, `deepDives`; `renewalStatus()` works
      **and is now surfaced** (RenewalBanner) — the retention loop is closed.
- [x] Not-advice disclaimer intact; no performance-claim copy anywhere.

## 5. Verification done
- `tsc --noEmit` clean.
- Browser preview (`/app`, seeded account): **renewing-soon** banner →
  *"Your annual plan renews on Jul 5, 2026 at $299/yr — you keep unlimited access, cancel anytime."*;
  **lapsed** banner → *"Your annual plan has lapsed — renew to restore…"* with a **Renew now** CTA.
  `RenewalPrompt` beacon to `/api/meta/capi` confirmed (200) on banner appearance. No console errors.
- Live Stripe redirect NOT exercised (real charge on submit — LIVE mode).

## 6. What's left (out of Step 4)
- **Step 5** — the real CAPI Graph API send in [capi/route.ts](<../../src/app/api/meta/capi/route.ts>)
  (still a stub); graduation thresholds; `docs/meta-gtm/conversion-tracking.md`.
- Set env vars in Vercel; restart dev to load link env locally.
- Nothing committed or deployed (Step 7).

#### Files touched this step
- New: [RenewalBanner.tsx](../../src/components/conversion/RenewalBanner.tsx)
- Edited: [analytics.ts](../../src/lib/analytics.ts) (`trackRenewalPrompt`) ·
  [(app)/layout.tsx](<../../src/app/(app)/layout.tsx>) (mount) · [globals.css](../../src/app/globals.css)
  (`.renewal-banner`)
- Validated as-built (no change needed): tiers, useGate, store, checkout, experiment, UpgradeModal,
  PricingTable, LandingHero, FairValueCheck, ProGate, SignupModal, intel.
