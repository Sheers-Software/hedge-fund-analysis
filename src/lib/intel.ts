// ── Intelligence engine ──────────────────────────────────────────────
// Pure, dependency-free analytics that power the AI Intelligence terminal
// (the multi-panel "research desk" view). Everything here is deterministic
// and explainable: technical indicators, support/resistance, and a small
// ensemble of forward price models. The optional AI layer (Gemini) only
// *narrates* these numbers — it never invents them — so the panels stay
// honest in a financial context. For education only, not advice.

export interface PricePoint {
  date: string;
  close: number;
}

// ── Technical indicators ─────────────────────────────────────────────
export interface Technicals {
  price: number | null;
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  momentum5: number | null; // 5-session % change
  volatilityPct: number | null; // annualized daily-return stdev, %
  avgVolatilityRatio: number | null; // here: 5d momentum magnitude vs typical move
  trend: "bullish" | "bearish" | "neutral";
}

const closes = (h: PricePoint[]) => h.map((p) => p.close).filter((c) => typeof c === "number" && !isNaN(c));

function sma(values: number[], n: number): number | null {
  if (values.length < n) return null;
  const slice = values.slice(-n);
  return slice.reduce((a, b) => a + b, 0) / n;
}

function ema(values: number[], n: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (n + 1);
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(values[i] * k + out[i - 1] * (1 - k));
  }
  return out;
}

function rsi(values: number[], period = 14): number | null {
  if (values.length < period + 1) return null;
  let gain = 0;
  let loss = 0;
  // Seed with the first `period` changes.
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  // Wilder smoothing over the remainder.
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    avgGain = (avgGain * (period - 1) + Math.max(0, d)) / period;
    avgLoss = (avgLoss * (period - 1) + Math.max(0, -d)) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function dailyReturns(values: number[]): number[] {
  const r: number[] = [];
  for (let i = 1; i < values.length; i++) {
    if (values[i - 1] > 0) r.push(values[i] / values[i - 1] - 1);
  }
  return r;
}

function stdev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const v = arr.reduce((a, b) => a + (b - mean) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(v);
}

export function computeTechnicals(history: PricePoint[]): Technicals {
  const v = closes(history);
  const empty: Technicals = {
    price: null, rsi: null, sma20: null, sma50: null, macd: null,
    macdSignal: null, macdHist: null, momentum5: null, volatilityPct: null,
    avgVolatilityRatio: null, trend: "neutral",
  };
  if (v.length < 2) return { ...empty, price: v[v.length - 1] ?? null };

  const price = v[v.length - 1];
  const sma20 = sma(v, 20);
  const sma50 = sma(v, 50);
  const ema12 = ema(v, 12);
  const ema26 = ema(v, 26);
  const macdLine = ema12.map((x, i) => x - ema26[i]);
  const signalLine = ema(macdLine, 9);
  const macd = macdLine[macdLine.length - 1] ?? null;
  const macdSignal = signalLine[signalLine.length - 1] ?? null;
  const macdHist = macd != null && macdSignal != null ? macd - macdSignal : null;

  const momentum5 = v.length > 5 ? v[v.length - 1] / v[v.length - 6] - 1 : null;
  const rets = dailyReturns(v.slice(-30));
  const dailyVol = stdev(rets);
  const volatilityPct = dailyVol ? dailyVol * Math.sqrt(252) * 100 : null;
  const avgVolatilityRatio = dailyVol && momentum5 != null ? Math.abs(momentum5) / (dailyVol * Math.sqrt(5)) : null;

  let trend: Technicals["trend"] = "neutral";
  if (sma20 != null && sma50 != null) {
    if (price > sma20 && sma20 > sma50) trend = "bullish";
    else if (price < sma20 && sma20 < sma50) trend = "bearish";
  } else if (momentum5 != null) {
    trend = momentum5 > 0.01 ? "bullish" : momentum5 < -0.01 ? "bearish" : "neutral";
  }

  return { price, rsi: rsi(v), sma20, sma50, macd, macdSignal, macdHist, momentum5, volatilityPct, avgVolatilityRatio, trend };
}

// ── Support & resistance ─────────────────────────────────────────────
export interface Level {
  price: number;
  strengthPct: number; // 0-100, relative cluster strength
  touches: number;
}
export interface SupportResistance {
  current: number | null;
  supports: Level[];
  resistances: Level[];
  confidence: number; // 0-1
}

// Pivot detection: a local extreme that dominates a window on both sides.
function pivots(v: number[], window: number, kind: "low" | "high"): number[] {
  const out: number[] = [];
  for (let i = window; i < v.length - window; i++) {
    const seg = v.slice(i - window, i + window + 1);
    const x = v[i];
    const isPivot = kind === "low" ? x === Math.min(...seg) : x === Math.max(...seg);
    if (isPivot) out.push(x);
  }
  return out;
}

// Cluster pivots that sit within `tol` of each other; strength = #touches.
function cluster(prices: number[], tol: number): Level[] {
  const sorted = [...prices].sort((a, b) => a - b);
  const groups: number[][] = [];
  for (const p of sorted) {
    const last = groups[groups.length - 1];
    if (last && Math.abs(p - last[last.length - 1]) / last[last.length - 1] <= tol) last.push(p);
    else groups.push([p]);
  }
  const maxTouches = Math.max(1, ...groups.map((g) => g.length));
  return groups.map((g) => ({
    price: g.reduce((a, b) => a + b, 0) / g.length,
    touches: g.length,
    strengthPct: Math.round((g.length / maxTouches) * 100),
  }));
}

export function computeSupportResistance(history: PricePoint[]): SupportResistance {
  const all = closes(history);
  const v = all.slice(-130); // ~6 months
  if (v.length < 20) return { current: all[all.length - 1] ?? null, supports: [], resistances: [], confidence: 0 };
  const current = v[v.length - 1];
  const tol = 0.02; // 2% cluster band

  const lows = cluster(pivots(v, 4, "low"), tol).filter((l) => l.price < current * 0.999);
  const highs = cluster(pivots(v, 4, "high"), tol).filter((l) => l.price > current * 1.001);

  // 52w-ish extremes as anchor levels.
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  if (lo < current && !lows.some((l) => Math.abs(l.price - lo) / lo < tol)) lows.push({ price: lo, touches: 1, strengthPct: 60 });
  if (hi > current && !highs.some((l) => Math.abs(l.price - hi) / hi < tol)) highs.push({ price: hi, touches: 1, strengthPct: 60 });

  const supports = lows.sort((a, b) => b.price - a.price || b.touches - a.touches).slice(0, 3);
  const resistances = highs.sort((a, b) => a.price - b.price || b.touches - a.touches).slice(0, 3);

  const touched = supports.concat(resistances).reduce((a, b) => a + b.touches, 0);
  const confidence = Math.min(1, 0.45 + touched * 0.06 + (v.length >= 100 ? 0.15 : 0));

  return { current, supports, resistances, confidence };
}

// ── Multi-model forward projection ───────────────────────────────────
// A small ensemble of *quantitative* models, each named for the regime it
// captures. These are honest forecasting archetypes (momentum, trend,
// mean-reversion, volatility, seasonal) blended into a consensus — NOT
// outputs attributed to AI vendors we never queried.
export interface ModelForecast {
  name: string;
  kind: "quant" | "ai";
  changePct: number; // projected return over the horizon
  confidence: number; // 0-1
  color: string;
  path: number[]; // projected close path, path[0] == current
  blurb: string;
}

export interface Projection {
  horizonLabel: string;
  steps: number;
  history: PricePoint[]; // recent actual closes shown to the left of the fan
  models: ModelForecast[];
  consensusPct: number;
}

const MODEL_COLORS: Record<string, string> = {
  Momentum: "#f43f5e",
  Trend: "#3b82f6",
  "Mean-Reversion": "#a855f7",
  Volatility: "#f59e0b",
  Seasonal: "#22d3ee",
  Consensus: "#10b981",
  "Gemini AI": "#e8edf2",
};

// Ease-out so paths curve early and flatten — reads like a fan of forecasts.
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);

function buildPath(start: number, totalDrift: number, steps: number, wobble: number, seed: number): number[] {
  const path: number[] = [start];
  for (let i = 1; i <= steps; i++) {
    const base = start * (1 + totalDrift * easeOut(i / steps));
    // Deterministic, tiny wave so lines separate visually without faking data.
    const wave = Math.sin((i / steps) * Math.PI * (1.4 + seed * 0.25)) * wobble * start;
    path.push(Math.max(0.01, base + wave));
  }
  return path;
}

export interface ProjectionOptions {
  steps?: number; // forward sessions
  horizonLabel?: string;
}

export function computeProjection(history: PricePoint[], tech: Technicals, opts: ProjectionOptions = {}): Projection {
  const steps = opts.steps ?? 21; // ~1 trading month
  const horizonLabel = opts.horizonLabel ?? "1 Month";
  const v = closes(history);
  const recent = history.slice(-40);
  const price = tech.price ?? v[v.length - 1] ?? 0;

  const rets = dailyReturns(v.slice(-30));
  const avgDaily = rets.length ? rets.reduce((a, b) => a + b, 0) / rets.length : 0;
  const vol = stdev(rets);
  const mom5 = tech.momentum5 ?? 0;
  const sma50 = tech.sma50 ?? price;
  const reversionGap = price > 0 ? (sma50 - price) / price : 0;

  // Per-model expected drift over the horizon (bounded so nothing runs wild).
  const clampDrift = (x: number) => Math.max(-0.35, Math.min(0.35, x));
  const defs: { name: string; drift: number; conf: number; blurb: string }[] = [
    { name: "Momentum", drift: clampDrift(mom5 * (steps / 5) * 0.5), conf: 0.55, blurb: "Extends the recent 5-session drift, decaying over the horizon." },
    { name: "Trend", drift: clampDrift(avgDaily * steps * 0.8), conf: 0.6, blurb: "Projects the 30-session average daily trend forward." },
    { name: "Mean-Reversion", drift: clampDrift(reversionGap * 0.6), conf: 0.5, blurb: "Pulls price back toward its 50-day moving average." },
    { name: "Volatility", drift: clampDrift((tech.trend === "bullish" ? 1 : tech.trend === "bearish" ? -1 : 0) * vol * Math.sqrt(steps) * 0.5), conf: 0.45, blurb: "Drifts within a volatility band, biased by the prevailing trend." },
    { name: "Seasonal", drift: clampDrift(avgDaily * steps * 0.5 + mom5 * 0.2), conf: 0.4, blurb: "Blends average daily return with short-term seasonality." },
  ];

  const models: ModelForecast[] = defs.map((d, i) => ({
    name: d.name,
    kind: "quant",
    changePct: d.drift,
    confidence: d.conf,
    color: MODEL_COLORS[d.name],
    path: buildPath(price, d.drift, steps, vol * 0.35, i),
    blurb: d.blurb,
  }));

  const consensusPct = models.reduce((a, m) => a + m.changePct * m.confidence, 0) / models.reduce((a, m) => a + m.confidence, 0);
  models.push({
    name: "Consensus",
    kind: "quant",
    changePct: consensusPct,
    confidence: Math.min(0.85, 0.5 + Math.abs(consensusPct) * 0.5),
    color: MODEL_COLORS.Consensus,
    path: buildPath(price, consensusPct, steps, vol * 0.12, 9),
    blurb: "Confidence-weighted blend of all quant models.",
  });

  return { horizonLabel, steps, history: recent, models, consensusPct };
}

// Inject the AI's directional read as an extra "model" line (only when the
// AI layer actually ran and returned a number — never fabricated).
export function aiForecast(price: number, changePct: number, steps: number, confidence = 0.6): ModelForecast {
  const c = Math.max(-0.35, Math.min(0.35, changePct));
  return {
    name: "Gemini AI",
    kind: "ai",
    changePct: c,
    confidence,
    color: MODEL_COLORS["Gemini AI"],
    path: buildPath(price, c, steps, 0.004, 6),
    blurb: "Gemini's qualitative directional read, anchored to the computed signals.",
  };
}

// ── Finnhub financials-reported parser ───────────────────────────────
// Tolerant extraction of balance-sheet & income-statement line items from
// Finnhub's reported-financials payload (concept labels vary by filer).
export interface FinancialQuarter {
  period: string; // YYYY-Qn
  year: number;
  quarter: number;
  totalAssets: number | null;
  totalLiabilities: number | null;
  totalEquity: number | null;
  cash: number | null;
  revenue: number | null;
  grossProfit: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
}

function pick(rows: any[], patterns: RegExp[]): number | null {
  if (!Array.isArray(rows)) return null;
  for (const pat of patterns) {
    const hit = rows.find((r) => {
      const label = String(r?.label || r?.concept || "").toLowerCase();
      return pat.test(label) && r?.value != null && !isNaN(Number(r.value));
    });
    if (hit) return Number(hit.value);
  }
  return null;
}

export function parseFinancialsReported(resp: any, count = 4): FinancialQuarter[] {
  const data: any[] = resp?.data || [];
  if (!Array.isArray(data) || data.length === 0) return [];
  // Newest first from Finnhub; sort to oldest→newest then take the last `count`.
  const sorted = [...data].sort((a, b) => {
    const ay = (a.year ?? 0) * 4 + (a.quarter ?? 0);
    const by = (b.year ?? 0) * 4 + (b.quarter ?? 0);
    return ay - by;
  });
  return sorted.slice(-count).map((d) => {
    const bs = d.report?.bs || [];
    const ic = d.report?.ic || [];
    return {
      period: `${d.year}-Q${d.quarter || 0}`,
      year: d.year,
      quarter: d.quarter || 0,
      totalAssets: pick(bs, [/^total assets$/, /total assets/]),
      totalLiabilities: pick(bs, [/^total liabilities$/, /total liabilities(?! and)/, /total liabilities/]),
      totalEquity: pick(bs, [/total stockholders.? equity/, /total shareholders.? equity/, /total equity/]),
      cash: pick(bs, [/cash and cash equivalents/, /^cash$/, /cash and short.term/]),
      revenue: pick(ic, [/total revenue/, /net sales/, /^revenues?$/, /revenue/]),
      grossProfit: pick(ic, [/gross profit/]),
      operatingIncome: pick(ic, [/operating income/, /income from operations/]),
      netIncome: pick(ic, [/net income(?! attributable)/, /net income/]),
    };
  });
}

// ── Formatting helpers (shared by intel components) ──────────────────
export function fmtCompact(n: number | null | undefined): string {
  if (n == null || isNaN(Number(n))) return "—";
  const num = Number(n);
  const a = Math.abs(num);
  const sign = num < 0 ? "-" : "";
  if (a >= 1e12) return `${sign}$${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${sign}$${(a / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${sign}$${(a / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${sign}$${(a / 1e3).toFixed(1)}K`;
  return `${sign}$${a.toFixed(0)}`;
}

export function fmtPctSigned(n: number | null | undefined, digits = 2): string {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n) * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}
