# ApexAlpha Growth Playbook — Money-First / Demand-Shaped Edition

> **What this is.** The original michia playbook (screenshots `1.png`–`9.png`) builds a new app and
> pushes Meta ads at a cheap self-serve SaaS. This version is rebuilt around one rule:
> **follow where the money actually changes hands in retail-investing products, and bend the product
> toward it.** The product is treated as **fluid** — the *offer* leads, the product follows demand.

> **Run order:** top to bottom, one at a time. Steps 1–3 decide *what to sell and for how much*
> **before** you touch the product (Step 4). Don't reorder — that's the whole point.

---

## The money thesis you're testing (grounded, not assumed)

A $9/mo self-serve research tool is the **lowest-LTV, highest-churn corner** of this category.
Where buyers in retail equity research actually spend, today:

| Where the money is | What buyers actually pay | Funnel that captures it |
| --- | --- | --- |
| **Annual research / picks subscriptions** | Motley Fool Stock Advisor ~$99 intro → **$199/yr** renewal; Seeking Alpha Premium ~**$299/yr** | Long-form direct response: free hook → email → nurture → **annual** offer |
| **Prosumer / serious-DIY tools** | Koyfin **$39–$299/mo**; Simply Wall St ~$10/mo **annual-only** | Demo-led, feature-depth, annual lock-in |
| **Affiliate / brokerage bounties** | **$75–$200+ per funded account** (Moomoo $75, IBKR $200, Webull free-stock) | Free tool/content monetized by routing signups to brokers |
| **Communities / alerts** | $30–$150/mo recurring | Creator/Discord-led, social proof + FOMO |

Takeaways baked into the steps below:
- **Annual, not monthly.** The proven LTV is in yearly billing with a strong intro→renewal ladder.
- **The offer ≠ the feature list.** People pay for *a decision / an edge / a verdict*, sold via
  direct response — not for "a research tool."
- **Two revenue rails, not one.** A subscription rail *and* an affiliate rail (route free users to a
  broker for a bounty) can both run on the same traffic. Test both.
- **Distribution is creators, newsletters, communities and search intent** as much as cold Meta.
- ApexAlpha stays a **research & educational tool, not investment advice** — and must use **real**
  product screens, never fabricated UI or fabricated track records (this is a legal line in finance).

> Steps 1–3 *verify* this thesis with live data and real money before you commit the product to it.

## How your three unknowns now map

| Your unknown | Steps |
| --- | --- |
| **“Where’s the market / the money?”** | 1 (follow the money), 2 (pick the offer + price), 3 (prove willingness-to-pay) |
| **“How do I market it?”** | 6 (proof-led creative), 7 (distribute where buyers already are) |
| **“How do I convert buyers?”** | 4 (shape product to the won offer), 5 (revenue tracking), 8–9 (optimize on LTV:CAC) |

## Preconditions

- **Meta Ads MCP**, **Higgsfield MCP**, **Vercel MCP** — as before.
- **Supermetrics MCP** — to read revenue/channel performance across sources in one place.
- **HubSpot MCP** — email nurture is now central (the annual-offer rail runs on nurture, not impulse).
- Reusable assets: marketing pages (`src/app/(marketing)`), pixel (`src/lib/analytics.ts`),
  tiers (`src/lib/tiers.ts`), existing copy (`docs/meta-gtm/conversion-copy.md`).

---

## Step 1 — Follow the money *(was: blue-ocean ideation)*

> Don't research features — research **transactions**. Who pays, for what outcome, how much, how
> often, billed how, sold through what funnel.

```
ApexAlpha is a live web app: type a ticker → instant fair-value verdict + a streaming hedge-fund-
style AI memo + a 5-year valuation model + charts, plus a Premium "AI Intelligence" terminal.
It's a research & educational tool, not investment advice. The product is fluid and will be
refined toward whatever the market actually pays for.

Do external research on WHERE MONEY ACTUALLY CHANGES HANDS in retail equity research, not on
feature comparisons. Produce:
1. The revenue models in this category and the real price points/billing cadence buyers accept
   today — annual picks/research subscriptions (Motley Fool, Seeking Alpha), prosumer tools
   (Koyfin, Simply Wall St), affiliate/brokerage bounties, paid communities/alerts. Cite current
   numbers.
2. For each model: who the paying buyer is, what outcome they're really buying, typical price,
   retention/renewal behavior, and the acquisition funnel that captures them.
3. The 3 highest-LTV pockets ApexAlpha can credibly enter with what it already does (or could do
   with light refinement), ranked by (a) proven willingness-to-pay, (b) how cheaply it can be
   tested, (c) fit with the real product.
4. For each pocket, the second revenue rail available on the same traffic (e.g. broker affiliate
   bounty on free users) and what it's worth per user.

Save to docs/meta-gtm/money-map.md.
```

## Step 2 — Pick the offer & price, not the feature set *(was: product spec)*

> Translate the money map into concrete **offers** to sell. The product is fluid — define what
> buyers transact on, and let the product conform later.

```
Using docs/meta-gtm/money-map.md, define 2–3 concrete OFFER hypotheses to test — each is a
sellable thing with a price, not a feature list. For each offer specify:
1. The buyer (from the money map) and the outcome they're paying for in one sentence.
2. Exact price + billing cadence (lean annual where the category proves it; include intro→renewal
   ladder, e.g. $X first year, $Y renewal).
3. The packaging: what's free (the hook + the affiliate-rail surface) vs what's paid, and which
   single feature carries the value.
4. The promise/headline and the 3 proof points that justify the price.
5. The objection-killers (incl. "isn't this free on Yahoo?", "is this just ChatGPT?", and the
   not-advice framing) and the risk-reversal (free trial / refund).
6. The second rail: how free traffic is monetized via broker affiliate even if it never subscribes.

Pick the #1 offer to test first and say why. Save as docs/meta-gtm/offers.md.
```

## Step 3 — Prove willingness-to-pay BEFORE refining the product *(was: generate mockups)*

> The biggest inversion. The product is fluid, so **don't build toward an offer until money or
> hard intent says it's the right one.** Sell the offer first, with what exists.

```
Design and stand up willingness-to-pay smoke tests for the offers in docs/meta-gtm/offers.md,
using the EXISTING app and pages as the probe — do not build new features yet. Use real product
screens only.
1. For each offer, create a price-anchored landing/checkout path (e.g. a real Stripe Payment Link
   per price point, or a "Get [offer]" → checkout that captures intent). Test the annual offer at
   2 price points.
2. Define the pass signal as real money or hard intent (completed checkout, pre-order, card-on-file
   trial start) — NOT email signups or clicks.
3. Also stand up the affiliate rail as a control: a free path that routes to a broker so we can
   measure per-user affiliate value against subscription value on the same traffic.
4. Specify the minimum sample + the decision rule for declaring a winning offer/price.

Save the test design to docs/meta-gtm/wtp-test.md. Implement the checkout paths in the app behind
the existing gating. Do not deploy yet (Step 7).
```

## Step 4 — Shape the product probe to the winning offer *(was: build the landing page)*

> Only now does the product move — and only toward what won Step 3. Minimal change, maximum fit.

```
Take the winning offer/price from the Step 3 WTP test. Refine the EXISTING app and marketing
pages (src/app/(marketing) + the gated app) just enough to deliver that one offer cleanly:
1. Re-package the tiers in src/lib/tiers.ts to match the won price/cadence (e.g. annual primary,
   intro→renewal), with the value-carrying feature front and center.
2. Message-match the landing + pricing pages to the won offer's promise and proof; guide cold
   traffic from the ticker hook → the paid outcome (or the affiliate rail if they won't pay).
3. Wire the real checkout (annual + intro ladder) and the affiliate clickout as a first-class path.
4. Keep everything fluid: note in docs/meta-gtm/offers.md what we'd change next if demand shifts.

Apply edits to existing code; don't rebuild from scratch. Keep the not-advice disclaimer. No deploy yet.
```

## Step 5 — Instrument for revenue, not vanity *(was: pixel fires on email)*

> Optimize on money. Track the events that map to *revenue and LTV* across BOTH rails.

```
The pixel (src/lib/analytics.ts, PixelProvider.tsx) already fires PageView → ViewContent → Lead →
StartTrial → InitiateCheckout → Subscribe. Re-point measurement at money:
1. Make Subscribe carry value + plan tier + billing cadence, and add an event for the affiliate
   clickout/conversion rail so per-user affiliate value is measurable.
2. In Events Manager (Meta MCP), set the optimization event to the closest-to-money signal volume
   allows — start on InitiateCheckout/Lead to learn, graduate to Subscribe; document the threshold.
3. Define the cohort metrics we'll actually decide on: cost-per-paying-customer, blended revenue
   per visitor (subscription + affiliate), trial→paid, and first-renewal proxy.
4. Walk the live funnel and verify every money event fires once, correctly.

Save the measurement spec to docs/meta-gtm/revenue-tracking.md.
```

## Step 6 — Proof-led creative for the proven buyer *(was: 20 generic ads)*

> Creative now matches the *buyer behavior* of whoever pays in the winning pocket — direct-response
> for newsletter buyers, demo-depth for prosumers, FOMO+proof for community buyers.

```
Using docs/meta-gtm/offers.md, the real product, and docs/meta-gtm/conversion-copy.md, build
acquisition creative for the winning offer with Higgsfield Marketing Studio:
- Match the format to the buyer: long-form direct-response (VSL/carousel) for an annual-subscription
  buyer; demo/feature-depth for a prosumer; proof + urgency for a community buyer.
- Lead every asset with a REAL product moment (live fair-value verdict, streaming memo, the
  valuation model). No fabricated UI, no fabricated returns — show the analysis, claim the outcome
  honestly, keep the not-advice line.
- Produce several variations across 2–3 hooks so we learn which message earns the sale.

Save to docs/meta-gtm/marketing-assets/, foldered by hook, named for the product moment used.
```

## Step 7 — Distribute where the buyers already spend *(was: deploy to Vercel)*

> Cold Meta is one channel, not the channel. Ship live, then meet buyers where this category's
> money already flows.

```
1. Use the Vercel MCP to deploy the offer + tracking changes to production. On the live URL verify:
   the annual checkout works, the intro→renewal ladder is correct, the affiliate clickout fires,
   and the pixel money-events fire end-to-end. Send me the live URL + a pass/fail checklist.
   Token if needed: [VERCEL TOKEN]
2. Draft a channel plan beyond cold Meta, ranked by fit to the winning buyer: finance creators /
   newsletter sponsorships, relevant communities (Reddit/Discord), and high-intent search (people
   googling "is [TICKER] overvalued" / "[competitor] alternative"). For each: the angle, the
   asset from Step 6 to use, and the rough cost to test. Save to docs/meta-gtm/channel-plan.md.
```

## Step 8 — Launch as a revenue test across offers & channels *(was: upload ads)*

> Structure the spend to read **cost-per-paying-customer and early LTV per offer and per channel** —
> not cost-per-lead.

```
Using the Meta MCP (and the channel plan for non-Meta tests), build but do not auto-publish a
launch structured as a revenue experiment:
- One ad set / placement per (offer × buyer × channel) hypothesis, independently readable.
- Optimization event per docs/meta-gtm/revenue-tracking.md; budget per the first-$50 test plan in
  docs/meta-gtm/conversion-copy.md; UTM/naming so every paying customer maps back to its hypothesis.
- Run the affiliate rail in parallel so blended revenue-per-visitor is comparable to subscription.
- Label everything for attribution. Save for me to inspect before publishing.
```

## Step 9 — Optimize on LTV:CAC and refine the product to demand *(was: scale lowest cost-per-lead)*

> Close the loop: spend tells you the market, and the **product bends to the demand that paid.**

```
Using the Meta MCP + Supermetrics (and HubSpot for nurture/renewal signal):
1. Rank every (offer × buyer × channel) by LTV:CAC — cost-per-paying-customer and blended
   revenue-per-visitor (subscription + affiliate), not cost-per-lead. Find where money compounds.
2. Kill losing offers/prices/channels; scale winners; generate fresh variations of winning creative
   with Higgsfield; tune the nurture sequence (HubSpot) toward the renewal that drives annual LTV.
3. Write the demand verdict back to docs/meta-gtm/offers.md AND propose the product changes it
   implies — which feature to deepen, which to drop, whether to push the affiliate rail or the
   subscription rail. The product becomes what the market paid for.
```

---

### What changed vs the previous (self-serve) version

- **Money leads, features follow.** Steps 1–3 decide offer + price from real buyer behavior before
  the product moves at all — because the product is fluid.
- **Annual + two revenue rails.** Subscription LTV (annual, intro→renewal) *and* a broker-affiliate
  rail on free traffic, tested side by side — not a single $9/mo SKU.
- **Optimize on LTV:CAC**, not cost-per-lead or cost-per-email.
- **Distribution widened** to creators, newsletters, communities and search intent, where this
  category's money actually flows — Meta is one test, not the plan.
- **Product roadmap is an output** (Step 9), driven by what paid — not an input.

> Sources for the money anchors above: Seeking Alpha & Motley Fool pricing, Koyfin/Simply Wall St
> pricing, and broker affiliate bounties — see the links shared alongside this playbook.
