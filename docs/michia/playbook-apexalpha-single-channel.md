# ApexAlpha Growth Playbook — Single-Channel, Conversion-First Edition

> **What this is.** A version of the playbook built for **one paid channel only — pure Meta *or*
> pure TikTok** — engineered for the **lowest CAC at the highest conversion rate.** It picks the
> channel with a cheap head-to-head, then concentrates 100% of spend on the winner. The product
> stays fluid; the *funnel* is the product here.

> **Run order:** top to bottom, one at a time. Steps 1–3 pick the channel and the conversion
> machine with real money before you commit. Don't split spend across both channels — concentration
> is what makes paid social cost-effective.

---

## The cost-effectiveness thesis (commit to this)

**The most cost-effective high-conversion machine is the same on either platform — only the channel
and the optimized event differ:**

```
  Native/UGC ad (the "wow" in 3 sec)
        │   "type any ticker → AI verdict in 5 seconds"
        ▼
  Instant value, NO gate yet  ──►  one free verdict, zero friction  (max top-of-funnel CVR)
        ▼
  Capture account AFTER the wow  ──►  email/account once they're hooked
        ▼
  Card-on-file tripwire  ──►  $1 trial or $7 single deep-dive report  (impulse → buyer)
        ▼
  ┌─────────────────────────────┬─────────────────────────────────┐
  │  Annual upsell ($X/yr,       │  Affiliate rail: route non-payers│
  │  intro→renewal)              │  to a broker = $75–200/funded acct│
  └─────────────────────────────┴─────────────────────────────────┘
        ▲
  Retarget free users WITHIN the same channel (still "pure")
```

Why this is the cheapest path to the most conversions:
- **Value before the gate** beats every "sign up to try" funnel on conversion rate — the product's
  instant verdict + streaming memo is a genuine 3-second wow, rare for SaaS.
- **Card-on-file tripwire** converts impulse into a buyer relationship; subsequent annual conversion
  off a card-on-file user is multiples higher than cold.
- **Two rails on one traffic stream** — subscription LTV *and* broker-affiliate value — so the
  audience doesn't have to be rich for the spend to clear CAC.
- **One conversion event, optimized server-side** (Meta CAPI / TikTok Events API) = lower CAC than
  browser-pixel-only, because the algorithm learns from clean signal.

## Which channel: decided by your money rail, confirmed by a cheap test

| Pick **TikTok** as the single channel if… | Pick **Meta** as the single channel if… |
| --- | --- |
| The **affiliate/free-tool rail** is the main money | The **annual subscription** is the main money |
| You want the lowest cost-per-signup & viral reach | You want the lowest cost-per-*paying-subscriber* |
| Buyer skews younger / impulse | Buyer skews 30–55, affluent, considered purchase |
| You'll hand-operate campaigns (no TikTok MCP) | You want full automation via the **Meta Ads MCP** |

> **Prior to confirm in Step 3:** TikTok wins cost-per-signup; Meta wins cost-per-paid-subscriber.
> Let a small identical test decide, then concentrate everything on the winner.

## Tooling & compliance reality

- **Meta** is fully operable via the **Meta Ads MCP** (campaigns, ad sets, pixel/CAPI, Ads Library).
  **TikTok has no MCP here** — campaign ops are manual; use **Higgsfield** for creative and
  **Supermetrics** to read TikTok performance. Factor this effort cost into the channel choice.
- **Financial-services ad rules (both platforms):** no promised/implied returns, no "get rich,"
  no fabricated track records. Keep the **research-&-education, not investment advice** framing and
  use **real product screens only**. This is a hard compliance line in finance — bake it into every
  creative prompt.

---

## Step 1 — Channel + buyer recon *(was: blue-ocean ideation)*

```
ApexAlpha is a live web app: type a ticker → instant fair-value verdict + a streaming hedge-fund-
style AI memo + valuation model + charts. Research & education tool, not investment advice. We will
acquire customers through ONE paid channel only: either pure Meta or pure TikTok. The product is
fluid and will be refined toward what converts cheapest.

Research, with current data, which single channel is most cost-effective for THIS product/buyer:
1. For Meta and TikTok separately: typical CPMs for US finance/investing audiences, the audience's
   purchasing power, the native creative format that converts (Spark Ads vs Advantage+), and the
   financial-services ad-policy constraints/approvals on each.
2. Which channel is cheaper for (a) a free signup and (b) an actual paying subscriber, for a
   product like this.
3. The single conversion event each platform optimizes best for at low volume, and the server-side
   tracking each needs (Meta CAPI / TikTok Events API).
4. A recommendation: primary channel + the conversion event to optimize, with the reasoning tied to
   our money rail (subscription vs affiliate).

Save to docs/meta-gtm/channel-recon.md.
```

## Step 2 — The offer & the conversion machine *(was: product spec)*

```
Using docs/meta-gtm/channel-recon.md, define the single-channel conversion machine — the funnel,
not a feature list:
1. The free hook: the exact "type a ticker → instant verdict" experience shown BEFORE any gate.
2. The gate: what we capture and when (after the wow), and why that ordering maximizes conversion.
3. The tripwire: a low-friction card-on-file offer ($1 trial or a $X single deep-dive report) and
   why it lifts downstream conversion.
4. The two rails: the annual subscription offer (price + intro→renewal ladder) AND the broker-
   affiliate clickout for non-payers — what each is worth per user.
5. The ONE conversion event we optimize the channel for, and the retargeting audiences we build.
6. Objection-killers + risk-reversal + the not-advice line.

Save as docs/meta-gtm/conversion-machine.md.
```

## Step 3 — Cheap head-to-head: let CAC pick the channel *(was: generate mockups)*

> The cost-effectiveness discipline. Spend a little to avoid betting the budget on the wrong channel.

```
Design a small identical head-to-head test (e.g. $100–150 per channel) sending the SAME hook to the
SAME funnel on Meta and TikTok, using the existing app + real product screens as the probe. Define:
1. The identical creative concept run natively on each (Spark Ad on TikTok, Advantage+ on Meta).
2. The two metrics that decide it: cost-per-free-signup AND cost-per-paying-customer (or cost-per-
   affiliate-conversion), per channel.
3. The minimum sample and the decision rule for declaring the single winning channel.
4. After the test: a one-line verdict — which channel we go pure on, and which money rail leads.

Save to docs/meta-gtm/channel-test.md. Implement the test funnel/checkout behind existing gating.
Do NOT scale or pick a channel before the data is in. No deploy yet (Step 7).
```

## Step 4 — Shape the funnel for one-click conversion *(was: build the landing page)*

```
Take the winning channel + offer. Refine the EXISTING app + marketing pages for maximum conversion
on that single channel — minimal product change, maximum funnel fit:
1. Value-before-gate: let cold traffic get one real verdict with no signup wall; capture the account
   immediately after.
2. Frictionless path: message-match the landing to the winning ad hook, one-page checkout, annual
   default + the card-on-file tripwire, money-back guarantee visible.
3. Wire both rails: real annual checkout (intro→renewal) and the broker-affiliate clickout as a
   first-class path for non-payers.
4. Build the retargeting hooks (events/audiences) so we can re-touch free users in-channel.

Apply edits to existing code; don't rebuild. Keep the not-advice disclaimer. No deploy yet.
```

## Step 5 — Instrument ONE conversion event, server-side *(was: pixel fires on email)*

```
Set up clean, server-side conversion tracking for the single channel so CAC is as low as possible:
1. Implement Meta CAPI (or TikTok Events API) alongside the browser pixel in src/lib/analytics.ts
   so the optimized event is deduplicated and reliably attributed.
2. Make the ONE optimized event carry value + plan/cadence; add an affiliate-conversion event so
   blended revenue-per-visitor is measurable.
3. Set the campaign optimization to the cheapest reliable money-signal at our volume (start on the
   tripwire/signup, graduate to purchase as volume allows) — document the graduation threshold.
4. Define the CAC : LTV target (≥ 3:1 blended) and the KILL-SWITCH rule if it breaks.

Save the spec to docs/meta-gtm/conversion-tracking.md. Verify every event fires once, correctly.
```

## Step 6 — Native/UGC creative at volume *(was: 20 generic ads)*

> Creative is the #1 lever on paid-social CAC. Cheap, native, high-velocity — not polished ads.

```
Using docs/meta-gtm/conversion-machine.md and the REAL product, produce native creative for the
winning channel with the Higgsfield MCP (Marketing Studio):
- Format native to the channel: TikTok Spark-style screen-recording UGC ("watch AI roast this
  stock in 5 seconds"); or Meta Advantage+ UGC + value-optimized variants.
- Lead with a real product moment (the instant verdict, the memo streaming). No fabricated UI, no
  fabricated returns, no "get rich" — keep the not-advice line. Compliant by construction.
- Batch: multiple hooks × multiple openers for high creative velocity (the cheapest CAC lever).

Save to docs/meta-gtm/marketing-assets/, foldered by hook, named for the product moment used.
```

## Step 7 — Ship & concentrate spend on the one channel *(was: deploy to Vercel)*

```
1. Use the Vercel MCP to deploy the funnel + tracking changes to production. On the live URL verify:
   value-before-gate works, the tripwire + annual checkout work, the affiliate clickout fires, and
   the server-side conversion event fires end-to-end. Send me the live URL + pass/fail checklist.
   Token if needed: [VERCEL TOKEN]
2. Stand up the single-channel launch (Meta via the Meta Ads MCP; TikTok manually). Structure for
   the algorithm to learn fast and cheap: consolidated campaign, broad targeting, optimize for the
   ONE conversion event, all budget on this channel only. Label everything for attribution. Save
   for me to inspect before publishing.
```

## Step 8 — Conversion-rate optimization loop *(was: upload ads)*

> Lowest-cost lever first. Lift each funnel step before spending more on traffic.

```
Run a structured CRO loop on the single channel, attacking the cheapest lever first:
1. Map the funnel drop-offs: ad CTR → free verdict → account capture → tripwire → annual / affiliate.
2. For the biggest leak, run the cheapest fix: new creative hook (Higgsfield), landing/headline test,
   checkout-friction removal, or retargeting copy — one variable at a time.
3. Read results via the Meta MCP / Supermetrics on cost-per-conversion and blended revenue-per-
   visitor. Keep what lowers CAC; cut the rest.

Save each round's verdict to docs/meta-gtm/cro-log.md.
```

## Step 9 — Scale on CAC:LTV + creative velocity *(was: scale lowest cost-per-lead)*

```
Using the Meta MCP + Supermetrics (and HubSpot for nurture/renewal):
1. Scale only while blended CAC : LTV holds ≥ 3:1. Pour budget into the winning creative/audience;
   trip the kill-switch on anything that breaks the ratio.
2. Keep creative velocity high — fresh native/UGC variations of winners (Higgsfield) are the
   durable CAC lever on a single channel; rotate before fatigue.
3. Graduate the optimization event toward purchase as volume grows; tune the nurture/renewal
   (HubSpot) that drives annual LTV.
4. Write the verdict back to docs/meta-gtm/conversion-machine.md AND propose the product changes the
   winning funnel implies. The product becomes what converted cheapest.
```

---

### What changed vs the money-first (multi-channel) version

- **One channel, not many.** Pure Meta *or* pure TikTok, chosen by a cheap head-to-head (Step 3),
  then 100% concentration — the core of paid-social cost-effectiveness.
- **Conversion machine is explicit:** value-before-gate → account → card-on-file tripwire → annual +
  affiliate, retargeted in-channel. This is the lowest-CAC / highest-CVR pattern.
- **Server-side tracking (CAPI / Events API)** and **one optimized event** — cleaner signal, lower CAC.
- **Native/UGC creative velocity** treated as the #1 CAC lever, not an afterthought.
- **Hard CAC : LTV ≥ 3:1 gate with a kill-switch** governs all scaling.
- **Tooling honesty:** Meta is MCP-automatable end-to-end; TikTok ops are manual (creative via
  Higgsfield, data via Supermetrics) — a real cost in the channel decision.
