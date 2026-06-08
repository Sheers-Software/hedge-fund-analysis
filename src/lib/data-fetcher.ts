import yahooFinance from "yahoo-finance2";
import { CompanyData } from "./types";

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

async function fetchFinnhub(endpoint: string, apiKey: string) {
  if (!apiKey) return null;
  try {
    const res = await fetch(`https://finnhub.io/api/v1${endpoint}&token=${apiKey}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.error(`Finnhub error on ${endpoint}:`, e);
    return null;
  }
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
      quoteSummary = await (yahooFinance as any).quoteSummary(t, {
        modules: ["price", "summaryDetail", "defaultKeyStatistics", "financialData", "summaryProfile"],
      });
    } catch (e) {}
    try {
      quote = await yahooFinance.quote(t);
    } catch (e) {}

    if (quoteSummary || quote) {
      yfinanceOk = true;
      const sd = quoteSummary?.summaryDetail || {};
      const fd = quoteSummary?.financialData || {};
      const ks = quoteSummary?.defaultKeyStatistics || {};
      const p = quoteSummary?.price || quote || {};
      const sp = quoteSummary?.summaryProfile || {};

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
        net_income: fd.netIncomeToCommon,
        net_income_formatted: formatLargeNumber(fd.netIncomeToCommon),
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
      };

      try {
        const histResult = await yahooFinance.historical(t, {
          period1: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 6 months ago
          interval: "1d",
        });
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

      if (!yfinanceOk && profile && quote) {
        data.error = null;
        data.info = {
          longName: profile.name || t,
          sector: profile.finnhubIndustry || "N/A",
          industry: profile.finnhubIndustry || "N/A",
          website: profile.weburl || "",
          longBusinessSummary: `${profile.name || t} is a company operating in the ${profile.finnhubIndustry || "N/A"} sector.`,
          exchange: profile.exchange || "N/A",
          country: profile.country || "N/A",
        };
        const m = metrics?.metric || {};
        data.financials = {
          market_cap: profile.marketCapitalization ? profile.marketCapitalization * 1e6 : null,
          market_cap_formatted: profile.marketCapitalization ? formatLargeNumber(profile.marketCapitalization * 1e6) : "N/A",
          current_price: quote.c,
          "52w_high": m["52WeekHigh"] || quote.h,
          "52w_low": m["52WeekLow"] || quote.l,
          shares_outstanding: profile.shareOutstanding ? formatLargeNumber(profile.shareOutstanding * 1e6) : "N/A",
          pe_ratio: m.peInclExtraTTM || m.peBasicExclExtraTTM,
          forward_pe: m.peNormalizedAnnual,
          gross_margin: m.grossMarginTTM ? m.grossMarginTTM / 100 : null,
          operating_margin: m.operatingMarginTTM ? m.operatingMarginTTM / 100 : null,
          profit_margin: m.netProfitMarginTTM ? m.netProfitMarginTTM / 100 : null,
        };
      } else if (yfinanceOk && metrics?.metric) {
        // Enrich
        const m = metrics.metric;
        const fin = data.financials;
        if (!fin.pe_ratio) fin.pe_ratio = m.peInclExtraTTM;
        if (!fin.forward_pe) fin.forward_pe = m.peNormalizedAnnual;
        if (!fin.gross_margin && m.grossMarginTTM) fin.gross_margin = m.grossMarginTTM / 100;
        if (!fin.operating_margin && m.operatingMarginTTM) fin.operating_margin = m.operatingMarginTTM / 100;
        if (!fin.profit_margin && m.netProfitMarginTTM) fin.profit_margin = m.netProfitMarginTTM / 100;
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


