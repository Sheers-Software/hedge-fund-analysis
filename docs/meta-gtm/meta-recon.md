# Step 1 — Meta Buyer & Market Recon (US-Only)

> **Scope.** **United States market only.** Recon for a pure-Meta, subscription-only GTM. ApexAlpha
> is a live web app: type a ticker → instant fair-value verdict + a streaming hedge-fund-style AI memo
> + a 5-year valuation model + charts, plus a Premium "AI Intelligence" terminal. **Research &
> education, not investment advice.** We acquire ONLY through US Meta ads and monetize ONLY through
> subscriptions (no affiliate).
>
> **Method.** Because acquisition is **100% Meta**, we do **not** get to pick CAC — the US Meta
> auction sets it. So the offer is **reverse-engineered**: start from the CAC the auction imposes,
> apply the LTV : CAC ≥ 3:1 rule to get a *required LTV*, then solve backward for the price ladder,
> retention, and expansion that produce it. Price is an output of the model, not a guess.
>
> _Compiled June 2026. Benchmarks are directional US vendor aggregates; our own CAPI data (Step 5) is
> ground truth._

---

## 1. US demand & the buyer

**The US pool is huge and already conditioned to pay for research.**

| US signal | Data point | Source |
|---|---|---|
| US adults owning stock | **62%** (~165M people), steady 2 yrs | [Gallup](https://news.gallup.com/poll/266807/percentage-americans-owns-stock.aspx), [bestbrokers](https://www.bestbrokers.com/stock-trading/stock-trading-demographics/) |
| Active US retail investors | **~15% of US adults** (~38M) — the real prospect pool | [bestbrokers](https://www.bestbrokers.com/stock-trading/stock-trading-demographics/) |
| Retail who pay for research | **~30%** of retail investors | [coinlaw](https://coinlaw.io/retail-investing-statistics/) |
| Self-education spend | ~$300/yr avg on financial education | [coinlaw](https://coinlaw.io/retail-investing-statistics/) |
| Education | 71% hold ≥ a bachelor's degree | [coinlaw](https://coinlaw.io/retail-investing-statistics/) |
| Gender | ~84% of active traders are male | [coinlaw](https://coinlaw.io/retail-investing-statistics/) |
| Age | New investors skew 30–35; *active* trader avg ~43 | [coinlaw](https://coinlaw.io/retail-investing-statistics/) |

**Serviceable US payer pool:** ~38M active retail × ~30% who pay for research ≈ **~11M Americans who
already buy equity research** — vastly more than a Meta budget can exhaust. Demand is not the
constraint; **unit economics are.**

**What US buyers already pay (the demand-side price anchors):**

| US competitor | Intro | Renewal / list | Source |
|---|---|---|---|
| Motley Fool Stock Advisor | **$99/yr** | **$199/yr** | [stockanalysis](https://stockanalysis.com/article/motley-fool-stock-advisor-review/), [fool.com](https://www.fool.com/services/stock-advisor/) |
| Seeking Alpha Premium | ~$225–269/yr promo | **$299/yr** | [Seeking Alpha](https://about.seekingalpha.com/premium-subscription-price-update), [thestockdork](https://www.thestockdork.com/seeking-alpha-sale/) |

**Target US Meta buyer:** self-directed equity investor, **male-skewed, 35–60, college-educated,
$75k+ HHI**, already pays for (or churned from) Motley Fool / Seeking Alpha, mobile-first. They are
anchored to **annual $99 intro → $199–299 renewal**, *not* to $9/mo. Reachability caveat: the US
finance Special Ad Category (§3) **bans income/behavioral targeting**, so we reach this person via
**broad Advantage+ + finance interests + creative that self-selects** them.

---

## 2. The CAC the US Meta auction imposes (the input we can't control)

Finance is one of the most expensive US verticals, and US Meta costs rose ~20% YoY into 2026.

| US metric | Benchmark | Source |
|---|---|---|
| Platform CPM (all industries) | $11.82 → **$14.19** (+20% YoY) | [get-ryze](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026) |
| **Finance CPM** | **~$18–22** | [sovran](https://sovran.ai/benchmarks/meta-ads-cpm-by-industry) |
| **Finance CPC** | **~$3.77** | [get-ryze](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026) |
| CPA, high-consideration services | Legal ~$188, Insurance ~$198 | [get-ryze](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026) |

**Cold cost-per-annual-customer (CAC) — the funnel math:**

```
Finance CPC ~$3.50  →  landing→free-verdict ~40%  →  verdict→account ~30%
                    →  account→tripwire ~12%       →  tripwire→annual ~33%
```

- Cost per free verdict: ~$3–8 · Cost per account: ~$12–25 · Cost per tripwire buyer: ~$50–90
- **Cold CAC per annual customer ≈ $120 (optimistic) → $180 (planning) → $250 (pessimistic).**

**This is the number the offer must repay.** We treat **CAC = $180** as the planning case and **$250**
as the stress case, and design the offer to clear 3:1 at $180 and stay alive at $250.

---

## 3. US compliance constraints (bind the model)

**Treat as Special Ad Category from day one.**

- Since **Jan 21, 2025**, US financial advertisers must declare the **"Financial Products &
  Services"** category; Meta flags **even educational finance content**, so we declare proactively.
  ([adamigo](https://www.adamigo.ai/blog/meta-ad-policy-updates-financial-services-2025),
  [getelevar](https://getelevar.com/news/meta-financial-products-services-ads-category/))
- **Targeting we lose:** age locked **18–65+**, **no gender**, **no income/net-worth/behavior**, 15-mi
  min radius, no ZIP. **Classic Lookalikes unavailable → Special Ad Audiences only.**
  ([data-axle](https://www.data-axle.com/resources/blog/meta-special-ad-categories-rules/),
  [wolf.financial](https://wolf.financial/blog/meta-ads-financial-services-restrictions-targeting-workarounds))
- **Creative:** ❌ promised/implied returns, "beat the market," "get rich," fabricated track records,
  asking for bank/account numbers. ✅ research/education framing, not-advice line, **real product
  screens only**, lead with a real product *moment*. ([inbeat](https://www.inbeat.co/articles/meta-advertising-policies/))
- **Pixel/CAPI caveat:** some finance domains see standard events (Purchase/Lead) **filtered** —
  **verify in Step 5**, keep a custom-event fallback.
  ([wolf.financial](https://wolf.financial/blog/meta-ads-financial-services-restrictions-targeting-workarounds))

---

## 4. Reverse-engineering the offer from CAC

### 4a. Required LTV (derived, not chosen)

Rule: **LTV : CAC ≥ 3:1.** So required LTV = 3 × CAC:

| CAC scenario | Required LTV (3×) |
|---|---|
| $120 (optimistic) | **$360** |
| **$180 (planning)** | **$540** |
| $250 (stress) | **$750** |

**The offer's job:** produce a blended **per-customer LTV of ~$540** (and ideally cushion toward
$750). Everything below is solved to hit that.

### 4b. The LTV model

Research subs are high-margin (~85–90%), so we model gross LTV; COGS is a rounding error. Per blended
customer:

```
LTV ≈ P1 (intro yr)  +  P2 (renewal) × r/(1−r)   +   expansion uplift
        where r = annual renewal rate
```

Consumer investing subscriptions retain far below the 96%+ of B2B SaaS — plan **r ≈ 0.55–0.60** annual
renewal (consumer media/newsletter band), i.e. ~40–45% churn/yr.
([Recurly via venasolutions](https://www.venasolutions.com/blog/saas-churn-rate),
[focus-digital](https://focus-digital.co/average-churn-rate-subscription-services/))
→ renewal multiplier `r/(1−r)`: **1.22× at r=0.55, 1.50× at r=0.60.**

### 4c. Solving for the price ladder (which configuration clears 3:1?)

Expansion assumption held constant: **20% of customers upgrade to Premium**, +$100/yr, over ~2.2-yr
lifetime → **+~$44 LTV**.

| # | Intro P1 | Renewal P2 | Renewal r | Base LTV `P1 + P2·r/(1−r)` | +Exp | **LTV** | vs $180 CAC | vs $250 CAC |
|---|---|---|---|---|---|---|---|---|
| A — Fool clone | $99 | $199 | 0.55 | 99 + 243 = 342 | +44 | **$386** | 2.1:1 ✗ | 1.5:1 ✗ |
| B — Fool + retention | $99 | $199 | 0.60 | 99 + 299 = 398 | +44 | **$442** | 2.5:1 ✗ | 1.8:1 ✗ |
| **C — SA-tier (rec.)** | **$99** | **$279** | **0.58** | 99 + 385 = 484 | +44 | **$528** | **2.9:1 ≈** | 2.1:1 |
| D — SA-tier + retention | $99 | $299 | 0.60 | 99 + 449 = 548 | +50 | **$598** | **3.3:1 ✓** | 2.4:1 |
| E — premium ladder | $129 | $299 | 0.60 | 129 + 449 = 578 | +60 | **$638** | **3.5:1 ✓** | **2.6:1** |

**What the math says:**
- **The Motley-Fool $99→$199 clone (A/B) does NOT clear 3:1** at the planning CAC ($180). It only
  works if CAC is driven down to ~$120. Too fragile to launch on.
- **Clearing 3:1 at $180 CAC requires Seeking-Alpha-tier renewal (~$279–299) AND engineered retention
  (r ≥ 0.58–0.60) AND ≥20% Premium expansion** (rows D/E).
- **Nothing clears 3:1 at the $250 stress CAC** — meaning at stress-case CAC the *only* lever left is
  **driving CAC down** (creative velocity, retargeting, event optimization), not raising price further
  past the category ceiling. This is the kill-switch territory.

### 4d. Why the $9/mo SKU is fatal (disproof of the current model)

Reverse-engineering kills the existing $9/mo Basic / $19/mo Premium *as headline offers*:

| Headline SKU | Monthly churn (consumer) | Avg lifetime | Gross LTV | vs $180 CAC |
|---|---|---|---|---|
| $9/mo Basic | ~8–10% | ~10–12 mo | **~$90–110** | **0.5:1 ✗ never repays** |
| $19/mo Premium | ~8–10% | ~10–12 mo | **~$190–230** | ~1.1–1.3:1 ✗ |

A monthly micro-SKU cannot absorb US finance CAC under any creative scenario. **Conclusion: demote
monthly to an expansion/retention rung, not the acquisition headline.**

### 4e. The reverse-engineered offer (the output)

1. **Free hook (no gate):** one real ticker verdict — maximizes top-of-funnel CVR, lowers CAC.
2. **Gate after the wow:** capture account (the launch optimization event).
3. **Tripwire (card-on-file):** **$7 single deep-dive report** (preferred over $1 trial — captures
   real revenue to offset CAC *and* qualifies card-on-file intent that lifts annual conversion).
4. **Core offer — annual, reverse-engineered to clear 3:1 at $180 CAC:**
   **$99 first-year intro → $279–299 renewal** (Seeking-Alpha tier, not Fool tier). Annual billing
   only; this is the LTV engine.
5. **Expansion:** in-app **Premium "AI Intelligence" terminal** upsell, targeted at ≥20% attach,
   +~$100/yr — repriced as an annual add-on, not a standalone $19/mo SKU.
6. **Retention is a P0 number, not an afterthought:** the model *requires* r ≥ 0.58–0.60. Renewal
   nurture + annual lock-in must be engineered to hit it or the whole model fails.
7. **Risk-reversal:** free verdict + money-back guarantee + the not-advice line (also Meta-compliant).

---

## 5. The Meta conversion event (US, low-volume path)

**Ultimate target:** **`Purchase` (annual)** — closest-to-money. But Meta wants **~50 conv/ad-set/wk**
to exit learning, and at $180 CAC on a $150–300 test we'll see only a handful of annual sales/wk.
([usewonderful](https://www.usewonderful.com/blog/meta-ads-learning-phase-50-conversions-per-week-help-center))

| Phase | Optimize for | Why | ~Freq vs annual |
|---|---|---|---|
| **Launch** | Account created / signup | Cheap, frequent → exits learning, trains on hooked users | ~10–20× |
| **Mid** | Tripwire ($7 report) purchase | Real card-on-file intent | ~3–5× |
| **Target** | `Purchase` (annual) | Closest-to-money | 1× |

**Graduation rule:** drop a rung only when the next event clears ~50 conv/ad-set/wk. Server-side via
CAPI with dedup (Step 5).

---

## Recommendation (Step-1 output)

1. **Market:** **US only.** Pool is ~11M Americans who already pay for equity research — demand is not
   the constraint, **unit economics are**.
2. **Target buyer:** self-directed investor, male-skewed, 35–60, college-educated, $75k+ HHI,
   ex/current Fool/Seeking Alpha. Reached via broad Advantage+ + interests + self-selecting creative
   (income targeting is banned).
3. **Offer (reverse-engineered from CAC, not guessed):** free verdict → account gate → **$7 tripwire**
   → **annual $99 intro → ~$279–299 renewal** → **≥20% Premium expansion** → **engineered retention
   r ≥ 0.58–0.60**. This is the *minimum* configuration that clears **LTV : CAC ≥ 3:1 at the $180
   planning CAC** (LTV ~$528–598).
4. **Kill the headline $9/mo:** it never repays US finance CAC; demote to an expansion/retention rung.
5. **Optimized event:** launch on **signup**, graduate **tripwire → annual purchase** at ~50
   conv/ad-set/wk; server-side CAPI.
6. **Hard guardrails:** declare the Financial Products & Services Special Ad Category; compliant-by-
   construction creative; Special Ad Audiences (not classic Lookalikes); verify CAPI events aren't
   finance-filtered.
7. **The 3:1 reality:** the model **breaks at the $250 stress CAC** — so post-launch the dominant
   lever is **driving CAC down** (creative velocity + retargeting + event graduation), governed by a
   hard CAC : LTV kill-switch.

---

### Carry-forward flags

- **Step 2:** build the machine on the row-D/E ladder ($99 → $279–299), $7 tripwire, ≥20% Premium
  attach, r ≥ 0.58–0.60. Monthly = expansion rung only.
- **Step 3:** WTP test should pit **$279 vs $299 renewal** (intro fixed at $99) and measure
  **cost-per-paying-customer** against the **$120 / $180 / $250** CAC ladder; declare a winner only on
  annual-purchase economics.
- **Step 4 / `src/lib/tiers.ts`:** reprice tiers to the won annual ladder; make Basic→Premium an
  in-app annual upsell, not a $9/$19 monthly headline.
- **Step 5:** confirm Purchase/Lead aren't blocked on our finance domain; custom-event fallback.
- **Step 7:** "Lookalike seed" → **Special Ad Audience**; targeting age 18–65+, no gender/income
  narrowing, 15-mi min radius.

---

#### Sources

- [Gallup — % of Americans who own stock](https://news.gallup.com/poll/266807/percentage-americans-owns-stock.aspx)
- [bestbrokers — US stock trading demographics 2026](https://www.bestbrokers.com/stock-trading/stock-trading-demographics/)
- [coinlaw — Retail investing statistics 2025](https://coinlaw.io/retail-investing-statistics/)
- [stockanalysis — Motley Fool Stock Advisor pricing](https://stockanalysis.com/article/motley-fool-stock-advisor-review/)
- [fool.com — Stock Advisor](https://www.fool.com/services/stock-advisor/)
- [Seeking Alpha — Premium price update](https://about.seekingalpha.com/premium-subscription-price-update)
- [thestockdork — Seeking Alpha sale/pricing](https://www.thestockdork.com/seeking-alpha-sale/)
- [get-ryze — US Meta Ads benchmarks 2026 (CPM/CPC/CPA)](https://www.get-ryze.ai/blog/meta-ads-cost-benchmarks-by-industry-2026)
- [sovran — Meta Ads CPM by industry](https://sovran.ai/benchmarks/meta-ads-cpm-by-industry)
- [venasolutions — 2025 SaaS churn benchmarks](https://www.venasolutions.com/blog/saas-churn-rate)
- [focus-digital — churn by subscription service](https://focus-digital.co/average-churn-rate-subscription-services/)
- [adamigo — Meta financial-services policy 2025](https://www.adamigo.ai/blog/meta-ad-policy-updates-financial-services-2025)
- [getelevar — Meta Financial Products & Services category](https://getelevar.com/news/meta-financial-products-services-ads-category/)
- [data-axle — 2025 Meta special ad categories rules](https://www.data-axle.com/resources/blog/meta-special-ad-categories-rules/)
- [wolf.financial — Meta finance restrictions & targeting](https://wolf.financial/blog/meta-ads-financial-services-restrictions-targeting-workarounds)
- [inbeat — Meta advertising policies 2025](https://www.inbeat.co/articles/meta-advertising-policies/)
- [usewonderful — Meta learning phase / 50 conversions](https://www.usewonderful.com/blog/meta-ads-learning-phase-50-conversions-per-week-help-center)
