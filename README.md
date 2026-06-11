# ApexAlpha Research

**Hedge-fund-grade stock research — for the price of a coffee.** ApexAlpha gives retail investors real-time equity data, automated Gemini AI-powered investment memos, an interactive valuation model, and an instant "fair-value check" — packaged as a free→paid funnel built to acquire and convert traffic from Meta (Facebook/Instagram) ads.

> Research & educational tool — **not** investment advice.

## Go-to-Market (Meta funnel)

The product is positioned and instrumented for paid social acquisition:

- **Marketing site** (`/`, `/pricing`) — conversion-focused landing pages with message-matched hero copy, instant-ticker hook, and a Stripe-backed pricing table. Lives in the `src/app/(marketing)` route group with its own minimal chrome.
- **The app** (`/app`, `/report`, `/valuation`, `/charts`) — the product itself, in the `src/app/(app)` route group behind the full app shell.
- **Free → Paid tiers** — a quota'd **Free** tier (1 AI memo + 3 fair-value checks / month; valuation & charts teased) and a **$9/mo Pro** tier (unlimited everything, full models, PDF export, history). Defined once in `src/lib/tiers.ts` and enforced via `src/lib/useGate.ts`.
- **Onboarding / trial** — email-capture signup (the Meta *Lead* event) gates the first action; upgrades route through a Stripe Payment Link. No backend DB (validation-MVP model) — account/quota/history persist in `localStorage` via Zustand.
- **Meta Pixel** — `src/lib/analytics.ts` + `src/components/analytics/PixelProvider.tsx` fire `PageView → ViewContent → Lead → StartTrial → InitiateCheckout → Subscribe` across the funnel when `NEXT_PUBLIC_FB_PIXEL_ID` is set (a no-op otherwise).
- **Ad copy kit** — paste-ready Meta ad copy, audience targeting, landing variants, the email nurture sequence, compliance cheat-sheet, naming/UTM scheme, and a first-$50 test plan: [`docs/meta-gtm/conversion-copy.md`](docs/meta-gtm/conversion-copy.md).

ApexAlpha is an institutional-grade stock research and valuation application. It provides real-time equity data, automated Gemini AI-powered investment memos, and an interactive valuation model.

## Architecture & Tech Stack

This repository contains the Next.js rewrite of the original Python/VanillaJS version. 

*   **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, Zustand.
*   **Backend / API**: Next.js Route Handlers.
*   **AI Engine**: `@google/generative-ai` running on the Vercel Edge Runtime for real-time SSE streaming.
*   **Data Aggregation**: `yahoo-finance2` (primary) with a Finnhub fallback for resilient, real-time quotes across both local and Vercel environments.
*   **Deployment**: Vercel.

## Features

1.  **Instant Fair-Value Check**: Type any ticker → get an instant undervalued / fair / overvalued verdict from analyst consensus targets, growth-adjusted P/E, PEG ratio, and 52-week range context. The entry point for Meta ad traffic.
2.  **AI Research Hub**: Generate a comprehensive, institutional-style hedge fund investment memo with Gemini 2.5 Flash. Sections stream in live — executive summary, core thesis, business model, industry structure, competitive position, management & capital allocation, financial quality, and investment judgment.
3.  **Free → Pro Tiers**: **Free** tier gives 1 AI memo + 3 fair-value checks per month with valuation/charts teased behind a blurred preview. **Pro ($9/mo)** unlocks unlimited memos, unlimited checks, full valuation model, full charts, PDF/MD export, and unlimited search history.
4.  **Research History**: Recent tickers (reports, checks, valuations, charts) surface on the dashboard. Free tier keeps the last 3; Pro keeps all.
5.  **Valuation Calculator**: Interactive 5-year multi-scenario (Bull, Base, Bear) DCF model with CAGR analysis — auto-populated from live data. Pro only.
6.  **Professional Export**: Export any generated report as a polished, print-ready **PDF** or **Markdown**. Pro only.
7.  **Real-Time Fundamentals**: Live company financials, quotes, and news via a resilient multi-source pipeline (see [Data Sources & Reliability](#data-sources--reliability)).
8.  **Dark-Mode Institutional UI**: A focused, dark-first interface built with Tailwind CSS v4 and CSS variables.

## Getting Started

### Prerequisites

*   Node.js 18+
*   npm or pnpm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/Sheers-Software/hedge-fund-analysis.git
    cd hedge-fund-analysis
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

API keys are supplied server-side via environment variables. Create a `.env.local` file in the project root (see `.env.example` for the full template):

```bash
# .env.local  (gitignored)
GEMINI_API_KEY=your_gemini_key        # Required — AI report generation
FINNHUB_API_KEY=your_finnhub_key      # Required in production — real-time data fallback

# Meta GTM funnel (optional — features degrade gracefully when unset)
NEXT_PUBLIC_FB_PIXEL_ID=              # Meta Pixel ID from Business Manager → Events Manager
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=      # Stripe Payment Link for $9/mo Pro plan
NEXT_PUBLIC_SITE_URL=https://apexalpha.app
```

> **Power users:** The Settings modal in the app accepts in-app API keys as an override, stored locally in `localStorage`. These take precedence over server-side keys on a per-browser basis.

## Data Sources & Reliability

Financial data is pulled in real time on every request (no caching) and is designed to stay consistent across localhost and Vercel:

*   **Yahoo Finance (`yahoo-finance2`)** is the primary source and provides the richest fundamentals.
*   **Finnhub** is both an enrichment source and a complete fallback. Yahoo Finance blocks Vercel's data-center IPs, so in production the app rebuilds the full financials picture (revenue, net income, EPS, margins, growth, ratios) from Finnhub — keeping the Valuation model populated even when Yahoo is unavailable.
*   **Timeouts** cap every external call so a blocked or hanging upstream request fails fast instead of exhausting the serverless function budget.

> **Vercel note:** set `FINNHUB_API_KEY` in your project's Environment Variables. It is what keeps real-time data flowing in production once Yahoo Finance is blocked.

## Deployment

The application is optimized for deployment on Vercel.

```bash
npm run build
npm start
```

The AI generation route (\`src/app/api/report/[ticker]/route.ts\`) explicitly targets the \`edge\` runtime to avoid Vercel's standard serverless function timeout limits for streaming responses.

### Environment variables on Vercel

`.env.local` is **not** deployed. Add your keys under **Project → Settings → Environment Variables**, enable them for the **Production** *and* **Preview** environments (Preview matters for branch/PR deployments), then **redeploy** — existing deployments don't pick up new variables:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Required for AI report generation. |
| `FINNHUB_API_KEY` | Real-time data fallback and ticker search. |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Meta Pixel ID. Enables the pixel + funnel conversion events. Leave blank to disable (no-op). |
| `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` | Stripe Payment Link for the $9/mo Pro plan. The "Upgrade" buttons send users here; on return with `?upgraded=1` the app flips them to Pro. If blank, upgrades unlock optimistically for local testing. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for OpenGraph/metadata. |

If `GEMINI_API_KEY` is missing, the report route returns `401` and the app prompts for an in-app key in the Settings modal.

## Legacy Code

The original Python FastAPI backend and Vanilla JavaScript frontend are preserved in the \`/legacy\` folder for reference.
