import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { fetchCompanyData } from "@/lib/data-fetcher";
import {
  computeTechnicals,
  computeSupportResistance,
  computeProjection,
  parseFinancialsReported,
  aiForecast,
  type PricePoint,
  type Technicals,
  type SupportResistance,
} from "@/lib/intel";

// Real-time, never cached — same contract as /api/quote.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const FETCH_TIMEOUT_MS = 8000;

async function fh(endpoint: string, apiKey: string) {
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
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

const fmtPct = (v: number | null | undefined, d = 1) =>
  v == null || isNaN(Number(v)) ? "n/a" : `${(Number(v) * 100).toFixed(d)}%`;

// ── Deterministic narration (used when no AI key, or AI fails) ────────
function technicalSignal(t: Technicals): "bullish" | "bearish" | "neutral" {
  let score = 0;
  if (t.rsi != null) score += t.rsi > 55 ? 1 : t.rsi < 45 ? -1 : 0;
  if (t.macdHist != null) score += t.macdHist > 0 ? 1 : -1;
  if (t.trend === "bullish") score += 1;
  else if (t.trend === "bearish") score -= 1;
  return score >= 1 ? "bullish" : score <= -1 ? "bearish" : "neutral";
}

function fallbackTechnical(t: Technicals) {
  const bullets: string[] = [];
  if (t.rsi != null) {
    const tag = t.rsi > 70 ? "overbought" : t.rsi < 30 ? "oversold" : "neutral";
    bullets.push(`RSI ${t.rsi.toFixed(1)} (${tag}) — ${t.rsi > 50 ? "buyers in control" : "sellers in control"} on the daily.`);
  }
  if (t.sma20 != null && t.sma50 != null && t.price != null) {
    bullets.push(`Price $${t.price.toFixed(2)} vs SMA20 $${t.sma20.toFixed(2)} / SMA50 $${t.sma50.toFixed(2)} — ${t.price > t.sma20 ? "trading above" : "below"} the short-term average.`);
  }
  if (t.macdHist != null) {
    bullets.push(`MACD histogram ${t.macdHist >= 0 ? "+" : ""}${t.macdHist.toFixed(3)} ${t.macdHist >= 0 ? "confirms" : "weighs against"} upside momentum.`);
  }
  if (t.volatilityPct != null) {
    bullets.push(`Annualized volatility ~${t.volatilityPct.toFixed(0)}% — size positions accordingly.`);
  }
  const signal = technicalSignal(t);
  const summary =
    signal === "bullish"
      ? `Daily signals lean constructive: ${t.rsi != null ? `RSI at ${t.rsi.toFixed(0)}` : "momentum"} with the trend above its moving averages. Continuation is favored while support holds.`
      : signal === "bearish"
      ? `Daily signals lean defensive: momentum is fading and price sits below its moving averages. Rallies may be sold until the trend repairs.`
      : `Daily signals are mixed — momentum and trend disagree, so the tape is range-bound. Wait for a decisive break of the moving averages.`;
  return { signal, summary, bullets, confidence: signal === "neutral" ? 0.5 : 0.68 };
}

function fallbackFundamental(f: any) {
  const bullets: string[] = [];
  if (f.pe_ratio != null) bullets.push(`P/E ${Number(f.pe_ratio).toFixed(1)}${f.forward_pe ? ` (fwd ${Number(f.forward_pe).toFixed(1)})` : ""} — ${Number(f.pe_ratio) > 30 ? "a premium multiple" : "a moderate multiple"}.`);
  if (f.revenue_growth != null) bullets.push(`Revenue growth ${fmtPct(f.revenue_growth)} YoY.`);
  if (f.profit_margin != null) bullets.push(`Net margin ${fmtPct(f.profit_margin)}.`);
  if (f.roe != null) bullets.push(`Return on equity ${fmtPct(f.roe)}.`);
  if (f.debt_to_equity != null) bullets.push(`Debt/equity ${Number(f.debt_to_equity).toFixed(2)}.`);
  const summary = `Fundamentals show ${f.revenue_growth != null && Number(f.revenue_growth) > 0.1 ? "healthy top-line growth" : "modest growth"}${f.profit_margin != null ? ` at a ${fmtPct(f.profit_margin)} net margin` : ""}. ${f.pe_ratio != null && Number(f.pe_ratio) > 35 ? "The valuation prices in continued execution." : "The multiple looks digestible relative to the growth profile."}`;
  return { summary, bullets, confidence: 0.6 };
}

async function aiNarrate(
  geminiKey: string,
  ctx: { ticker: string; name: string; tech: Technicals; sr: SupportResistance; financials: any; consensusPct: number; ownership: any }
) {
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction:
      "You are a buy-side equity analyst writing terse, signal-dense desk notes. You are given PRECOMPUTED indicators — never invent numbers; only interpret the ones provided. Output strict JSON. Every read is for education only, not financial advice.",
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });

  const t = ctx.tech;
  const f = ctx.financials || {};
  const prompt = `Company ${ctx.name} (${ctx.ticker}).
TECHNICALS: price=${t.price}, RSI=${t.rsi?.toFixed(1)}, SMA20=${t.sma20?.toFixed(2)}, SMA50=${t.sma50?.toFixed(2)}, MACD_hist=${t.macdHist?.toFixed(3)}, 5d_momentum=${fmtPct(t.momentum5)}, volatility=${t.volatilityPct?.toFixed(0)}%, trend=${t.trend}.
SUPPORT=${ctx.sr.supports.map((s) => "$" + s.price.toFixed(2)).join(", ") || "none"}; RESISTANCE=${ctx.sr.resistances.map((s) => "$" + s.price.toFixed(2)).join(", ") || "none"}.
FUNDAMENTALS: PE=${f.pe_ratio}, fwdPE=${f.forward_pe}, revGrowth=${fmtPct(f.revenue_growth)}, netMargin=${fmtPct(f.profit_margin)}, ROE=${fmtPct(f.roe)}, D/E=${f.debt_to_equity}, mktCap=${f.market_cap_formatted}.
OWNERSHIP: institutional=${ctx.ownership.institutionalPct ?? "n/a"}, insider=${ctx.ownership.insiderPct ?? "n/a"}, recent insider net=${ctx.ownership.netInsiderShares ?? "n/a"} shares.
QUANT_CONSENSUS forward return = ${fmtPct(ctx.consensusPct)}.

Return JSON exactly:
{
 "technical": {"summary": "2-3 sentences interpreting the technical signals", "bullets": ["3 short signal bullets"], "signal": "bullish|bearish|neutral", "confidence": 0.0-1.0},
 "fundamental": {"summary": "2-3 sentences on valuation & quality", "bullets": ["3 short bullets"], "confidence": 0.0-1.0},
 "supportResistance": {"summary": "2 sentences on where buyers/sellers likely step in"},
 "ownership": {"summary": "2 sentences interpreting institutional/insider positioning"},
 "outlook": {"directionPct": number (your directional read as a decimal return, e.g. 0.03 for +3%), "confidence": 0.0-1.0, "summary": "1 sentence"}
}`;

  const res: any = await withTimeout(model.generateContent(prompt), FETCH_TIMEOUT_MS + 2000);
  const text = res.response.text() || "{}";
  return JSON.parse(text);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const t = ticker.toUpperCase().trim();
    const finnhubKey = request.headers.get("x-finnhub-key") || process.env.FINNHUB_API_KEY || "";
    const geminiKey = request.headers.get("x-gemini-key") || process.env.GEMINI_API_KEY || "";

    const [company, reported, insider] = await Promise.all([
      fetchCompanyData(t, finnhubKey),
      fh(`/stock/financials-reported?symbol=${t}&freq=quarterly`, finnhubKey),
      fh(`/stock/insider-transactions?symbol=${t}`, finnhubKey),
    ]);

    const f = company.financials || {};
    const history: PricePoint[] = (company.price_history || []).filter(
      (p: any) => p && typeof p.close === "number"
    );
    const price = company.real_time_quote?.current ?? f.current_price ?? null;
    const change = company.real_time_quote?.change ?? null;
    const changePct =
      company.real_time_quote?.change_pct != null
        ? company.real_time_quote.change_pct / 100
        : null;

    const tech = computeTechnicals(history);
    if (tech.price == null && price != null) tech.price = price;
    const sr = computeSupportResistance(history);
    if (sr.current == null) sr.current = price;
    const projection = computeProjection(history, tech, { steps: 21, horizonLabel: "1 Month" });

    // ── Ownership / insider transactions (free Finnhub data) ──────────
    const insiderTx = Array.isArray(insider?.data)
      ? insider.data
          .filter((x: any) => x?.share != null && x?.name)
          .sort((a: any, b: any) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
          .slice(0, 8)
          .map((x: any) => {
            const buy = (x.change ?? 0) > 0 || x.transactionCode === "P";
            return {
              name: x.name,
              action: buy ? "Bought" : "Sold",
              shares: Math.abs(x.change ?? x.share ?? 0),
              total: x.share ?? null,
              date: x.transactionDate,
              code: x.transactionCode || (buy ? "P" : "S"),
            };
          })
      : [];
    const netInsiderShares = insiderTx.reduce((a: number, x: any) => a + (x.action === "Bought" ? x.shares : -x.shares), 0);
    const ownership = {
      institutionalPct: f.institutional_ownership ?? null,
      insiderPct: f.insider_ownership ?? null,
      insiderTx,
      netInsiderShares,
    };

    const financials = parseFinancialsReported(reported, 5);

    // ── AI narration (optional) ───────────────────────────────────────
    let aiPowered = false;
    let technical = fallbackTechnical(tech);
    let fundamental = fallbackFundamental(f);
    let srSummary =
      sr.supports.length || sr.resistances.length
        ? `Buyers have historically stepped in near ${sr.supports[0] ? "$" + sr.supports[0].price.toFixed(2) : "support"}, while supply has capped rallies around ${sr.resistances[0] ? "$" + sr.resistances[0].price.toFixed(2) : "resistance"}.`
        : "Not enough price history to map clean support and resistance zones.";
    let ownershipSummary =
      ownership.institutionalPct
        ? `Institutions hold ${ownership.institutionalPct} of shares; insiders ${ownership.insiderPct || "n/a"}. Recent insider activity nets ${netInsiderShares >= 0 ? "buying" : "selling"} ${Math.abs(netInsiderShares).toLocaleString()} shares.`
        : "Ownership detail is limited for this name.";
    let outlook = { directionPct: projection.consensusPct, confidence: 0.5, summary: "Quant consensus only — add a Gemini key for an AI read." };

    if (geminiKey) {
      try {
        const ai = await aiNarrate(geminiKey, {
          ticker: t,
          name: company.info?.longName || t,
          tech,
          sr,
          financials: f,
          consensusPct: projection.consensusPct,
          ownership,
        });
        aiPowered = true;
        if (ai.technical) technical = { ...technical, ...ai.technical };
        if (ai.fundamental) fundamental = { ...fundamental, ...ai.fundamental };
        if (ai.supportResistance?.summary) srSummary = ai.supportResistance.summary;
        if (ai.ownership?.summary) ownershipSummary = ai.ownership.summary;
        if (ai.outlook) {
          outlook = ai.outlook;
          if (typeof ai.outlook.directionPct === "number" && tech.price) {
            projection.models.push(aiForecast(tech.price, ai.outlook.directionPct, projection.steps, ai.outlook.confidence ?? 0.6));
          }
        }
      } catch (e) {
        console.warn(`[intel ${t}] AI narration failed, using deterministic fallback:`, e);
      }
    }

    return NextResponse.json(
      {
        ticker: t,
        name: company.info?.longName || t,
        sector: company.info?.sector || null,
        exchange: company.info?.exchange || null,
        price,
        change,
        changePct,
        marketCap: f.market_cap_formatted || null,
        technical,
        fundamental: {
          ...fundamental,
          metrics: [
            { label: "P/E", value: f.pe_ratio != null ? Number(f.pe_ratio).toFixed(1) : "—" },
            { label: "Fwd P/E", value: f.forward_pe != null ? Number(f.forward_pe).toFixed(1) : "—" },
            { label: "Rev Growth", value: fmtPct(f.revenue_growth) },
            { label: "Net Margin", value: fmtPct(f.profit_margin) },
            { label: "ROE", value: fmtPct(f.roe) },
            { label: "D/E", value: f.debt_to_equity != null ? Number(f.debt_to_equity).toFixed(2) : "—" },
          ],
        },
        technicals: tech,
        projection,
        supportResistance: { ...sr, summary: srSummary },
        ownership: { ...ownership, summary: ownershipSummary },
        financials: { quarters: financials },
        outlook,
        aiPowered,
        dataWarning: company.error,
        generatedAt: Date.now(),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: any) {
    console.error("Intel API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
