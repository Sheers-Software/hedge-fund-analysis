# ApexAlpha — Project Context & Handoff

> Single-file context for a fresh Claude session. Read this first, then the files it
> points at. It captures *why* things are the way they are — the architecture, the
> GTM funnel, conventions, gotchas, and current state — so you can build on top
> without re-deriving everything.

---

## 0. Critical environment note (read before writing any code)

`AGENTS.md` (loaded via `CLAUDE.md`) warns:

> **This is NOT the Next.js you know.** This version has breaking changes — APIs,
> conventions, and file structure may differ from training data. Read the relevant
> guide in `node_modules/next/dist/docs/` before writing code. Heed deprecation notices.

This repo runs **Next.js 16.2.7 (Turbopack)** + **React 19**. Before touching routing,
layouts, params, or metadata, consult `node_modules/next/dist/docs/`. Already verified
against those docs: route groups, `layout.tsx`, async `params` (`params: Promise<...>`),
and `useSearchParams` requiring a `<Suspense>` boundary.

- **OS:** Windows 11, PowerShell default shell (Bash also available). Watch for
  CRLF/LF warnings on commit — harmless here.
- **Package manager:** npm. Dev server: `npm run dev` (port 3000, Turbopack).
- **Preview/verify:** there is a `.claude/launch.json` with a `dev` config; the
  `preview_*` tools manage the server. If port 3000 is held by a stray `node`, find the
  PID with `netstat -ano | grep :3000` and kill **only that PID** (never `taskkill /IM node.exe`).

---

## 1. What this product is

**ApexAlpha** — "Hedge-fund-grade stock research, for the price of a coffee." A retail
investor tool that gives:

- An **instant fair-value check** (undervalued / fair / overvalued verdict).
- **AI investment memos** streamed from Google Gemini 2.5 Flash (SSE).
- An **interactive 5-year valuation model** (Bull / Base / Bear DCF-ish, P/E driven).
- **Quarterly charts + projections**.
- Real-time fundamentals via **Yahoo Finance** (primary) with a **Finnhub** fallback
  (Yahoo blocks Vercel data-center IPs, so Finnhub rebuilds the full picture in prod).

It was **rebuilt from a developer-facing BYOK tool into a Meta-ads acquisition funnel**:
cold traffic → instant fair-value hook → email capture → quota-limited free tier →
$9/mo Pro. See `docs/meta-gtm/conversion-copy.md` for the ad copy kit and
`docs/meta-gtm/` for GTM strategy artifacts.

**Tech stack:** Next.js 16 App Router, React 19, Tailwind CSS v4 (`@theme` + CSS vars),
Zustand v5 (`persist` middleware → localStorage), `@google/generative-ai` (Edge runtime
for streaming), `yahoo-finance2` + Finnhub. Deploy target: Vercel.

---

## 2. The funnel architecture (this is the core of the rebuild)

### Route groups split marketing chrome from app chrome
```
src/app/
  layout.tsx              ← root: minimal. fonts + <PixelProvider/> + {children} ONLY
  (marketing)/
    layout.tsx            ← MarketingHeader + main + MarketingFooter + SignupModal
    page.tsx              ← landing page "/"
    pricing/page.tsx      ← "/pricing"
  (app)/
    layout.tsx            ← Navbar + SettingsModal + SignupModal + UpgradeModal + UpgradeReturnHandler
    app/page.tsx          ← dashboard "/app"
    report/[ticker]/page.tsx
    valuation/page.tsx
    charts/page.tsx
  api/                    ← route handlers (quote, report, search, news, …)
```
Why: cold Meta traffic must NOT see the app navbar (confusing) — the landing page has its
own minimal header/footer. `Layout.tsx` was deleted (orphaned once both groups had their
own layouts). The root layout is intentionally bare.

**Routing gotcha:** the brand logo and "Research Hub" nav link point to `/app`, NOT `/`
(`/` is now the marketing landing). When adding nav, remember `/` = marketing, `/app` = dashboard.

### The conversion flow
1. **Landing CTA** (`LandingHero`) — ticker input → `router.push('/app?check=TICKER')`,
   fires `trackViewContent` / `trackSearch`.
2. **Dashboard** (`(app)/app/page.tsx`) intercepts `?check=TICKER` via `useSearchParams`,
   runs `guardQuota("checks", …)`, renders `<FairValueCheck>` inline.
3. **Quota/Pro gate hits** → opens `SignupModal` (email capture = Meta **Lead**) or
   `UpgradeModal` (Stripe Payment Link).
4. **Upgrade return** → `UpgradeReturnHandler` reads `?upgraded=1`, calls `upgrade()` +
   `trackSubscribe`, strips the param.

---

## 3. Tier system & gating (single source of truth)

- **`src/lib/tiers.ts`** — `TIERS` config. The ONE place tier limits live.
  - **Free:** 1 AI memo/mo, 3 fair-value checks/mo, valuation & charts *teased* (blurred),
    history capped at 3, no export.
  - **Pro ($9/mo):** unlimited memos & checks, full valuation, full charts, export, unlimited history.
  - Also exports `STRIPE_PAYMENT_LINK` (from `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`).
- **`src/lib/useGate.ts`** — the `useGate()` hook. ALL gating goes through here:
  - `ensureSignedUp(reason, action?)` — signup gate.
  - `guardQuota("reports"|"checks", action)` — quota gate (signs up if anon, else checks quota, else upgrade).
  - `guardPro("valuationFull"|"chartsFull"|"exportEnabled", reason)` — Pro feature gate.
  - Returns `tier, isPro, isSignedUp, limits, remainingReports, remainingChecks`.
- **`src/components/app/ProGate.tsx`** — blurred-preview paywall wrapper for Pro features.

> **Design rule:** never hard-code a tier limit in a component. Read it from `tiers.ts`
> via `useGate()`. If you add a gated feature, add the limit to `TierLimits` first.

### Known caveat (intentional, validation-MVP)
Gating is **client-side** (localStorage via Zustand). A determined user can reset it. This
is deliberate — it validates whether ads convert before investing in a backend. The clean
next step is **server-side quota + a Stripe webhook** to reconcile real subscriptions.
Teaser (Pro) pages also still fetch data behind the blur — minor waste, deferrable.

---

## 4. State (Zustand, all in `src/lib/store.ts`)

- **`useSettingsStore`** (persist `apex-alpha-settings`) — `geminiKey`, `finnhubKey`.
  BYOK is now a *power-user override*; server env keys are the default.
- **`useUserStore`** — `email, tier, signedUpAt, proSince, usage` (with monthly reset),
  `signup()`, `upgrade()`, `recordReport()`, `recordCheck()`, `canUse()`, `remaining()`.
- **`useHistoryStore`** — `items: HistoryItem[]`, `add()` (dedupes by ticker), `recent()`,
  `lastSearched()`, capped at 50. `kind: "report"|"check"|"valuation"|"charts"`.
- **`useAppStore`** (NOT persisted) — sidebar/settings UI + the global conversion modals:
  `isSignupOpen/signupReason/afterAuth/openSignup/closeSignup` and
  `isUpgradeOpen/upgradeReason/openUpgrade/closeUpgrade`. `afterAuth` resumes a gated action
  after signup.

> **Hydration rule (important):** any component that branches on persisted state
> (`ProGate`, `AccountBadge`, `RecentSearches`, dashboard usage meter) MUST use a
> `const [mounted,setMounted]=useState(false); useEffect(()=>setMounted(true),[])` guard
> and render a stable pre-mount fallback. Persisted Zustand state isn't known on the server;
> branching on it before mount causes SSR/client mismatch. Follow the existing pattern.

---

## 5. Meta Pixel (`src/lib/analytics.ts` + `components/analytics/PixelProvider.tsx`)

- SSR-safe `fbq` wrapper. **Every call is a no-op when `NEXT_PUBLIC_FB_PIXEL_ID` is unset.**
- Funnel events fired across the journey:
  `PageView → ViewContent → Lead → StartTrial → InitiateCheckout → Subscribe`.
- `RouteTracker` (inside `<Suspense>`) fires `PageView` on client navigations, skipping the
  first render (the init script already counts the initial load).

---

## 6. Key feature internals

- **Fair-value engine** — `src/lib/fairValue.ts` → `computeFairValue(CompanyData)`.
  Verdict from: analyst consensus target (primary) → growth-adjusted earnings multiple /
  PEG (fallback) → 52-week range context. Returns
  `{ verdict, gapPct, fairValue, signals[], basis }`. Rendered by
  `components/app/FairValueCheck.tsx`.
- **Valuation calculator** — `src/components/valuation/ValuationCalculator.tsx`.
  Seeds Year-1 from forward FY analyst consensus (`revenue_fwd`, `eps_fwd * shares`) and
  falls back to TTM actuals when estimates are missing (Yahoo blocked on Vercel). Bull/Base/
  Bear tables compute revenue/NI growth → EPS → P/E-driven share price → CAGR.
  - **localStorage contract (fixed — don't regress):** Save/Load AND auto-restore all use
    `apexalpha_val_<TICKER>_<scenario>` (ticker-scoped). On data fetch, all three scenarios
    auto-restore from this key, falling back to `SCENARIO_DEFAULTS` when absent (which also
    resets stale values when switching tickers). A prior bug had Save writing a *global*
    key while auto-restore read a *never-written* ticker key → dead auto-load + cross-ticker
    leakage. Keep the keys unified.
- **AI report** — `src/app/api/report/[ticker]/route.ts`, **Edge runtime**, SSE streaming
  of memo sections. If `GEMINI_API_KEY` (or in-app key) is missing it returns 401 and the UI
  prompts for a key.
- **Data fetcher** — `src/lib/data-fetcher.ts` (`fetchCompanyData`). Yahoo primary, Finnhub
  fallback/enrichment, hard timeouts on every external call. `/api/quote/[ticker]` returns
  `{ info, financials, real_time_quote, finnhub_profile, error }`.

---

## 7. Environment variables

| Variable | Required? | Purpose |
| --- | --- | --- |
| `GEMINI_API_KEY` | Yes | AI report generation (server-side default). |
| `FINNHUB_API_KEY` | Yes in prod | Real-time data fallback + ticker search (keeps data flowing when Yahoo is blocked on Vercel). |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Optional | Meta Pixel. Unset = pixel + all analytics calls no-op. |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | Optional | $9/mo Pro Payment Link. Unset = upgrades flip optimistically (local testing). |
| `NEXT_PUBLIC_SITE_URL` | Optional | Canonical URL for OG/metadata. |

Local: copy `.env.example` → `.env.local`. Vercel: set under Project → Settings → Env Vars
for **Production AND Preview**, then redeploy. `.env.local` is gitignored / not deployed.

**To actually go live, only config is needed (no code):** set `NEXT_PUBLIC_FB_PIXEL_ID`
(Meta Events Manager) and `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` (Stripe recurring Payment Link).

---

## 8. Conventions & gotchas cheat-sheet

- `/` = marketing landing; `/app` = dashboard. Internal "home" links go to `/app`.
- Never hard-code tier limits — read from `tiers.ts` via `useGate()`.
- Persisted-state UI needs the `mounted` hydration guard + stable fallback.
- Analytics/Pixel/Stripe all degrade to no-ops when their env var is blank — keep it that way
  so dev stays clean.
- `useSearchParams` requires a `<Suspense>` wrapper (Next 16). See existing pages for the pattern.
- Async route params are `params: Promise<{…}>` — `await` them.
- Read `node_modules/next/dist/docs/` before changing routing/layout/metadata behavior.
- Marketing CSS lives in `globals.css` under the `.mkt-*` classes; app-widget CSS under
  `.fvc-*`, `.recent-*`, `.usage-meter`, `.acct-*`, `.lock-*`, `.val-*`.

---

## 9. Current git / PR state

- **Branch:** `nextjs-version` (the working branch; merges to `main` via PR — 4 already merged).
- **Open PR:** **#5** — "feat: rebuild product as Meta-ready free→paid acquisition funnel"
  (`nextjs-version` → `main`): https://github.com/Sheers-Software/hedge-fund-analysis/pull/5
- **Latest commits on branch:**
  - `a3c92f4` fix: correct valuation save/load to use consistent ticker-scoped keys
  - `5181c72` feat: rebuild product as Meta-ready free→paid acquisition funnel
- Pushing directly to `main` is blocked by policy — go through the PR.
- Commit trailer convention: `Co-Authored-By: Claude <model> <noreply@anthropic.com>`.

---

## 8b. Accounts, auth & the 3-tier model (built on top of the funnel)

The validation-MVP "email-only capture" was upgraded to a **full client-side
account system** and the tiers went from Free/Pro(2) to **Free / Basic / Premium(3)**
(good-better-best; market-standard for retail-investing tools, lifts ARPU via
anchoring). All still client-side (no backend) — see the security caveat below.

**Tiers — `src/lib/tiers.ts` (still the single source of truth):**
- `Tier = "free" | "basic" | "premium"`; prices **$0 / $9 / $19**.
- Authorization is rank-based: `TIER_ORDER`, `tierRank`, `meetsTier(current, required)`.
- `FEATURE_MIN_TIER` maps each gated feature → the tier that unlocks it:
  valuation/charts/export → **basic**; **intelFull → premium** (Intelligence is the
  Premium flagship). Quota (reports/checks) goes unlimited at **basic** (`QUOTA_UNLOCK_TIER`).
- `requiredTierFor(feature)`, `PAID_TIERS`, `priceFor`, `stripeLinkFor(tier)`,
  `STRIPE_PAYMENT_LINKS` (per-tier: `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` = Basic,
  `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM` = Premium).

**Auth — `src/lib/auth.ts` + `useUserStore` (`src/lib/store.ts`):**
- Email + password signup → **PBKDF2 (Web Crypto) hashing**, per-user salt, never
  plaintext. Email-format + password-strength validation. A simulated 6-digit
  **verification step** (no ESP wired yet, so the code is surfaced in-modal in "demo
  mode" — remove once an ESP is connected). Login / logout / relogin; session persists,
  logout keeps the account so relogin restores its tier.
- The store now holds `accounts` (the local "user DB" keyed by email) + `sessionEmail`
  + `pending` verification. **The active session is mirrored onto the old top-level
  fields** (`email/tier/usage/…`) so every existing `useUserStore(s => s.tier|email|…)`
  selector keeps working untouched. Methods: `register/verifyEmail/resendCode/login/
  logout`, plus `upgrade(tier)` / `setTier(tier)`. Persist `version` bumped to 1
  (migrate discards pre-auth state).

> **⚠️ Security honesty:** this is client-side auth — credentials live in localStorage,
> so PBKDF2 prevents plaintext-at-rest and shows the right pattern but is NOT hardened
> (reachable by the user / XSS). It's deliberately agile for GTM validation. **Production
> step:** a managed provider (Supabase / Clerk / Auth.js) + server sessions + a Stripe
> webhook to reconcile real subscriptions. The store API is shaped so that swap is mostly
> a drop-in.

**Gating UX — `useGate.ts` / nav / modals:**
- `guardPro(feature)` and `guardQuota` now target the *correct* tier (via
  `FEATURE_MIN_TIER` / `QUOTA_UNLOCK_TIER`) and open the upgrade modal pointed at it.
- **Nav tabs show a lock icon** when the user's tier doesn't meet the tab's required
  tier (`Navbar.tsx` `NAV_TABS`, mounted-guarded). Clicking a locked tab opens the
  **signup** modal (anonymous) or the **upgrade** modal targeting the right tier
  (signed-in) — it does NOT navigate.
- `SignupModal` is now a multi-step **Auth modal** (signup / verify / login).
  `UpgradeModal` shows both paid tiers and highlights the gate's target.
  `AccountBadge` shows the tier chip + a menu (Upgrade / Log out).
  `UpgradeReturnHandler` reads an `apex-alpha-pending-tier` crumb to flip to the
  purchased tier on Stripe return. `ProGate` names the target tier in its CTA.

All flows browser-verified: signup (+email/password validation, +wrong/right code),
login (+wrong password), logout, relogin (tier restored), nav locks → correct popup,
tier-differentiated gating (Free→all locked, Basic→Intelligence locked, Premium→all
open), and each nav link rendering its view.

## 9b. AI Intelligence terminal (`/intel`) — the multi-panel research desk

A Bloomberg-lite, Pro-gated "research desk on one screen", built to a reference
mockup. Route group `(app)/intel`: `/intel` (empty-state landing, sample tickers)
and `/intel/[ticker]` (the dashboard, wrapped in `ProGate feature="intelFull"`).
Nav tab "Intelligence" sits between Research Hub and Valuation; Navbar search and
`FairValueCheck` deep-link to `/intel/<T>`.

**Five panels** (`src/components/intel/`, grid in `globals.css` under `.intel-*`):
1. **Multi-Model View** — fanned multi-line forward projection + a model roster.
2. **AI Analysis** — Technical / Fundamental tabs, confidence meter, signal tag.
3. **Support & Resistance** — pivot-clustered levels + mini sparkline.
4. **Top Transactors** — Institutions/Insiders; insider tab is **real** Finnhub
   Form-4 data (`/stock/insider-transactions`, free tier).
5. **Financials** — Balance Sheet / Income Statement, quarterly grouped bars + Y/Y.

**Engine — `src/lib/intel.ts` (pure, dependency-free):** `computeTechnicals`
(RSI/SMA20-50/MACD/vol/momentum), `computeSupportResistance` (pivot clustering),
`computeProjection` (an **honest quant ensemble**: Momentum / Trend / Mean-Reversion
/ Volatility / Seasonal → confidence-weighted Consensus), and `parseFinancialsReported`
(tolerant Finnhub `financials-reported` label matcher).

**API — `src/app/api/intel/[ticker]/route.ts` (Node runtime, NOT edge — uses
`fetchCompanyData`/yahoo-finance2):** reuses `/api/quote`'s fetcher + Finnhub
`financials-reported` & `insider-transactions`, computes all indicators, then layers
an **optional single Gemini 2.5 Flash call** that only *narrates* the precomputed
numbers (strict JSON, `responseMimeType`). Falls back to deterministic rule-based
narration when no `GEMINI_API_KEY` — so it renders fully without any AI key.

> **Design decision (deliberate, keep it):** the reference mockup labeled the model
> lines with AI-vendor brands (Grok/ChatGPT/Claude/Meta). We do **not** impersonate
> vendors we never call. The ensemble lines are named for the *quant regime* they
> capture; the only branded line is **"Gemini AI"**, added solely when the Gemini
> call actually ran and returned a directional read (`aiForecast`). Honesty matters
> in a financial product — don't "rebrand" these as external AIs.

Gating: added `intelFull` to `TierLimits` (free:false / pro:true) — extend
`guardPro`/`ProGate` unions if you touch it. History gained `kind: "intel"`.
Same teaser caveat as other Pro pages: it still fetches behind the blur (see §3).

## 10. Suggested next steps (not yet done)

1. **Harden gating** — server-side quota + Stripe webhook to replace client-side localStorage
   gating (the main validation-MVP shortcut).
2. **Stop teaser pages fetching behind the blur** — skip the data fetch when `ProGate` is locked.
3. **Wire real env vars** — `NEXT_PUBLIC_FB_PIXEL_ID`, `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` in Vercel.
4. **ESP integration** — load the 5-email nurture sequence from
   `docs/meta-gtm/conversion-copy.md` into MailerLite/Brevo; the SignupModal currently only
   captures email to localStorage (no ESP call yet).
5. **Visual/browser QA pass** across the full funnel once Pixel + Stripe are live.
6. **Launch the Meta campaigns** using `docs/meta-gtm/conversion-copy.md` (3 audiences:
   DIY / FOMO / value investors; optimize for the **Lead** event).

---

## 11. Map of files created/changed in the rebuild

**New libs:** `src/lib/tiers.ts`, `useGate.ts`, `analytics.ts`, `fairValue.ts`
(+ `store.ts` extended with user/history/modal state).

**New components:**
- `analytics/PixelProvider.tsx`
- `app/FairValueCheck.tsx`, `app/RecentSearches.tsx`, `app/AccountBadge.tsx`, `app/ProGate.tsx`
- `conversion/SignupModal.tsx`, `conversion/UpgradeModal.tsx`, `conversion/UpgradeReturnHandler.tsx`
- `marketing/LandingHero.tsx`, `marketing/PricingTable.tsx`, `marketing/MarketingHeader.tsx`, `marketing/MarketingFooter.tsx`

**Routing:** root `layout.tsx` minimized; `(marketing)/` and `(app)/` groups added; app pages
moved under `(app)/`; `components/layout/Layout.tsx` deleted; `Navbar.tsx`/`Sidebar.tsx`
links repointed to `/app`.

**Styles:** `globals.css` — added `.mkt-*` (marketing) and app-widget class blocks.

**Docs:** `docs/meta-gtm/conversion-copy.md` (paste-ready ad copy kit, 3 audiences, Reels
scripts, nurture emails, compliance cheat-sheet, UTM scheme, first-$50 test plan).
`README.md` updated (features, config, GTM section).
