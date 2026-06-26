# Step 3 — Prove the Offer Pays on Meta BEFORE Building (US WTP Test)

> **What this is.** A small ($150–300) US Meta willingness-to-pay test that sends the **same
> hook→funnel** to real traffic, using the **existing app + real product screens** as the probe.
> Derived from [meta-recon.md](./meta-recon.md) and [conversion-machine.md](./conversion-machine.md);
> the code it rides on is the in-flight [product-revision.md](./product-revision.md) build.
>
> **The point (playbook):** don't refine the product until a small Meta spend shows the offer clears
> CAC. **No scaling, no product refinement, no deploy (Step 7) until the data is in.**
>
> **Coordination note.** Another agent is implementing the realignment. This test's code prerequisites
> **are** that agent's deliverables (value-before-gate, $7 tripwire path, annual Stripe paths). This
> doc adds only the **test-specific config** on top (price-switch flag, Stripe price IDs, UTM/event
> labels) — see §6. No code is edited here.

---

## 0. The hard truth about a $150–300 budget (read first)

At the recon's planning **CAC ≈ $180**, a $150–300 spend buys **~1–2 annual customers.** That is
**far too few** to declare a price winner on cost-per-paying-customer — picking $279 vs $299 to
statistical confidence needs **~25–50 annual conversions *per cell*** (~$9k–18k at $180 CAC).

So this test is **deliberately not a powered price A/B.** It is a **go/no-go smoke test** that:
- **Powers on the cheap upstream events** that *do* get volume at this budget (signups, $7 tripwires),
- Reads the **funnel rates** that let us *project* CAC, and
- Treats annual purchases as **directional only.**

The price winner ($279 vs $299) is resolved by a **follow-on powered test** once optimization
graduates (§7). Pretending $200 can pick a price would be the expensive mistake this step exists to
prevent.

---

## 1. What we test (cells + offer)

**Two annual offer cells, intro held at the category-anchored $99, varying the renewal anchor** (the
renewal sets LTV — the binding constraint — and shows as the struck-through anchor at checkout):

| Cell | Intro (paid now) | Renewal anchor | Tripwire | Hypothesis |
|---|---|---|---|---|
| **A** | **$99** | **$279/yr** | $7 deep-dive | Lower renewal anchor → higher annual CVR, lower LTV |
| **B** | **$99** | **$299/yr** | $7 deep-dive | Seeking-Alpha anchor → tests if $20 higher LTV costs CVR |

- **Intro is fixed at $99** (Motley-Fool-anchored) — a first test should not also move the number cold
  traffic actually pays; renewal is the lever that swings LTV in the 3:1 model.
- **Tripwire ($7) is constant across both cells** — it's the volume event we power on, not a variable.
- Both cells run the **same hook, same creative, same landing** — only the renewal anchor + checkout
  copy differ. Real Stripe paths, real charges (refundable under the money-back guarantee).

> Optional follow-on (not this budget): an **intro-elasticity** cell ($99 vs $129) once we can afford
> conversion volume — recon row E.

---

## 2. The decision metric (money, not vanity)

**Primary (powered): cost-per-tripwire-buyer + signup→tripwire rate.** These get enough events at
$150–300 to be meaningful and are the closest-to-money signal we can actually measure on this budget.

**Secondary (directional): cost-per-paying-customer (annual)** and **tripwire→annual rate** — reported
with explicit "n too small for significance."

**Explicitly NOT decision metrics:** clicks, CTR, CPM, emails, signups-alone. (Signups are an
*optimization* event, not a *success* metric — recon §4.) A cell that wins on cheap clicks but not on
cost-per-buyer **loses.**

Measured chain to capture (per cell): `spend → ViewVerdict → CompleteRegistration → Purchase(tripwire)
→ Purchase(annual)`, with cost and rate at every arrow.

---

## 3. Minimum sample + the rule for calling it

**Power on the tripwire** (the cheapest real-purchase event). Target **≥ ~30 tripwire buyers total**
across the test — achievable: at a projected ~$50–90 cost-per-tripwire, $150–300 *itself* won't reach
30, so the test runs **until ≥30 tripwire events accrue or 14 days elapse**, whichever first, even if
that means topping the budget to the upper bound. Document actual spend.

**Go / no-go rule (what $150–300 *can* decide):**

- ✅ **GO (proceed to Step 4 build + a powered price test):** funnel produces real buyers AND the
  **projected blended CAC lands inside the $120–250 band** — i.e.
  `cost-per-signup × (1 / signup→tripwire) × (1 / tripwire→annual_modeled)` ≤ ~$250, **and** ≥1 real
  annual purchase appears (proof the full path closes), **and** cost-per-tripwire ≤ ~$90.
- ⚠️ **ITERATE (cheapest fix first, recon §):** funnel closes but projected CAC is $250–400 → fix the
  biggest leak (creative hook, value-before-gate, checkout friction) before re-reading. Do **not** scale.
- ❌ **NO-GO / kill:** projected CAC > ~$400 or signup→tripwire collapses (< ~3%) → the offer doesn't
  clear on pure Meta at any realistic creative lift; rethink offer (Step 2), not price.

**Price winner (A vs B):** **defer.** Report the directional cost-per-buyer per cell, but **do not
pick** until the powered follow-on (§7). If both cells produce buyers at similar tripwire economics,
**default to Cell B ($299)** — it's the higher-LTV anchor and the recon math needs the cushion toward
the $250 stress CAC.

---

## 4. Back-of-envelope LTV vs measured CAC — does it clear 3:1?

**LTV (from recon §4, held fixed — this test measures CAC, not LTV):**

```
blended LTV = $99 intro  +  $279–299 renewal × r/(1−r) @ r=0.58–0.60  +  ~$100×20% expansion×lifetime
            ≈ $528 (Cell A)  …  $598 (Cell B)
```

**Measured CAC (computed from the test, not assumed):**

```
measured CAC = total ad spend / (annual purchasers)            ← if ≥ a few buyers land
projected CAC = cost-per-signup ÷ (signup→tripwire) ÷ (tripwire→annual_modeled @ ~30%)
                                                              ← the reliable read at this budget
```

**The 3:1 gate:**

| Scenario | LTV | CAC | Ratio | Verdict |
|---|---|---|---|---|
| Target | ~$540 | ≤ $180 | **≥ 3:1** | ✅ build + scale-test |
| Marginal | ~$540 | $180–270 | 2–3:1 | ⚠️ iterate to cut CAC |
| Broken | ~$540 | > $270 | < 2:1 | ❌ stress-CAC zone — kill/rethink |

The test's job is to locate which row we're in. **3:1 must hold on subscriptions alone** (no affiliate).

---

## 5. Meta test setup (compliant by construction)

- **Special Ad Category:** declare **Financial Products & Services** (recon §3). Consequence: age
  18–65+, no gender/income/behavior targeting, 15-mi min radius, **no classic Lookalikes.**
- **Structure:** ONE consolidated **Advantage+ campaign**, **broad** targeting (the free-verdict hook
  does the qualifying the platform won't), cells A/B as ad sets or via landing param.
- **Optimize for the event volume allows:** **signup (`CompleteRegistration`)** at launch, watching
  cost-per-tripwire downstream — *not* the annual purchase (too sparse; recon §4 ladder).
- **Creative:** real product screens only (Step 6 produces the batch later; for this test, 1–2 quick
  **real screen-recordings** of an instant verdict + streaming memo). No fabricated UI, no returns/
  "get rich," not-advice line on every asset.
- **Tracking:** browser pixel now; **CAPI is Step 5** — but the test must still fire the §6 events so
  rates are measurable. If finance-domain event filtering appears, use the `trackCustom` fallback
  (recon §3).
- **Geo:** **US only.**

---

## 6. Implementation status — BUILT ✅

The A/B is wired end-to-end behind the existing gating (live Stripe, no deploy yet):

| Piece | Status | Where |
|---|---|---|
| Value-before-gate (1 anonymous verdict) | ✅ | `useGate.ts` (realignment) |
| $7 tripwire — **live** Stripe path | ✅ | `price_1TluRY…` · link `…fAc05` |
| Cell A annual ($99→$279 / $199→$379) | ✅ | links `…fAc03` / `…fAc04`, promo `INTRO99` |
| Cell B annual ($99→$299 / $199→$399) | ✅ | links `…fAc06` / `…fAc07`, promo `INTRO99B` |
| Seamless $99 intro | ✅ | `?prefilled_promo_code=` baked into each annual link (auto-applied) |
| Cell assignment (`?cell=a\|b` wins → sticky → 50/50) | ✅ | [experiment.ts](../../src/lib/experiment.ts) |
| Cell-bound price ↔ link ↔ event | ✅ | `WTP_CELLS` in [tiers.ts](../../src/lib/tiers.ts); [checkout.ts](../../src/lib/checkout.ts) |
| Purchase event carries `wtp_cell` | ✅ | [analytics.ts](../../src/lib/analytics.ts) `trackPurchaseSubscription` |

**How a visitor is split:** `resolveWtpCell()` reads `?cell=a|b` (set per Meta ad set's landing URL),
persists it, and falls back to a sticky 50/50 for untagged traffic. The chosen cell drives the renewal
anchor shown (verified: $279/$379 vs $299/$399), the Stripe link used, and the `wtp_cell` tag on the
`Purchase` event — so spend, display, charge, and analytics never disagree.

**Env (in `.env.local`):** `NEXT_PUBLIC_STRIPE_LINK_ANNUAL[_PREMIUM]` (cell A),
`…_ANNUAL[_PREMIUM]_B` (cell B), `…_TRIPWIRE`. A dev server **restart** is required to load newly-added
`NEXT_PUBLIC_*` links (Next inlines them at boot); the cell→price *display* needs no restart.

**Verification done:** `tsc --noEmit` clean; `/pricing?cell=a` → $279/$379, `/pricing?cell=b` →
$299/$399, no console errors. (Live Stripe redirect not exercised in preview — landing is safe but a
completed card submit is a real charge.)

---

## 7. After this test (what each verdict triggers)

- **GO →** Step 4 builds the won funnel (default Cell B unless A clearly cheaper-per-buyer), then a
  **powered price test** (~$9k–18k, or run it as optimization graduates to the `Purchase` event per
  recon §4) actually picks $279 vs $299.
- **ITERATE →** Step 8 CRO loop on the biggest leak; re-run this smoke test.
- **NO-GO →** back to Step 2 — the offer/ladder, not the price, is wrong.

**Guardrail (recon kill-switch):** scaling is forbidden until 3:1 is demonstrated; the model breaks at
the $250 stress CAC, so the lever is **driving CAC down** (creative velocity, retargeting, event
graduation), never discounting below the category floor.

---

#### Inputs
- [meta-recon.md](./meta-recon.md) — CAC ladder, LTV model, event ladder, compliance.
- [conversion-machine.md](./conversion-machine.md) — the funnel this test sends traffic through.
- [product-revision.md](./product-revision.md) — the code prerequisites (in-flight).
