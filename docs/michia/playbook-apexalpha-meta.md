# ApexAlpha Growth Playbook — Pure Meta, Subscription-Only Edition

> **What this is.** The definitive playbook: **one channel (Meta), one revenue model
> (subscription).** No TikTok, no broker-affiliate rail. Every dollar of CAC must be repaid by
> subscription LTV alone — so the funnel and the offer ladder do all the work. Fully operable end to
> end through the **Meta Ads MCP**. The product stays fluid; it bends toward whatever Meta converts
> cheapest.

> **Run order:** top to bottom, one at a time. Steps 1–3 decide the offer and prove it pays on Meta
> *before* the product moves (Step 4). Don't reorder.

---

## The thesis: subscription LTV must out-earn Meta CAC, alone

With no affiliate rail, the only way pure-Meta is profitable is **LTV : CAC ≥ 3:1 from subscriptions
only.** Finance is a high-CPM vertical, so the funnel is engineered to (a) maximize conversion rate
and (b) maximize LTV per customer. The machine:

```
  Native/UGC Meta ad — the "wow" in 3 sec
        │   "type any ticker → AI verdict in 5 seconds"
        ▼
  Instant value, NO gate yet ─► one free verdict, zero friction      (max top-of-funnel CVR)
        ▼
  Capture account AFTER the wow ─► email/account once they're hooked
        ▼
  Card-on-file tripwire ─► $1 trial or $7 single deep-dive report     (impulse → buyer)
        ▼
  Annual subscription ($X/yr, intro→renewal ladder)                   (the core LTV)
        ▼
  Expansion + retention:
    • upsell Basic → Premium ($19 Intel terminal)  ─► more LTV, same customer
    • renewal nurture                              ─► annual LTV compounds
        ▲
  Retarget free users with Meta Custom Audiences (still pure Meta)
```

Every element exists to move one of the two numbers:
- **Lift CVR / cut CAC:** value-before-gate, native UGC creative, server-side CAPI signal, broad
  Advantage+ targeting, retargeting in-channel.
- **Lift LTV:** annual billing (not monthly), intro→renewal ladder, card-on-file tripwire,
  Basic→Premium expansion, renewal nurture.

**Money anchors (why annual + expansion, not $9/mo):** category buyers pay annually — Motley Fool
Stock Advisor ~$99 intro → $199 renewal, Seeking Alpha Premium ~$299/yr. A monthly $9 SKU can't
absorb finance-vertical Meta CAC; an annual ladder plus a $19 Premium expansion can.

## Tooling & compliance

- **Meta Ads MCP** runs the whole acquisition side: campaigns, ad sets, ads, pixel/CAPI setup,
  Custom/Lookalike Audiences, Ads Library research, performance reads. **Higgsfield MCP** for
  creative, **Supermetrics** for cross-checking spend/revenue, **HubSpot** for nurture/renewal,
  **Vercel MCP** to ship.
- **Compliance (Meta finance ads):** no promised/implied returns, no "get rich," no fabricated
  track records. Keep the **research-&-education, not investment advice** framing and **real product
  screens only**. Build every creative compliant by construction or you burn budget on rejections.

---

## Step 1 — Meta buyer & market recon *(was: blue-ocean ideation)*

```
ApexAlpha is a live web app: type a ticker → instant fair-value verdict + a streaming hedge-fund-
style AI memo + a 5-year valuation model + charts, plus a Premium "AI Intelligence" terminal.
Research & education tool, not investment advice. We acquire ONLY through Meta ads and monetize
ONLY through subscriptions (no affiliate). The product is fluid and bends toward what Meta converts.

Research, with current data:
1. Who on Meta (Facebook/Instagram) actually pays for retail equity research — demographics, buying
   power, and what they currently subscribe to (Motley Fool, Seeking Alpha, etc.) at what price.
2. Current US finance/investing Meta CPMs and realistic cost-per-purchase ranges for a self-serve
   research subscription.
3. Meta's financial-services ad-policy constraints and whether this product needs special-category
   handling; what creative claims get rejected.
4. The Meta conversion event we should ultimately optimize for, and the path to it given low early
   volume (which upstream proxy to start on).
Output a recommendation: the target Meta buyer, the offer direction, and the optimized event.

Save to docs/meta-gtm/meta-recon.md.
```

## Step 2 — The offer & the subscription conversion machine *(was: product spec)*

```
Using docs/meta-gtm/meta-recon.md, define the conversion machine — the funnel + LTV ladder, not a
feature list. No affiliate anywhere; all revenue is subscription:
1. The free hook: the exact "type a ticker → instant verdict" experience shown BEFORE any gate.
2. The gate: what we capture and when (after the wow), and why that ordering maximizes conversion.
3. The tripwire: a card-on-file offer ($1 trial or $X single deep-dive report) and why it lifts
   downstream conversion.
4. The core offer: annual subscription price + intro→renewal ladder (lean on category anchors).
5. The expansion: Basic → Premium ($19 Intel terminal) upsell — when and how it's offered.
6. Retention: the renewal mechanic that makes annual LTV compound.
7. The ONE Meta conversion event we optimize for; the Custom/Lookalike Audiences we build.
8. Objection-killers + risk-reversal (free verdict, money-back) + the not-advice line.

Save as docs/meta-gtm/conversion-machine.md.
```

## Step 3 — Prove the offer pays on Meta BEFORE building *(was: generate mockups)*

> The product is fluid, so don't refine it until a small Meta spend shows the offer clears CAC.

```
Design a small Meta willingness-to-pay test ($150–300) that sends the SAME hook→funnel to real
traffic, using the EXISTING app + real product screens as the probe. Define:
1. Two annual price points to test (e.g. intro $X vs $Y) plus the tripwire, via real Stripe paths.
2. The decision metric: cost-per-paying-customer (and tripwire→annual rate) — NOT clicks or emails.
3. The minimum sample + the rule for declaring the winning offer/price.
4. A back-of-envelope LTV (annual + expected Premium expansion + one renewal) vs the measured CAC,
   and whether it clears LTV : CAC ≥ 3:1.

Save to docs/meta-gtm/wtp-test.md. Implement the checkout paths behind existing gating. Do not scale
and do not refine the product until the data is in. No deploy yet (Step 7).
```

## Step 4 — Shape the funnel & product for one-click conversion *(was: build the landing page)*

```
Take the winning offer/price from Step 3. Refine the EXISTING app + marketing pages
(src/app/(marketing) + the gated app) for maximum Meta conversion — minimal product change:
1. Value-before-gate: cold traffic gets one real verdict with no signup wall; capture the account
   right after.
2. Frictionless path: message-match the landing to the winning ad hook, one-page checkout, annual
   default + the card-on-file tripwire, money-back guarantee visible.
3. Re-package tiers in src/lib/tiers.ts to the won annual price/ladder; make Basic→Premium expansion
   a clear in-app upsell.
4. Build retargeting hooks (events/audiences) so free users can be re-touched on Meta.

Apply edits to existing code; don't rebuild. Keep the not-advice disclaimer. No deploy yet.
```

## Step 5 — Instrument ONE purchase event, server-side via CAPI *(was: pixel fires on email)*

```
Set up clean, server-side conversion tracking so Meta optimizes on the cheapest accurate signal:
1. Implement Meta CAPI alongside the browser pixel in src/lib/analytics.ts, with event
   deduplication, so the optimized event is reliably attributed.
2. Make the purchase event carry value + plan + cadence; ensure tripwire and Premium-expansion
   events are tracked so LTV is measurable per customer.
3. Set campaign optimization to the closest-to-money signal volume allows — start on tripwire/signup
   to learn, graduate to the annual-purchase event; document the graduation threshold.
4. Define the CAC : LTV target (≥ 3:1 from subscriptions only) and the KILL-SWITCH rule if it breaks.

Save the spec to docs/meta-gtm/conversion-tracking.md. Walk the funnel; verify every event fires once.
```

## Step 6 — Native/UGC Meta creative at volume *(was: 20 generic ads)*

> Creative is the #1 lever on Meta CAC. High velocity, native, real product — not polished ads.

```
Using docs/meta-gtm/conversion-machine.md and the REAL product, produce Meta creative with the
Higgsfield MCP (Marketing Studio):
- Formats native to Meta: UGC-style screen-recording video ("watch AI judge this stock in 5 sec"),
  plus static/Advantage+ value-optimized variants.
- Lead with a real product moment (instant verdict, streaming memo, valuation model). No fabricated
  UI, no fabricated returns, no "get rich" — keep the not-advice line. Compliant by construction.
- Batch multiple hooks × openers for high creative velocity (the cheapest CAC lever).

Save to docs/meta-gtm/marketing-assets/, foldered by hook, named for the product moment used.
```

## Step 7 — Ship & launch on Meta *(was: deploy to Vercel)*

```
1. Use the Vercel MCP to deploy the funnel + CAPI tracking to production. On the live URL verify:
   value-before-gate works, the tripwire + annual checkout + Premium upsell work, and the server-
   side purchase event fires end-to-end. Send me the live URL + pass/fail checklist.
   Token if needed: [VERCEL TOKEN]
2. Using the Meta Ads MCP, build (don't auto-publish) the launch structured for fast, cheap learning:
   a consolidated Advantage+ campaign, broad targeting, optimize for the ONE purchase event, with a
   Lookalike seed plan (from purchasers) and a retargeting set (from free users). All budget on Meta.
   Label everything for attribution. Save for me to inspect before publishing.
```

## Step 8 — Conversion-rate optimization loop *(was: upload ads)*

> Cheapest lever first — lift each funnel step before buying more traffic.

```
Run a structured CRO loop on Meta, attacking the biggest leak first:
1. Map drop-offs via the Meta MCP / Supermetrics: ad CTR → free verdict → account → tripwire →
   annual → Premium.
2. For the biggest leak, run the cheapest fix one variable at a time: new creative hook (Higgsfield),
   landing/headline test, checkout-friction removal, tripwire price, or retargeting copy.
3. Keep what lowers cost-per-purchase and raises LTV; cut the rest.

Save each round's verdict to docs/meta-gtm/cro-log.md.
```

## Step 9 — Scale on CAC:LTV, creative velocity & retention *(was: scale lowest cost-per-lead)*

```
Using the Meta Ads MCP + Supermetrics (and HubSpot for nurture/renewal):
1. Scale budget only while blended CAC : LTV holds ≥ 3:1; trip the kill-switch on anything that
   breaks it. Pour spend into the winning creative + Lookalike/retargeting audiences.
2. Keep creative velocity high — fresh native/UGC variations of winners (Higgsfield), rotated before
   fatigue, are the durable CAC lever on a single channel.
3. Grow LTV: graduate optimization to the purchase event as volume allows, push Basic→Premium
   expansion, and run the renewal nurture (HubSpot) that compounds annual LTV.
4. Write the verdict back to docs/meta-gtm/conversion-machine.md AND propose the product changes the
   winning funnel implies. The product becomes what Meta converted cheapest.
```

---

### What changed vs the prior versions

- **Pure Meta.** TikTok and the channel head-to-head are gone; all spend and tooling are Meta, fully
  driven by the Meta Ads MCP.
- **Subscription-only.** The broker-affiliate rail is removed everywhere. Lost LTV is recovered by an
  **annual ladder + card-on-file tripwire + Basic→Premium expansion + renewal nurture** — so
  LTV : CAC ≥ 3:1 must hold on subscriptions alone.
- **One purchase event, server-side (CAPI)**; optimization graduates from signup/tripwire to the
  annual purchase as volume grows.
- **Creative velocity + retention** are the two scaling levers, governed by a hard CAC : LTV
  kill-switch.

> This file supersedes `playbook-apexalpha-single-channel.md` for execution. The money-first
> multi-channel rationale remains in `playbook-apexalpha.md` for reference.
