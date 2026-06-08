# ApexAlpha AI — Institutional Investment Research & Valuation Engine

ApexAlpha AI is an institutional-grade investment analysis platform. It empowers analysts and fund managers by generating hedge fund level memos, executing long-term due diligence checklists, and building interactive, multi-scenario valuation models using real-time market data and advanced generative AI.

---

## 🌟 Key Features

### 1. Dual-Workflow AI Report Generator
Stream comprehensive reports section-by-section in real time using Server-Sent Events (SSE).
* **Hedge Fund Mode**: Generates an 8-section investment memo containing:
  1. *Executive Summary* — High-level summary of the investment case.
  2. *Core Thesis* — Bull and Bear debate with concrete data.
  3. *Business Model* — Monetization, unit economics, and client base.
  4. *Industry Structure* — Secular trends, market sizing (TAM), and competitive landscape.
  5. *Competitive Position* — Moat depth and sustainable advantages.
  6. *Management & Capital Allocation* — Leadership history and capital deployment rating.
  7. *Financial Quality* — Analysis of margins, cash flows, and balance sheet health.
  8. *Investment Judgment* — Risk/reward profile, target multiples, and final verdict.
* **Research Checklist Mode**: Runs Jeremy's 8-step long-term due diligence process:
  1. *Base Profile* | 2. *Investor Relations* | 3. *Conference Call* | 4. *Quarterly Report* | 5. *Investor Presentations* | 6. *News & Sentiment* | 7. *Valuation* | 8. *Share Statistics*.

### 2. Tailored Research Frameworks (Left Panel)
Every search auto-populates a custom analysis guide on the side panel:
* **What Really Matters**: Key qualitative factors crucial for the specific company.
* **How To Research It**: Actionable steps for primary research.
* **Key KPIs to Track**: Specific operational metrics (e.g., ARR for SaaS, CAC/LTV, Net Retention, ARPU) that move the stock.

### 3. Multi-Scenario Stock Valuation Calculator (`/valuation`)
An interactive modeler to run 5-year projections under three distinct cases (**Bull**, **Base**, and **Bear**):
* **Live Seed Auto-Fill**: Fetches real-time price, market capitalization, shares outstanding, TTM Revenue, and TTM Net Income.
* **Reactive Modeler**: Adjust Revenue Growth, Net Income Growth, and P/E Low/High multiples.
* **Auto Calculations**: Updates projected Revenue, Net Income, Net Margin, EPS, Share Price Targets, and CAGR Returns (from year 3) in real-time.
* **Save/Load State**: Persist and recall custom scenarios locally on your machine via localStorage (per-ticker schema).

### 4. Hybrid Market Data Architecture
* Integrates **Finnhub API** for real-time stock quotes, news feeds, peer listings, and company profiles.
* Uses **yfinance** as a robust fallback for historical price charts, shares outstanding, and comprehensive financial statements.

---

## ⚙️ Architecture & Tech Stack

```
hedge-fund-analysis/
├── frontend/
│   ├── index.html       # Main application interface (Hedge Fund / Checklist reports)
│   ├── valuation.html   # Interactive 3-scenario valuation calculator
│   ├── style.css        # Premium dark glassmorphism styling
│   ├── valuation.css    # Dedicated styling for valuation tables and forms
│   ├── app.js           # SSE client handler, state controller, UI scripts
│   └── valuation.js     # Projection logic, state observer, localStorage cache
│
└── backend/
    ├── main.py          # FastAPI application serving SSE endpoints and HTML routes
    ├── data_fetcher.py  # Financial data aggregator (yfinance + Finnhub wrapper)
    ├── report_generator.py # Gemini Prompt engineer & streaming logic
    └── requirements.txt # Python package dependencies
```

---

## 🏗️ SaaS Transformation Documents

We are currently planning the transformation of ApexAlpha AI from a local tool to a production SaaS platform. The comprehensive planning documents are available in the `docs/saas-planning` directory:

* **[Product Requirements Document (PRD)](docs/saas-planning/prd.md)**: Product vision, user personas, pricing, and feature prioritization.
* **[Architecture Document](docs/saas-planning/architecture.md)**: System design, infrastructure, and technology stack for the multi-tenant SaaS.
* **[Build Plan](docs/saas-planning/build_plan.md)**: Detailed 16-week engineering roadmap and execution plan.

---

## 🚀 Quick Start

### 1. Clone & Set Up Python Environment

```powershell
git clone https://github.com/Sheers-Software/hedge-fund-analysis.git
cd hedge-fund-analysis/backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Start the Backend Server

Start the FastAPI application on port `8001`:

```powershell
uvicorn main:app --reload --port 8001
```

### 3. Open the Client Application

Simply open your browser and navigate to:
* **Research Hub**: `http://127.0.0.1:8001/`
* **Valuation Calculator**: `http://127.0.0.1:8001/valuation`

### 4. Configure API Keys

Click **⚙ API Keys** in the navigation header of the interface to securely configure your tokens:

| API | Type | Purpose | How to Get It |
|---|---|---|---|
| **Gemini API Key** | **Required** | Generates reports and checklist prompts | [Google AI Studio (Free)](https://aistudio.google.com/app/apikey) |
| **Finnhub API Key** | *Optional* | Real-time quote details, peer maps, and news | [Finnhub Portal (Free)](https://finnhub.io/register) |

> [!NOTE]
> Keys are cached purely in-memory on your local instance and are never stored or transmitted to external servers except to invoke official API endpoints.

---

## 📊 Live Screenshots & UI Design

ApexAlpha features a custom **dark glassmorphism design system** featuring:
* Custom-themed color-coded indicators for scenarios (Green for Bull, Blue for Base, Orange for Bear).
* Responsive table inputs that recalculate downstream cash flows instantly on keystroke.
* Smooth loading shimmers and layout transitions.

*Disclaimer: ApexAlpha AI is an educational analysis platform. Projections and memo outcomes are hypothetical estimations and do not constitute financial advice.*
