# Step 5 — Conversion Tracking (pixel + CAPI, server-side)

> **What this is.** Step 5 of [playbook-apexalpha-meta.md](../michia/playbook-apexalpha-meta.md):
> instrument ONE purchase event server-side so Meta optimizes on the cheapest *accurate* signal.
> This is the **as-built spec** — the browser pixel and the Conversions API (CAPI) now fire every
> conversion through a single shared `event_id` so Meta deduplicates and attributes it once.
> Date: 2026-06-25. Branch: `nextjs-version`. **No deploy** (Step 7).

---

## 1. Architecture — one event, two transports, deduplicated

```
  Browser event (fbq pixel)  ──┐
        same event_id          ├──►  Meta dedupes on (event_name, event_id) → counts once
  Server event (CAPI relay)  ──┘
```

- **Pixel** ([PixelProvider.tsx](../../src/components/analytics/PixelProvider.tsx)) loads only when
  `NEXT_PUBLIC_FB_PIXEL_ID` is set; fires `fbq(type, event, params, { eventID })`.
- **CAPI relay**: every deduped helper in [analytics.ts](../../src/lib/analytics.ts) calls `fire()`,
  which generates ONE `event_id`, passes it to the pixel as `eventID`, **and** mirrors the event to
  [`/api/meta/capi`](../../src/app/api/meta/capi/route.ts) with the **same** `event_id`.
- **Server send** ([capi/route.ts](../../src/app/api/meta/capi/route.ts)): enriches with server-only
  signals (IP, user-agent), hashes PII, and POSTs to the Graph API
  `POST https://graph.facebook.com/{version}/{DATASET_ID}/events`.
- **Beacon survives navigation**: the client `fetch` uses `keepalive:true`, so the Purchase event
  still sends through the Stripe redirect.
- **Safe by default**: with `META_CAPI_DATASET_ID` / `META_CAPI_ACCESS_TOKEN` unset, the route
  acknowledges and no-ops (and in dev echoes the exact `would_send` payload for QA).

### Why a client→server relay (not a Stripe webhook)
The validation MVP has no billing backend; the tier flips optimistically on Stripe return
([checkout.ts](../../src/lib/checkout.ts) `applyPurchase`). The relay fires the server event at the
same moment. When real billing lands, move the Purchase send to a Stripe webhook for authority — the
event names/payloads below don't change.

---

## 2. The event ladder (names + payloads are fixed here)

| Rung | `event_name` | Transport | Dedup | Payload (`custom_data`) |
|---|---|---|---|---|
| ① free verdict | `ViewVerdict` *(custom)* | pixel + CAPI | ✓ | `{ ticker }` |
| ② account | `CompleteRegistration` | pixel + CAPI | ✓ | `{}` ← **launch optimization event** |
| ③ tripwire | `Purchase` | pixel + CAPI | ✓ | `{ value:7, currency:"USD", content_type:"tripwire", ticker }` |
| ④ annual | `Purchase` | pixel + CAPI | ✓ | `{ value:99\|279\|299, currency:"USD", content_type:"subscription", plan, cadence:"annual", wtp_cell, predicted_ltv }` ★ |
| ⑤ expansion | `Purchase` | pixel + CAPI | ✓ | `{ value:~100, currency:"USD", content_type:"expansion", plan:"premium" }` |
| ⑥ retention | `RenewalPrompt` *(custom)* | pixel + CAPI | ✓ | `{ status:"renewing-soon"\|"lapsed", plan }` |

- **`predicted_ltv = MODELED_LTV` ($560)** — the modeled blended LTV, **never** `value×12` (the dead
  monthly model). Set in [analytics.ts](../../src/lib/analytics.ts) `trackPurchaseSubscription`.
- **`value + plan + cadence`** ride every Purchase, so LTV is measurable per customer and the
  $279-cell (`wtp_cell:"a"`) vs $299-cell (`b`) split is attributable.
- Funnel hooks (non-conversion): `PageView`, `ViewContent`, `Search` (pixel only, no CAPI).

---

## 3. Identity / advanced matching (`user_data`)

The client forwards what it has; the server adds the rest and hashes PII per Meta's normalization
(trim → lowercase → SHA-256).

| Field | Source | Hashed? |
|---|---|---|
| `em`, `external_id` | logged-in email (store) | **SHA-256** (server) |
| `fbp` | `_fbp` cookie (pixel) | raw |
| `fbc` | `_fbc` cookie (pixel) | raw |
| `client_ip_address` | `x-forwarded-for` (Vercel) | raw |
| `client_user_agent` | `user-agent` header | raw |

**Finance-domain caveat (recon §3).** Some finance domains see `Purchase`/`Lead` filtered. Mitigation:
`ViewVerdict` and `RenewalPrompt` are **custom** events (never filtered), and `trackCustom` is wired as
the fallback transport. Before scaling, confirm in Events Manager that `Purchase` is received for our
domain; if filtered, mirror to a `PurchaseCustom` custom event and optimize on that.

---

## 4. Optimization graduation — start learnable, climb to the money

Meta needs **~50 optimization events / ad set / week** to exit the learning phase. Optimize on the
**closest-to-money signal that clears that bar**, and graduate as volume grows:

| Phase | Optimize for | Enter when | Why |
|---|---|---|---|
| **0 — Launch** | `CompleteRegistration` | day 1 | Cheap, high-volume, learnable at low spend; the gated wow predicts intent |
| **1 — Tripwire** | `Purchase` *(tripwire-dominated)* | ad set holds **≥50 registrations/wk** AND tripwire buys accumulating | A real card-on-file buyer beats a signup |
| **2 — Annual** | `Purchase` + **value optimization** | **≥50 Purchases/ad-set/wk** | Optimizes for revenue; lets Meta favor the $99-annual buyer over the $7 buyer |

- Don't graduate early: thin signal → unstable learning → higher CAC.
- Graduating resets learning; only do it when Phase N+1 will itself clear ~50/wk.
- **Audiences** (built from the CAPI events, populated for Step 7): see
  [product-refinement.md §2](./product-refinement.md). Special Ad Category → Special Ad Audience
  seeded from `Purchase{subscription}`, **not** a classic Lookalike.

---

## 5. The unit-economics gate — CAC : LTV ≥ 3:1, and the kill-switch

- **Modeled blended LTV = $560** (annual intro + expected Premium expansion + one renewal at
  r ≥ 0.58–0.60). Source of truth: `MODELED_LTV` in [tiers.ts](../../src/lib/tiers.ts).
- **3:1 breakeven CAC = LTV / 3 = ~$187.** Reference CACs (recon): **$120 / $180 plan / $250 stress.**
  - $120 → 4.7:1 ✅ · $180 → 3.1:1 ✅ · **$250 → 2.2:1 ❌ (model breaks at stress).**
- **Decision metric:** trailing-7-day **cost per `Purchase{content_type:"subscription"}`** (NOT clicks,
  NOT registrations) ÷ into $560. Tripwire→annual rate is the secondary read.
- **KILL-SWITCH:** when blended **LTV : CAC < 3:1** (i.e. trailing subscription CAC **> $187**),
  **stop scaling** that campaign. The lever is driving **CAC down** (fresh creative, retargeting,
  funnel CRO) — **never** discounting below the category floor ($99 intro / $279–299 renewal). Hard
  stop on any ad set whose trailing CAC exceeds $187 across a meaningful window.

---

## 6. Setup (before Step 7 deploy)

1. Events Manager → create/identify the **dataset**; copy the **dataset ID** and generate a **CAPI
   access token**.
2. Set in **Vercel** (Project → Settings → Environment Variables) and locally in `.env.local`:
   - `NEXT_PUBLIC_FB_PIXEL_ID` (client), `META_CAPI_DATASET_ID`, `META_CAPI_ACCESS_TOKEN` (server).
   - Optional: `META_CAPI_TEST_EVENT_CODE` (routes to Test Events), `META_GRAPH_API_VERSION`.
   - `NEXT_PUBLIC_*` changes need a **dev restart / redeploy** (Next inlines at boot).
3. Verify in Events Manager → **Test Events** that each rung arrives **once** with dedup
   (browser + server collapsing to a single event), then remove the test code.

---

## 7. Verification done

- `tsc --noEmit` clean.
- Route, no-creds dev echo (`would_send`) for a full annual Purchase — **confirmed exact**:
  - `em` & `external_id` = `SHA-256("demo@apex.test")` =
    `a284e8dc…f8fa8f62` (matches `sha256sum`); `fbp`/`fbc` raw; `client_ip_address` = first hop of
    `x-forwarded-for`; `client_user_agent` from header; `event_id` preserved (dedup key);
    `custom_data` carries `value/plan/cadence/wtp_cell/predicted_ltv`.
  - Missing `event_name` → `400`. Unconfigured → `{ok:true, forwarded:false, reason:"capi-not-configured"}`.
- **Live Graph send NOT exercised** (needs the real dataset token; would post to Meta). Validate in
  Events Manager → Test Events during Step 7 setup using the walk-the-funnel checklist below.

### Walk-the-funnel checklist (run in Test Events at Step 7)
- [ ] `ViewVerdict` fires once on the free ungated verdict.
- [ ] `CompleteRegistration` fires once on email verify; deduped (pixel+CAPI = 1).
- [ ] `Purchase{tripwire, value:7, ticker}` once on $7 deep-dive.
- [ ] `Purchase{subscription, cadence:"annual", plan, value, wtp_cell, predicted_ltv:560}` once on annual.
- [ ] `Purchase{expansion, plan:"premium"}` once on order-bump AND on the `/intel` upsell.
- [ ] `RenewalPrompt{status}` fires when the retention banner appears.
- [ ] No event double-counts (every event carries a shared `event_id`).

---

## 8. Files touched this step
- [analytics.ts](../../src/lib/analytics.ts) — `sendCapi` now forwards `user_data` (email + `_fbp`/`_fbc`)
  and `event_time`; `readCookie` helper.
- [capi/route.ts](../../src/app/api/meta/capi/route.ts) — real Graph API send: SHA-256 email hashing,
  `user_data` assembly, IP/UA enrichment, `action_source`, test-event support, dev `would_send` echo.
- [.env.example](../../.env.example) — documented `META_CAPI_*` + optional test-code / API-version vars.

## 9. What's left (out of Step 5)
- **Step 6** — native/UGC Meta creative (Higgsfield) → `docs/meta-gtm/marketing-assets/`.
- Step 7 — set env in Vercel, deploy, verify the live funnel in Test Events, build the campaign.
- When real billing lands, move the Purchase send authority to a Stripe webhook.
