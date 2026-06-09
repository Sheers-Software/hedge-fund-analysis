import YahooFinance from "yahoo-finance2";
import { CompanyData } from "./types";

const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey", "ripHistorical"] } as any);
yahooFinance._setOpts({ fetchOptions: { cache: "no-store" } } as any);

const formatLargeNumber = (n: any) => {
  if (n === null || n === undefined || isNaN(Number(n))) return "N/A";
  const num = Number(n);
  if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  return `$${num.toLocaleString()}`;
};

const fmtPct = (v: any) => {
  if (v === null || v === undefined || isNaN(Number(v))) return "N/A";
  return `${(Number(v) * 100).toFixed(1)}%`;
};

// Yahoo Finance reliably blocks Vercel's data-center IPs, where requests may
// hang rather than fail fast. Cap every external call so a stuck request can't
// exhaust the serverless function's execution budget and the Finnhub fallback
// always gets a chance to run.
const FETCH_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function fetchFinnhub(endpoint: string, apiKey: string) {
  if (!apiKey) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(`https://finnhub.io/api/v1${endpoint}&token=${apiKey}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Finnhub error on ${endpoint}:`, e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Build a financials object from Finnhub data that mirrors the Yahoo Finance
// shape as closely as the API allows. Used as the primary source on Vercel
// (where Yahoo is blocked) and to backfill gaps when Yahoo partially succeeds.
function financialsFromFinnhub(profile: any, quote: any, metrics: any) {
  const m = metrics?.metric || {};
  const shares = profile?.shareOutstanding ? profile.shareOutstanding * 1e6 : null;
  const pct = (v: any) => (v === null || v === undefined || isNaN(Number(v)) ? null : Number(v) / 100);

  const revenue_ttm = m.revenuePerShareTTM && shares ? m.revenuePerShareTTM * shares : null;
  const profit_margin = pct(m.netProfitMarginTTM);
  const eps = m.epsTTM ?? m.epsInclExtraItemsTTM ?? null;
  const net_income =
    revenue_ttm != null && profit_margin != null
      ? revenue_ttm * profit_margin
      : eps != null && shares != null
        ? eps * shares
        : null;
  const market_cap = profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null;

  return {
    revenue_ttm,
    revenue_formatted: formatLargeNumber(revenue_ttm),
    net_income,
    net_income_formatted: formatLargeNumber(net_income),
    market_cap,
    market_cap_formatted: formatLargeNumber(market_cap),
    pe_ratio: m.peTTM ?? m.peInclExtraTTM ?? m.peBasicExclExtraTTM ?? null,
    forward_pe: m.peNormalizedAnnual ?? null,
    ps_ratio: m.psTTM ?? null,
    pb_ratio: m.pbAnnual ?? m.pbQuarterly ?? null,
    profit_margin,
    operating_margin: pct(m.operatingMarginTTM),
    gross_margin: pct(m.grossMarginTTM),
    roe: pct(m.roeTTM),
    roa: pct(m.roaTTM),
    revenue_growth: pct(m.revenueGrowthTTMYoy),
    earnings_growth: pct(m.epsGrowthTTMYoy),
    current_price: quote?.c ?? null,
    "52w_high": m["52WeekHigh"] ?? quote?.h ?? null,
    "52w_low": m["52WeekLow"] ?? quote?.l ?? null,
    beta: m.beta ?? null,
    dividend_yield: pct(m.dividendYieldIndicatedAnnual),
    free_cashflow: formatLargeNumber(
      m.freeCashFlowPerShareTTM && shares ? m.freeCashFlowPerShareTTM * shares : null
    ),
    debt_to_equity: m["totalDebt/totalEquityQuarterly"] ?? m["totalDebt/totalEquityAnnual"] ?? null,
    current_ratio: m.currentRatioQuarterly ?? m.currentRatioAnnual ?? null,
    shares_outstanding: formatLargeNumber(shares),
    trailing_eps: eps,
    forward_eps: m.epsNormalizedAnnual ?? null,
  } as Record<string, any>;
}

export async function fetchCompanyData(ticker: string, finnhubApiKey: string = ""): Promise<CompanyData> {
  const t = ticker.toUpperCase().trim();
  const data: CompanyData = {
    ticker: t,
    error: null,
    info: {},
    financials: {},
    price_history: [],
    news: [],
    peers: [],
    finnhub_profile: {},
    real_time_quote: {},
  };

  let yfinanceOk = false;

  try {
    let quoteSummary: any = null;
    let quote: any = null;
    try {
      quoteSummary = await withTimeout(
        (yahooFinance as any).quoteSummary(t, {
          modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "summaryProfile", "earningsTrend"],
        }),
        FETCH_TIMEOUT_MS,
        "yahoo.quoteSummary"
      );
    } catch (e) {}
    try {
      quote = await withTimeout(yahooFinance.quote(t), FETCH_TIMEOUT_MS, "yahoo.quote");
    } catch (e) {}

    if (quoteSummary || quote) {
      yfinanceOk = true;
      const sd = quoteSummary?.summaryDetail || {};
      const fd = quoteSummary?.financialData || {};
      const ks = quoteSummary?.defaultKeyStatistics || {};
      const p = quoteSummary?.price || quote || {};
      const sp = quoteSummary?.summaryProfile || {};

      // Forward analyst consensus: current FY ("0y") and next FY ("+1y").
      // Used for the valuation Year-1 seed and the Mandatory Metrics panel.
      const trend: any[] = quoteSummary?.earningsTrend?.trend || [];
      const fy = trend.find((x: any) => x.period === "0y") || {};
      const nextFy = trend.find((x: any) => x.period === "+1y") || {};
      const px = p.regularMarketPrice;
      const epsCurFy = fy.earningsEstimate?.avg ?? null;
      const epsNextFy = nextFy.earningsEstimate?.avg ?? null;
      const revCurFy = fy.revenueEstimate?.avg ?? null;

      data.info = {
        longName: p.longName || p.shortName || t,
        sector: sp.sector,
        industry: sp.industry,
        website: sp.website,
        longBusinessSummary: sp.longBusinessSummary,
        exchange: p.exchangeName,
        country: sp.country,
      };

      data.financials = {
        revenue_ttm: fd.totalRevenue,
        revenue_formatted: formatLargeNumber(fd.totalRevenue),
        net_income: fd.netIncomeToCommon ?? (fd.totalRevenue && fd.profitMargins ? fd.totalRevenue * fd.profitMargins : null),
        net_income_formatted: formatLargeNumber(fd.netIncomeToCommon ?? (fd.totalRevenue && fd.profitMargins ? fd.totalRevenue * fd.profitMargins : null)),
        market_cap: p.marketCap,
        market_cap_formatted: formatLargeNumber(p.marketCap),
        enterprise_value: ks.enterpriseValue,
        pe_ratio: sd.trailingPE,
        forward_pe: sd.forwardPE,
        ps_ratio: sd.priceToSalesTrailing12Months,
        pb_ratio: ks.priceToBook,
        ev_ebitda: ks.enterpriseToEbitda,
        ev_revenue: ks.enterpriseToRevenue,
        profit_margin: fd.profitMargins,
        operating_margin: fd.operatingMargins,
        gross_margin: fd.grossMargins,
        roe: fd.returnOnEquity,
        roa: fd.returnOnAssets,
        revenue_growth: fd.revenueGrowth,
        earnings_growth: fd.earningsGrowth,
        current_price: p.regularMarketPrice,
        "52w_high": sd.fiftyTwoWeekHigh,
        "52w_low": sd.fiftyTwoWeekLow,
        beta: sd.beta,
        dividend_yield: sd.dividendYield,
        free_cashflow: formatLargeNumber(fd.freeCashflow),
        total_cash: formatLargeNumber(fd.totalCash),
        total_debt: formatLargeNumber(fd.totalDebt),
        debt_to_equity: fd.debtToEquity,
        current_ratio: fd.currentRatio,
        shares_outstanding: formatLargeNumber(ks.sharesOutstanding),
        float_shares: formatLargeNumber(ks.floatShares),
        short_ratio: ks.shortRatio,
        insider_ownership: fmtPct(ks.heldPercentInsiders),
        institutional_ownership: fmtPct(ks.heldPercentInstitutions),
        trailing_eps: sd.trailingEps,
        forward_eps: sd.forwardEps,
        peg_ratio: ks.pegRatio,
        analyst_target: fd.targetMeanPrice,
        analyst_rec: fd.recommendationKey,
        num_analyst_opinions: fd.numberOfAnalystOpinions,
        // Forward full-FY consensus estimates (used to seed the valuation model)
        revenue_fwd: revCurFy,
        eps_fwd: epsCurFy,
        fwd_fy_end: fy.endDate ?? null,
        // Mandatory Metrics panel — forward PE ladder (price / forward EPS),
        // forward growth rates, and forward P/S.
        eps_fwd_2y: epsNextFy,
        pe_fwd: px && epsCurFy ? px / epsCurFy : null,
        pe_2y_fwd: px && epsNextFy ? px / epsNextFy : null,
        forward_ps: p.marketCap && revCurFy ? p.marketCap / revCurFy : null,
        eps_growth_cur_fy: fy.earningsEstimate?.growth ?? null,
        eps_growth_next_fy: nextFy.earningsEstimate?.growth ?? null,
        rev_growth_cur_fy: fy.revenueEstimate?.growth ?? null,
        rev_growth_next_fy: nextFy.revenueEstimate?.growth ?? null,
      };

      try {
        const histResult = await withTimeout(
          yahooFinance.historical(t, {
            period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
            period2: new Date(),
            interval: "1d",
          }),
          FETCH_TIMEOUT_MS,
          "yahoo.historical"
        );
        const hist: any[] = histResult as any[];
        if (hist && hist.length > 0) {
          data.price_history = hist.map((h: any) => ({
            date: h.date.toISOString().split("T")[0],
            close: Math.round((h.close || 0) * 100) / 100,
          }));
        }
      } catch (e) {
        console.warn("Historical price error:", e);
      }
    }
  } catch (e) {
    console.error(`yfinance error for ${t}:`, e);
    data.error = String(e);
  }

  // FINNHUB ENRICHMENT
  if (finnhubApiKey) {
    try {
      const [profile, quote, metrics, news, peers] = await Promise.all([
        fetchFinnhub(`/stock/profile2?symbol=${t}`, finnhubApiKey),
        fetchFinnhub(`/quote?symbol=${t}`, finnhubApiKey),
        fetchFinnhub(`/stock/metric?symbol=${t}&metric=all`, finnhubApiKey),
        fetchFinnhub(
          `/company-news?symbol=${t}&from=${new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}&to=${new Date().toISOString().split("T")[0]}`,
          finnhubApiKey
        ),
        fetchFinnhub(`/stock/peers?symbol=${t}`, finnhubApiKey),
      ]);

      if (profile) data.finnhub_profile = profile;
      if (quote && quote.c) {
        data.real_time_quote = {
          current: quote.c,
          change: quote.d,
          change_pct: quote.dp,
          high: quote.h,
          low: quote.l,
          open: quote.o,
          prev_close: quote.pc,
        };
      }

      if (!yfinanceOk && (profile || quote)) {
        // Yahoo unavailable (e.g. blocked on Vercel) — rebuild the full
        // financials picture from Finnhub so parity with localhost holds.
        data.error = null;
        data.info = {
          longName: profile?.name || t,
          sector: profile?.finnhubIndustry || "N/A",
          industry: profile?.finnhubIndustry || "N/A",
          website: profile?.weburl || "",
          longBusinessSummary: `${profile?.name || t} is a company operating in the ${profile?.finnhubIndustry || "N/A"} sector.`,
          exchange: profile?.exchange || "N/A",
          country: profile?.country || "N/A",
        };
        data.financials = financialsFromFinnhub(profile, quote, metrics);
      } else if (yfinanceOk && (metrics?.metric || profile)) {
        // Yahoo succeeded but may have gaps — backfill only missing fields.
        const fin = data.financials;
        const fallback = financialsFromFinnhub(profile, quote, metrics);
        for (const [key, val] of Object.entries(fallback)) {
          const missing =
            fin[key] === undefined ||
            fin[key] === null ||
            fin[key] === "N/A" ||
            (typeof fin[key] === "number" && isNaN(fin[key]));
          if (missing && val !== null && val !== "N/A") fin[key] = val;
        }

        // Yahoo's financialData.totalRevenue is unreliable for some tickers — it
        // can return a single stale quarter (e.g. ELF showed ~$268M vs a true
        // ~$1.6B TTM), and its other ratios are internally consistent with that
        // bad figure, so it can't be self-checked. Cross-check against Finnhub's
        // TTM revenue (revenue/share x shares) and prefer Finnhub when they
        // diverge materially, recomputing the dependent fields for consistency.
        const m = metrics?.metric || {};
        const shares = profile?.shareOutstanding ? profile.shareOutstanding * 1e6 : null;
        const finnhubRevenue = m.revenuePerShareTTM && shares ? m.revenuePerShareTTM * shares : null;
        if (finnhubRevenue && fin.revenue_ttm) {
          const divergence =
            Math.abs(finnhubRevenue - fin.revenue_ttm) / Math.max(finnhubRevenue, fin.revenue_ttm);
          if (divergence > 0.2) {
            console.warn(
              `[${t}] Yahoo revenue (${fin.revenue_ttm}) diverges ${(divergence * 100).toFixed(0)}% from Finnhub (${finnhubRevenue}); using Finnhub.`
            );
            fin.revenue_ttm = finnhubRevenue;
            fin.revenue_formatted = formatLargeNumber(finnhubRevenue);

            const margin =
              m.netProfitMarginTTM != null ? m.netProfitMarginTTM / 100 : fin.profit_margin;
            const eps = m.epsTTM ?? m.epsInclExtraItemsTTM ?? null;
            const netIncome =
              margin != null
                ? finnhubRevenue * margin
                : eps != null && shares
                  ? eps * shares
                  : null;
            if (netIncome != null) {
              fin.net_income = netIncome;
              fin.net_income_formatted = formatLargeNumber(netIncome);
            }
            if (margin != null) fin.profit_margin = margin;
            if (fin.market_cap) fin.ps_ratio = fin.market_cap / finnhubRevenue;
          }
        }
      }

      if (news && Array.isArray(news)) {
        data.news = news.slice(0, 8).map((n: any) => ({
          headline: n.headline || "",
          source: n.source || "",
          datetime: new Date(n.datetime * 1000).toISOString().split("T")[0],
          summary: (n.summary || "").substring(0, 300),
        }));
      }

      if (peers && Array.isArray(peers)) {
        data.peers = peers.slice(0, 6);
      }

    } catch (e) {
      console.error(`Finnhub aggregation error for ${t}:`, e);
    }
  }

  // Fallback quote if finnhub is not present
  if (!data.real_time_quote?.current && data.info) {
    const p = data.financials;
    data.real_time_quote = {
      current: p.current_price,
      high: p["52w_high"],
      low: p["52w_low"],
    };
  }

  return data;
}


