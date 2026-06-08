# ApexAlpha Research

ApexAlpha is an institutional-grade stock research and valuation application. It provides real-time equity data, automated Gemini AI-powered investment memos, and an interactive valuation model.

## Architecture & Tech Stack

This repository contains the Next.js rewrite of the original Python/VanillaJS version. 

*   **Frontend**: Next.js 15 App Router, React 19, Tailwind CSS v4, Zustand.
*   **Backend / API**: Next.js Route Handlers.
*   **AI Engine**: `@google/generative-ai` running on the Vercel Edge Runtime for real-time SSE streaming.
*   **Data Aggregation**: `yahoo-finance2` and Finnhub APIs.
*   **Deployment**: Vercel.

## Features

1.  **AI Research Hub**: Generate comprehensive Hedge Fund investment memos or Research Checklists using Gemini 2.5 Flash. The responses stream in real-time.
2.  **Stateless API Design**: Bring your own API keys. Keys are stored locally in your browser via `localStorage` (zustand-persist) and never saved to a backend database, making this a zero-cost demo.
3.  **Valuation Calculator**: Interactive 5-year multi-scenario (Bull, Base, Bear) valuation model with CAGR analysis and auto-populated fundamental metrics.
4.  **Glassmorphism UI**: Beautiful, dark-mode-first institutional interface built with Tailwind and CSS variables.

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

To use the AI generation and advanced search features, click the **Settings** button in the app navbar to input your API keys:
*   **Gemini API Key**: Required for AI reports. Get one from [Google AI Studio](https://aistudio.google.com/).
*   **Finnhub API Key**: Optional but recommended for real-time ticker search and enhanced data. Get one from [Finnhub](https://finnhub.io/).

## Deployment

The application is optimized for deployment on Vercel.

```bash
npm run build
npm start
```

The AI generation route (\`src/app/api/report/[ticker]/route.ts\`) explicitly targets the \`edge\` runtime to avoid Vercel's standard serverless function timeout limits for streaming responses.

## Legacy Code

The original Python FastAPI backend and Vanilla JavaScript frontend are preserved in the \`/legacy\` folder for reference.
