"""
FastAPI backend for the Hedge Fund Analysis Report Engine.
Serves SSE-streamed AI-generated investment reports and the frontend UI.
"""

import asyncio
import json
import logging
import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv

from data_fetcher import fetch_company_data, search_tickers
from report_generator import (
    generate_section_stream,
    generate_research_guide,
    WORKFLOW_SECTIONS,
)

# Load environment variables from .env file
load_dotenv()

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="ApexAlpha AI",
    description="AI-powered institutional investment report generator",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Serve Frontend Static Files ───────────────────────────────────────────────
FRONTEND_DIR = Path(__file__).parent.parent / "frontend"

# ── In-memory session store for API keys ──────────────────────────────────────
_session_keys: dict = {
    "gemini_api_key": os.getenv("GEMINI_API_KEY", ""),
    "finnhub_api_key": os.getenv("FINNHUB_API_KEY", ""),
}


# ── Models ────────────────────────────────────────────────────────────────────
class APIKeysRequest(BaseModel):
    gemini_api_key: str
    finnhub_api_key: str = ""


class APIKeysStatus(BaseModel):
    gemini_configured: bool
    finnhub_configured: bool


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "ok", "version": "1.0.0"}


@app.get("/api/keys/status", response_model=APIKeysStatus)
async def get_keys_status():
    """Check which API keys are configured."""
    return APIKeysStatus(
        gemini_configured=bool(_session_keys.get("gemini_api_key")),
        finnhub_configured=bool(_session_keys.get("finnhub_api_key")),
    )


@app.post("/api/keys")
async def set_api_keys(keys: APIKeysRequest):
    """Store API keys in memory for the session."""
    if keys.gemini_api_key:
        _session_keys["gemini_api_key"] = keys.gemini_api_key.strip()
    if keys.finnhub_api_key:
        _session_keys["finnhub_api_key"] = keys.finnhub_api_key.strip()
    return {
        "success": True,
        "gemini_configured": bool(_session_keys.get("gemini_api_key")),
        "finnhub_configured": bool(_session_keys.get("finnhub_api_key")),
    }


@app.get("/api/search")
async def search(q: str = Query(..., min_length=1)):
    """Search for tickers by name or symbol."""
    try:
        results = search_tickers(q, _session_keys.get("finnhub_api_key", ""))
        return {"results": results}
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/quote/{ticker}")
async def get_quote(ticker: str):
    """Get a quick real-time quote for a ticker."""
    try:
        data = fetch_company_data(ticker.upper(), _session_keys.get("finnhub_api_key", ""))
        return {
            "ticker": ticker.upper(),
            "name": data["info"].get("longName", ticker.upper()),
            "quote": data["real_time_quote"],
            "price_history": data["price_history"][-30:],  # Last 30 days
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/valuation-quote/{ticker}")
async def get_valuation_quote(ticker: str):
    """
    Lightweight endpoint for the Valuation Calculator page.
    Returns price, market cap, raw shares outstanding, TTM revenue,
    TTM net income (with multiple fallbacks), logo, and real-time quote.
    """
    try:
        ticker = ticker.upper().strip()
        loop = asyncio.get_event_loop()
        data = await loop.run_in_executor(
            None, fetch_company_data, ticker, _session_keys.get("finnhub_api_key", "")
        )

        info = data.get("info", {})
        fin  = data.get("financials", {})
        quote = data.get("real_time_quote", {})

        # ── Raw shares outstanding ─────────────────────────────────────────────
        shares_raw = info.get("sharesOutstanding") or info.get("impliedSharesOutstanding")
        if not shares_raw:
            fh_profile = data.get("finnhub_profile", {})
            so = fh_profile.get("shareOutstanding")
            shares_raw = int(float(so) * 1e6) if so else None

        # ── Revenue TTM — prefer Finnhub (more current 4Q window) ─────────────
        revenue_ttm = fin.get("revenue_ttm_fh") or fin.get("revenue_ttm")
        logger.info(
            f"[{ticker}] revenue_ttm: fh={fin.get('revenue_ttm_fh')} "
            f"yf={fin.get('revenue_ttm')} -> using {revenue_ttm}"
        )

        # ── Net Income — EPS-first for valuation-model consistency ──────────
        net_income = None
        trailing_eps = fin.get("trailing_eps")

        if trailing_eps and shares_raw:
            try:
                net_income = float(trailing_eps) * float(shares_raw)
                logger.info(f"[{ticker}] net_income (EPS×shares, primary): {net_income:,.0f}")
            except Exception:
                net_income = None

        if not net_income:
            # Fallback 1: netIncomeToCommon from yfinance
            net_income = fin.get("net_income")
            if net_income:
                logger.info(f"[{ticker}] net_income (netIncomeToCommon fallback): {net_income:,.0f}")

        if not net_income:
            # Fallback 2: profit margin × revenue
            profit_margin = fin.get("profit_margin_fh") or fin.get("profit_margin")
            if profit_margin and revenue_ttm:
                try:
                    net_income = float(profit_margin) * float(revenue_ttm)
                    logger.info(f"[{ticker}] net_income (margin×rev fallback): {net_income:,.0f}")
                except Exception:
                    pass

        return {
            "ticker": ticker,
            "name": info.get("longName") or info.get("shortName") or ticker,
            "sector": info.get("sector", ""),
            "logo": data.get("finnhub_profile", {}).get("logo", ""),
            "quote": quote,
            "shares_outstanding_raw": shares_raw,
            "financials": {
                "revenue_ttm":          revenue_ttm,
                "net_income":           net_income,
                "market_cap_formatted": fin.get("market_cap_formatted", "N/A"),
                "shares_outstanding":   fin.get("shares_outstanding", "N/A"),
                "current_price":        fin.get("current_price") or quote.get("current"),
                "trailing_eps":         fin.get("trailing_eps"),
                "forward_eps":          fin.get("forward_eps"),
                "revenue_growth":       fin.get("revenue_growth"),
            },
            "error": data.get("error"),
        }
    except Exception as e:
        logger.error(f"Valuation quote error for {ticker}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/report/{ticker}")
async def generate_report(
    ticker: str,
    workflow: str = Query("hedge_fund", description="Analysis workflow: hedge_fund or research_checklist"),
):
    """
    SSE endpoint that streams the full analysis report section by section.

    Query params:
    - workflow: 'hedge_fund' (default) or 'research_checklist'

    Events emitted:
    - 'status': progress updates
    - 'data': fetched financial data (JSON) — includes 'workflow' field
    - 'research_guide': left panel content (JSON)
    - 'section_start': signals a new section is beginning
    - 'section_chunk': streaming text chunk for a section
    - 'section_end': signals a section is complete
    - 'complete': report generation is done
    - 'error': error message
    """
    gemini_key = _session_keys.get("gemini_api_key", "")
    finnhub_key = _session_keys.get("finnhub_api_key", "")

    if not gemini_key:
        async def error_stream():
            yield {
                "event": "error",
                "data": json.dumps({
                    "message": "Gemini API key not configured. Please add your API key in Settings."
                }),
            }
        return EventSourceResponse(error_stream())

    ticker = ticker.upper().strip()
    # Validate workflow — default to hedge_fund if unrecognised
    if workflow not in WORKFLOW_SECTIONS:
        workflow = "hedge_fund"
    sections_order = WORKFLOW_SECTIONS[workflow]
    total_steps = len(sections_order) + 2  # +2 for data fetch + research guide

    async def report_stream():
        try:
            # Step 1: Fetch financial data
            yield {
                "event": "status",
                "data": json.dumps({"message": f"Fetching real-time data for {ticker}...", "step": 1, "total": total_steps}),
            }

            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(
                None, fetch_company_data, ticker, finnhub_key
            )

            if data.get("error") and not data.get("info"):
                yield {
                    "event": "error",
                    "data": json.dumps({"message": f"Could not fetch data for {ticker}. Please check the ticker symbol."}),
                }
                return

            # Step 2: Send financial data to frontend
            info = data.get("info", {})
            fin = data.get("financials", {})
            quote = data.get("real_time_quote", {})

            yield {
                "event": "data",
                "data": json.dumps({
                    "ticker": ticker,
                    "workflow": workflow,
                    "name": info.get("longName", ticker),
                    "sector": info.get("sector", "N/A"),
                    "industry": info.get("industry", "N/A"),
                    "logo": data.get("finnhub_profile", {}).get("logo", ""),
                    "website": info.get("website", ""),
                    "quote": quote,
                    "financials": fin,
                    "price_history": data["price_history"],
                    "peers": data.get("peers", []),
                    "news": data.get("news", []),
                }),
            }

            # Step 3: Generate research guide (left panel)
            yield {
                "event": "status",
                "data": json.dumps({"message": "Generating research framework...", "step": 2, "total": total_steps}),
            }

            research_guide = await loop.run_in_executor(
                None, generate_research_guide, data, gemini_key, workflow
            )
            yield {
                "event": "research_guide",
                "data": json.dumps(research_guide),
            }

            # Step 4: Generate each report section
            for step_idx, (section_key, section_title) in enumerate(sections_order):
                step_num = step_idx + 3

                yield {
                    "event": "status",
                    "data": json.dumps({
                        "message": f"Analyzing {section_title}...",
                        "step": step_num,
                        "total": total_steps
                    }),
                }
                yield {
                    "event": "section_start",
                    "data": json.dumps({"key": section_key, "title": section_title}),
                }

                # Stream the section text
                section_gen = generate_section_stream(section_key, data, gemini_key, workflow)
                for chunk in section_gen:
                    if chunk:
                        yield {
                            "event": "section_chunk",
                            "data": json.dumps({"key": section_key, "text": chunk}),
                        }
                        await asyncio.sleep(0)  # Yield control to event loop

                yield {
                    "event": "section_end",
                    "data": json.dumps({"key": section_key}),
                }

            # Done
            yield {
                "event": "complete",
                "data": json.dumps({"message": "Report generation complete."}),
            }

        except Exception as e:
            logger.error(f"Report stream error: {e}", exc_info=True)
            yield {
                "event": "error",
                "data": json.dumps({"message": f"Report generation failed: {str(e)}"}),
            }

    return EventSourceResponse(report_stream())


if FRONTEND_DIR.exists():
    # Mount static assets at /static so API routes at / are never shadowed.
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")
    logger.info(f"Serving frontend static assets from: {FRONTEND_DIR}")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    """
    Catch-all route: serve the correct HTML file based on the path.
    - /valuation  → valuation.html
    - anything else → index.html (SPA fallback)
    """
    # Strip leading/trailing slashes for comparison
    clean_path = full_path.strip("/")

    if clean_path.startswith("valuation"):
        page_file = FRONTEND_DIR / "valuation.html"
        if page_file.exists():
            return FileResponse(str(page_file))

    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))

    return {"error": "Frontend not found"}


if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 8001))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
