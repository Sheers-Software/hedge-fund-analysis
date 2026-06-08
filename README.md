# ApexAlpha Research

ApexAlpha is an institutional-grade stock research and valuation application. It provides real-time equity data, automated Gemini AI-powered investment memos, and an interactive valuation model.

## Architecture & Tech Stack

This repository contains the Next.js rewrite of the original Python/VanillaJS version. 

*   **Frontend**: Next.js 16 App Router, React 19, Tailwind CSS v4, Zustand.
*   **Backend / API**: Next.js Route Handlers.
*   **AI Engine**: `@google/generative-ai` running on the Vercel Edge Runtime for real-time SSE streaming.
*   **Data Aggregation**: `yahoo-finance2` (primary) with a Finnhub fallback for resilient, real-time quotes across both local and Vercel environments.
*   **Deployment**: Vercel.

## Features

1.  **AI Research Hub**: Generate a comprehensive, institutional-style Hedge Fund investment memo with Gemini 2.5 Flash. Sections stream in live — executive summary, core thesis, business model, industry structure, competitive position, management & capital allocation, financial quality, and investment judgment.
2.  **Professional Export**: Export any generated report as a polished, print-ready **PDF** (clean light layout with a branded cover page, light data tables, and a disclaimer footer) or as **Markdown**.
3.  **Real-Time Fundamentals**: Live company financials, quotes, and news via a resilient multi-source pipeline (see [Data Sources & Reliability](#data-sources--reliability)).
4.  **Valuation Calculator**: Interactive 5-year multi-scenario (Bull, Base, Bear) model with CAGR analysis and fundamentals auto-populated from real-time data.
5.  **Bring-Your-Own-Key**: Keys are stored locally in your browser via `localStorage` (zustand-persist) or supplied server-side via environment variables — no backend database required.
6.  **Dark-Mode Institutional UI**: A focused, dark-first interface built with Tailwind and CSS variables.

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

There are two ways to supply API keys:

**1. In-app (per browser).** Click the **Settings** button in the app navbar to input your keys. They are stored locally via `localStorage` (zustand-persist) and sent with each request.

*   **Gemini API Key**: Required for AI reports. Get one from [Google AI Studio](https://aistudio.google.com/).
*   **Finnhub API Key**: Optional but recommended for real-time ticker search and enhanced/fallback data. Get one from [Finnhub](https://finnhub.io/).

**2. Server-side (environment variables).** For a shared deployment where users shouldn't need their own keys, create a `.env.local` file in the project root. The API routes use these as a fallback whenever a request doesn't carry an in-app key:

```bash
# .env.local  (gitignored)
GEMINI_API_KEY=your_gemini_key
FINNHUB_API_KEY=your_finnhub_key
```

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

If `GEMINI_API_KEY` is missing, the report route returns `401` and the app prompts for an in-app key in the Settings modal.

## Legacy Code

The original Python FastAPI backend and Vanilla JavaScript frontend are preserved in the \`/legacy\` folder for reference.
