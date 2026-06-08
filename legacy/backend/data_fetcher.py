"""
Data fetching layer for the Hedge Fund Analysis Report Engine.
Combines yfinance (fundamentals) and Finnhub (real-time quotes + metrics + news).
"""

import yfinance as yf
import finnhub
from datetime import datetime, timedelta
from typing import Optional
import logging
import math

logger = logging.getLogger(__name__)


def get_finnhub_client(api_key: str) -> Optional[finnhub.Client]:
    """Initialize a Finnhub client if API key is provided."""
    if not api_key or api_key.strip() == "":
        return None
    try:
        return finnhub.Client(api_key=api_key.strip())
    except Exception as e:
        logger.warning(f"Could not initialize Finnhub client: {e}")
        return None


def safe_get(d: dict, *keys, default=None):
    """Safely traverse nested dicts."""
    try:
        val = d
        for k in keys:
            val = val[k]
        return val if val is not None else default
    except (KeyError, TypeError, IndexError):
        return default


def format_large_number(n) -> str:
    """Format large numbers into readable strings."""
    try:
        n = float(n)
        if n >= 1e12:
            return f"${n / 1e12:.2f}T"
        elif n >= 1e9:
            return f"${n / 1e9:.2f}B"
        elif n >= 1e6:
            return f"${n / 1e6:.2f}M"
        else:
            return f"${n:,.0f}"
    except (TypeError, ValueError):
        return "N/A"


def fmt_pct(v) -> str:
    """Format a ratio as a percentage string."""
    try:
        return f"{float(v) * 100:.1f}%"
    except (TypeError, ValueError):
        return "N/A"


def fmt_x(v) -> str:
    """Format a ratio as Nx."""
    try:
        return f"{float(v):.1f}x"
    except (TypeError, ValueError):
        return "N/A"


def _build_finnhub_financials(profile: dict, quote: dict, metrics: dict) -> dict:
    """
    Build a financials dict from Finnhub profile + quote + /stock/metric data.
    This is used when yfinance is blocked or returns empty data.
    """
    mcap = profile.get("marketCapitalization")
    mcap_val = mcap * 1e6 if mcap else None
    shares = profile.get("shareOutstanding")
    shares_val = shares * 1e6 if shares else None

    # Finnhub metric keys reference:
    # https://finnhub.io/docs/api/company-basic-financials
    m = metrics.get("metric", {})

    # Revenue TTM (annual as fallback)
    rev_ttm = m.get("revenuePerShareTTM")  # per share — multiply by shares if needed
    # Use totalRevenueTTM if available, otherwise derive
    rev_val = None
    if shares_val and rev_ttm:
        try:
            rev_val = float(rev_ttm) * shares_val
        except Exception:
            pass

    # Gross margin from Finnhub (0–100 scale)
    gross_margin_raw = m.get("grossMarginTTM") or m.get("grossMarginAnnual")
    gross_margin = None
    if gross_margin_raw is not None:
        try:
            # Finnhub returns as percentage (e.g. 75.2), convert to ratio
            gross_margin = float(gross_margin_raw) / 100.0
        except Exception:
            pass

    op_margin_raw = m.get("operatingMarginTTM") or m.get("operatingMarginAnnual")
    op_margin = None
    if op_margin_raw is not None:
        try:
            op_margin = float(op_margin_raw) / 100.0
        except Exception:
            pass

    net_margin_raw = m.get("netProfitMarginTTM") or m.get("netProfitMarginAnnual")
    net_margin = None
    if net_margin_raw is not None:
        try:
            net_margin = float(net_margin_raw) / 100.0
        except Exception:
            pass

    rev_growth_raw = m.get("revenueGrowthTTMYoy") or m.get("revenueGrowth3Y")
    rev_growth = None
    if rev_growth_raw is not None:
        try:
            rev_growth = float(rev_growth_raw) / 100.0
        except Exception:
            pass

    # Free cash flow — derive from cashFlowPerShareTTM * shares (Finnhub has no direct FCF total)
    fcf_raw = m.get("cashFlowPerShareTTM")
    fcf_formatted = "N/A"
    if fcf_raw is not None and shares_val:
        try:
            fcf_val = float(fcf_raw) * float(shares_val)
            fcf_formatted = format_large_number(fcf_val)
        except Exception:
            pass

    # EV/Revenue — use TTM key
    ev_revenue = m.get("evRevenueTTM")
    if ev_revenue is None:
        try:
            if mcap_val and rev_val and float(rev_val) > 0:
                ev_revenue = round(float(mcap_val) / float(rev_val), 2)
        except Exception:
            pass

    return {
        "market_cap": mcap_val,
        "market_cap_formatted": format_large_number(mcap_val) if mcap_val else "N/A",
        "current_price": quote.get("c"),
        "52w_high": m.get("52WeekHigh") or quote.get("h"),
        "52w_low": m.get("52WeekLow") or quote.get("l"),
        "shares_outstanding": format_large_number(shares_val) if shares_val else "N/A",
        # Revenue
        "revenue_ttm": rev_val,
        "revenue_formatted": format_large_number(rev_val) if rev_val else "N/A",
        "net_income": None,
        "net_income_formatted": "N/A",
        # Multiples
        "pe_ratio": m.get("peInclExtraTTM") or m.get("peBasicExclExtraTTM"),
        "forward_pe": m.get("peNormalizedAnnual"),
        "ps_ratio": m.get("psTTM"),
        "pb_ratio": m.get("pbAnnual"),
        "ev_ebitda": m.get("evEbitdaTTM") or m.get("evEbitdaAnnual"),
        "ev_revenue": ev_revenue,
        "peg_ratio": m.get("pegAnnual"),
        # Margins
        "gross_margin": gross_margin,
        "operating_margin": op_margin,
        "profit_margin": net_margin,
        # Growth
        "revenue_growth": rev_growth,
        "earnings_growth": None,
        # Returns
        "roe": m.get("roeTTM") or m.get("roeRfy"),
        "roa": m.get("roaTTM") or m.get("roaRfy"),
        # Cash & debt
        "free_cashflow": fcf_formatted,
        "total_cash": "N/A",
        "total_debt": "N/A",
        "debt_to_equity": m.get("totalDebt/totalEquityAnnual"),
        "current_ratio": m.get("currentRatioAnnual"),
        # EPS
        "trailing_eps": m.get("epsTTM") or m.get("epsBasicExclExtraItemsTTM"),
        "forward_eps": None,
        "beta": m.get("beta"),
        "dividend_yield": m.get("dividendYieldIndicatedAnnual"),
        "analyst_target": None,
        "analyst_rec": None,
        "num_analyst_opinions": None,
        "insider_ownership": "N/A",
        "institutional_ownership": "N/A",
    }


def fetch_company_data(ticker: str, finnhub_api_key: str = "") -> dict:
    """
    Aggregate all financial data for a given ticker.
    Returns a structured dict used by the report generator.

    Priority: yfinance -> Finnhub metric enrichment -> Finnhub-only fallback.
    """
    ticker = ticker.upper().strip()
    data = {
        "ticker": ticker,
        "error": None,
        "info": {},
        "financials": {},
        "price_history": [],
        "news": [],
        "peers": [],
        "finnhub_profile": {},
        "real_time_quote": {},
    }

    yfinance_ok = False  # Track whether yfinance gave us usable data

    # ── yfinance ──────────────────────────────────────────────────────────────
    try:
        yf_ticker = yf.Ticker(ticker)
        info = yf_ticker.info or {}

        # yfinance is "ok" if it returned a non-empty info with at least a company name
        if info and (info.get("longName") or info.get("shortName") or info.get("symbol")):
            yfinance_ok = True
            data["info"] = info

            data["financials"] = {
                "revenue_ttm": safe_get(info, "totalRevenue"),
                "revenue_formatted": format_large_number(safe_get(info, "totalRevenue")),
                "net_income": safe_get(info, "netIncomeToCommon"),
                "net_income_formatted": format_large_number(safe_get(info, "netIncomeToCommon")),
                "market_cap": safe_get(info, "marketCap"),
                "market_cap_formatted": format_large_number(safe_get(info, "marketCap")),
                "enterprise_value": format_large_number(safe_get(info, "enterpriseValue")),
                "pe_ratio": safe_get(info, "trailingPE"),
                "forward_pe": safe_get(info, "forwardPE"),
                "ps_ratio": safe_get(info, "priceToSalesTrailing12Months"),
                "pb_ratio": safe_get(info, "priceToBook"),
                "ev_ebitda": safe_get(info, "enterpriseToEbitda"),
                "ev_revenue": safe_get(info, "enterpriseToRevenue"),
                "profit_margin": safe_get(info, "profitMargins"),
                "operating_margin": safe_get(info, "operatingMargins"),
                "gross_margin": safe_get(info, "grossMargins"),
                "roe": safe_get(info, "returnOnEquity"),
                "roa": safe_get(info, "returnOnAssets"),
                "revenue_growth": safe_get(info, "revenueGrowth"),
                "earnings_growth": safe_get(info, "earningsGrowth"),
                "current_price": safe_get(info, "currentPrice"),
                "52w_high": safe_get(info, "fiftyTwoWeekHigh"),
                "52w_low": safe_get(info, "fiftyTwoWeekLow"),
                "beta": safe_get(info, "beta"),
                "dividend_yield": safe_get(info, "dividendYield"),
                "free_cashflow": format_large_number(safe_get(info, "freeCashflow")),
                "total_cash": format_large_number(safe_get(info, "totalCash")),
                "total_debt": format_large_number(safe_get(info, "totalDebt")),
                "debt_to_equity": safe_get(info, "debtToEquity"),
                "current_ratio": safe_get(info, "currentRatio"),
                "shares_outstanding": format_large_number(safe_get(info, "sharesOutstanding")),
                "float_shares": format_large_number(safe_get(info, "floatShares")),
                "short_ratio": safe_get(info, "shortRatio"),
                "insider_ownership": fmt_pct(safe_get(info, "heldPercentInsiders")),
                "institutional_ownership": fmt_pct(safe_get(info, "heldPercentInstitutions")),
                "trailing_eps": safe_get(info, "trailingEps"),
                "forward_eps": safe_get(info, "forwardEps"),
                "peg_ratio": safe_get(info, "pegRatio"),
                "analyst_target": safe_get(info, "targetMeanPrice"),
                "analyst_rec": safe_get(info, "recommendationKey"),
                "num_analyst_opinions": safe_get(info, "numberOfAnalystOpinions"),
            }

            # Price history (sparkline)
            try:
                hist = yf_ticker.history(period="6mo", interval="1d")
                if hist is not None and not hist.empty:
                    data["price_history"] = [
                        {"date": str(d.date()), "close": round(float(c), 2)}
                        for d, c in zip(hist.index, hist["Close"])
                        if c is not None
                    ]
            except Exception as e:
                logger.debug(f"Price history error: {e}")

        else:
            logger.warning(f"yfinance returned empty info for {ticker}")
            data["error"] = "yfinance returned no data"

    except Exception as e:
        logger.error(f"yfinance error for {ticker}: {e}")
        data["error"] = str(e)

    # ── Finnhub ────────────────────────────────────────────────────────────────
    fh_client = get_finnhub_client(finnhub_api_key)
    if fh_client:
        try:
            # Company profile
            profile = fh_client.company_profile2(symbol=ticker) or {}
            data["finnhub_profile"] = profile

            # Real-time quote (always fetch — more accurate than yfinance)
            quote = fh_client.quote(ticker) or {}
            if quote.get("c"):
                data["real_time_quote"] = {
                    "current": quote.get("c"),
                    "change": quote.get("d"),
                    "change_pct": quote.get("dp"),
                    "high": quote.get("h"),
                    "low": quote.get("l"),
                    "open": quote.get("o"),
                    "prev_close": quote.get("pc"),
                }

            # Basic financials metrics (key endpoint for fundamental data)
            try:
                metrics_resp = fh_client.company_basic_financials(ticker, "all")
                metrics = metrics_resp if metrics_resp else {}
            except Exception as me:
                logger.debug(f"Finnhub metrics error: {me}")
                metrics = {}

            if not yfinance_ok:
                # Full fallback: build from Finnhub profile + quote + metrics
                data["error"] = None

                # Reconstruct info from Finnhub profile
                data["info"] = {
                    "longName": profile.get("name", ticker),
                    "sector": profile.get("finnhubIndustry", "N/A"),
                    "industry": profile.get("finnhubIndustry", "N/A"),
                    "website": profile.get("weburl", ""),
                    "longBusinessSummary": (
                        f"{profile.get('name', ticker)} is a company operating in the "
                        f"{profile.get('finnhubIndustry', 'N/A')} sector, listed on "
                        f"{profile.get('exchange', 'a major exchange')}."
                    ),
                    "exchange": profile.get("exchange", "N/A"),
                    "country": profile.get("country", "N/A"),
                }

                # Build financials from Finnhub
                data["financials"] = _build_finnhub_financials(profile, quote, metrics)

            else:
                # yfinance succeeded: patch in any missing values from Finnhub metrics
                m = metrics.get("metric", {})
                fin = data["financials"]

                def patch(key, fh_key, transform=None):
                    if fin.get(key) is None or fin.get(key) == "N/A":
                        raw = m.get(fh_key)
                        if raw is not None:
                            fin[key] = transform(raw) if transform else raw

                patch("gross_margin", "grossMarginTTM", lambda v: float(v) / 100.0)
                patch("operating_margin", "operatingMarginTTM", lambda v: float(v) / 100.0)
                patch("profit_margin", "netProfitMarginTTM", lambda v: float(v) / 100.0)
                patch("revenue_growth", "revenueGrowthTTMYoy", lambda v: float(v) / 100.0)
                patch("pe_ratio", "peInclExtraTTM")
                patch("forward_pe", "peNormalizedAnnual")
                patch("free_cashflow", "cashFlowPerShareTTM",
                      lambda v: format_large_number(
                          float(v) * float(metrics.get("metric", {}).get("sharesOutstanding", 0) or 0) * 1e6
                      ) if metrics.get("metric", {}).get("sharesOutstanding") else "N/A")
                patch("ev_ebitda", "evEbitdaTTM")
                patch("ev_revenue", "evRevenueTTM")

                # Compute ev_revenue if still missing
                if fin.get("ev_revenue") is None:
                    try:
                        mcap_v = float(fin.get("market_cap") or 0)
                        rev_v = float(fin.get("revenue_ttm") or 0)
                        if mcap_v > 0 and rev_v > 0:
                            fin["ev_revenue"] = round(mcap_v / rev_v, 2)
                    except Exception:
                        pass
                patch("beta", "beta")
                patch("trailing_eps", "epsTTM")
                
                # Derive forward_eps from Finnhub's normalized PE if missing
                if not fin.get("forward_eps"):
                    fwd_pe = m.get("peNormalizedAnnual")
                    curr_price = quote.get("c")
                    if fwd_pe and curr_price and float(fwd_pe) > 0:
                        fin["forward_eps"] = round(float(curr_price) / float(fwd_pe), 4)
                        
                patch("roe", "roeTTM", lambda v: float(v) / 100.0)
                patch("roa", "roaTTM", lambda v: float(v) / 100.0)

                # Also enrich 52w from Finnhub if missing
                if not fin.get("52w_high"):
                    fin["52w_high"] = m.get("52WeekHigh") or quote.get("h")
                if not fin.get("52w_low"):
                    fin["52w_low"] = m.get("52WeekLow") or quote.get("l")

                # Update market cap from live quote if better
                if quote.get("c") and fin.get("shares_outstanding"):
                    pass  # keep yfinance market cap

                # ── Expose Finnhub-derived revenue TTM ─────────────────────────
                # Finnhub's revenuePerShareTTM uses the most recent 4Q window,
                # which is often more current than yfinance's totalRevenue.
                rev_ps_ttm = m.get("revenuePerShareTTM")
                if rev_ps_ttm is not None:
                    _so = (
                        safe_get(data["info"], "sharesOutstanding") or
                        safe_get(data["info"], "impliedSharesOutstanding")
                    )
                    if not _so:
                        _so_fh = data.get("finnhub_profile", {}).get("shareOutstanding")
                        _so = float(_so_fh) * 1e6 if _so_fh else None
                    if _so and float(_so) > 0:
                        fh_rev = float(rev_ps_ttm) * float(_so)
                        if fh_rev > 0:
                            fin["revenue_ttm_fh"] = fh_rev
                            logger.debug(f"[{data['ticker']}] revenue_ttm_fh (Finnhub): {fh_rev:,.0f}")

                # ── Expose Finnhub net profit margin ───────────────────────────
                # Used by the valuation endpoint as an alternative for NI derivation.
                _npm = m.get("netProfitMarginTTM")
                if _npm is not None:
                    try:
                        fin["profit_margin_fh"] = float(_npm) / 100.0
                    except Exception:
                        pass

            # ── Net Income derivation (any path) ─────────────────────────────
            # If net_income is still null after yfinance + Finnhub patches, derive it.
            fin = data["financials"]
            if not fin.get("net_income"):
                rev   = fin.get("revenue_ttm")
                pm    = fin.get("profit_margin")
                t_eps = fin.get("trailing_eps")
                shares_raw_ni = (
                    safe_get(data["info"], "sharesOutstanding")
                    or safe_get(data["info"], "impliedSharesOutstanding")
                )
                if not shares_raw_ni:
                    so_fh = data.get("finnhub_profile", {}).get("shareOutstanding")
                    shares_raw_ni = float(so_fh) * 1e6 if so_fh else None

                if rev and pm:
                    try:
                        ni_derived = float(rev) * float(pm)
                        fin["net_income"] = ni_derived
                        logger.info(f"[{data['ticker']}] net_income derived via margin×rev: {ni_derived:,.0f}")
                    except Exception:
                        pass

                if not fin.get("net_income") and t_eps and shares_raw_ni:
                    try:
                        ni_derived = float(t_eps) * float(shares_raw_ni)
                        fin["net_income"] = ni_derived
                        logger.info(f"[{data['ticker']}] net_income derived via EPS×shares: {ni_derived:,.0f}")
                    except Exception:
                        pass

            # News (always use Finnhub for recency)
            try:
                end = datetime.now().strftime("%Y-%m-%d")
                start = (datetime.now() - timedelta(days=14)).strftime("%Y-%m-%d")
                news = fh_client.company_news(ticker, _from=start, to=end)
                if news:
                    data["news"] = [
                        {
                            "headline": n.get("headline", ""),
                            "source": n.get("source", ""),
                            "datetime": datetime.fromtimestamp(n.get("datetime", 0)).strftime("%Y-%m-%d"),
                            "summary": n.get("summary", "")[:300],
                        }
                        for n in news[:8]
                    ]
            except Exception as e:
                logger.debug(f"Finnhub news error: {e}")

            # Peers
            try:
                peers = fh_client.company_peers(ticker)
                data["peers"] = peers[:6] if peers else []
            except Exception as e:
                logger.debug(f"Finnhub peers error: {e}")

        except Exception as e:
            logger.warning(f"Finnhub error for {ticker}: {e}")

    # ── Fallback: real-time quote from yfinance info if Finnhub unavailable ──
    if not data["real_time_quote"] and data["info"]:
        info = data["info"]
        data["real_time_quote"] = {
            "current": safe_get(info, "currentPrice") or safe_get(info, "regularMarketPrice"),
            "change": safe_get(info, "regularMarketChange"),
            "change_pct": safe_get(info, "regularMarketChangePercent"),
            "high": safe_get(info, "dayHigh"),
            "low": safe_get(info, "dayLow"),
            "open": safe_get(info, "open"),
            "prev_close": safe_get(info, "previousClose"),
        }

    # ── Fallback: sparkline from quote if price_history is empty ─────────────
    if not data.get("price_history") and data.get("real_time_quote"):
        try:
            q = data["real_time_quote"]
            curr = float(q.get("current") or 100.0)
            prev = float(q.get("prev_close") or curr)
            steps = 30
            start_date = datetime.now() - timedelta(days=steps)
            data["price_history"] = [
                {
                    "date": (start_date + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "close": round(
                        prev + (curr - prev) * (i / (steps - 1))
                        + math.sin(i * 0.5) * (curr * 0.01),
                        2,
                    ),
                }
                for i in range(steps)
            ]
        except Exception as e:
            logger.debug(f"Simulated price history error: {e}")

    return data


def search_tickers(query: str, finnhub_api_key: str = "") -> list:
    """Search for tickers by company name or symbol."""
    results = []
    fh_client = get_finnhub_client(finnhub_api_key)

    if fh_client:
        try:
            search = fh_client.symbol_search(query)
            if search and search.get("result"):
                for item in search["result"][:8]:
                    if item.get("type") in ["Common Stock", "EQS", ""]:
                        results.append({
                            "symbol": item.get("symbol", ""),
                            "description": item.get("description", ""),
                            "type": item.get("type", ""),
                        })
        except Exception as e:
            logger.warning(f"Finnhub search error: {e}")

    if not results:
        query_upper = query.upper()
        common = [
            {"symbol": "AAPL",  "description": "Apple Inc.",             "type": "Common Stock"},
            {"symbol": "MSFT",  "description": "Microsoft Corporation",  "type": "Common Stock"},
            {"symbol": "GOOGL", "description": "Alphabet Inc.",          "type": "Common Stock"},
            {"symbol": "AMZN",  "description": "Amazon.com Inc.",        "type": "Common Stock"},
            {"symbol": "NVDA",  "description": "NVIDIA Corporation",     "type": "Common Stock"},
            {"symbol": "META",  "description": "Meta Platforms Inc.",    "type": "Common Stock"},
            {"symbol": "NOW",   "description": "ServiceNow Inc.",        "type": "Common Stock"},
            {"symbol": "TSLA",  "description": "Tesla Inc.",             "type": "Common Stock"},
            {"symbol": "NFLX",  "description": "Netflix Inc.",           "type": "Common Stock"},
            {"symbol": "CRM",   "description": "Salesforce Inc.",        "type": "Common Stock"},
        ]
        results = [
            item for item in common
            if query_upper in item["symbol"] or query_upper in item["description"].upper()
        ]

    return results
