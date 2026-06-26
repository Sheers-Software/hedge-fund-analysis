import { NextResponse } from "next/server";

// Real-time, never cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUARTERS_BACK = 20; // ~5 years of history (matches the reference timeline)
const FETCH_TIMEOUT_MS = 8000;

async function fh(endpoint: string, apiKey: string) {
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

// ─────────────────────────────────────────────────────────────────────────────
// As-reported financials → discrete quarterly series.
//
// Finnhub's `financials-reported` mirrors the company's filings, which means
// income-statement and cash-flow figures are CUMULATIVE year-to-date: Q2 is the
// 6-month total, Q3 the 9-month total, and Q4 is only present in the ANNUAL
// filing (the 12-month total). To chart true single-quarter numbers we must
// de-cumulate within each fiscal year:
//   Q1 = cum(3mo)
//   Q2 = cum(6mo) − cum(3mo)
//   Q3 = cum(9mo) − cum(6mo)
//   Q4 = annual(12mo) − cum(9mo)
// Balance-sheet items (equity) are point-in-time snapshots and are used as-is.
// ─────────────────────────────────────────────────────────────────────────────

type Section = "ic" | "bs" | "cf";

// Candidate XBRL concept leaf-names, in priority order, per metric. Different
// filers use different us-gaap tags, so we try several and take the first hit.
const CONCEPTS: Record<string, { section: Section; names: string[] }> = {
  revenue: {
    section: "ic",
    names: [
      "RevenueFromContractWithCustomerExcludingAssessedTax",
      "Revenues",
      "RevenueFromContractWithCustomerIncludingAssessedTax",
      "SalesRevenueNet",
      "RevenuesNetOfInterestExpense",
    ],
  },
  costOfRevenue: {
    section: "ic",
    names: ["CostOfRevenue", "CostOfGoodsAndServicesSold", "CostOfGoodsSold"],
  },
  operatingIncome: { section: "ic", names: ["OperatingIncomeLoss"] },
  netIncome: {
    section: "ic",
    names: ["NetIncomeLoss", "ProfitLoss", "NetIncomeLossAvailableToCommonStockholdersBasic"],
  },
  shares: {
    section: "ic",
    names: [
      "WeightedAverageNumberOfDilutedSharesOutstanding",
      "WeightedAverageNumberOfSharesOutstandingBasicAndDiluted",
      "WeightedAverageNumberOfSharesOutstandingBasic",
    ],
  },
  ocf: {
    section: "cf",
    names: [
      "NetCashProvidedByUsedInOperatingActivities",
      "NetCashProvidedByUsedInOperatingActivitiesContinuingOperations",
    ],
  },
  capex: {
    section: "cf",
    names: [
      "PaymentsToAcquirePropertyPlantAndEquipment",
      "PaymentsToAcquireProductiveAssets",
      "PaymentsForCapitalImprovements",
    ],
  },
  equity: {
    section: "bs",
    names: [
      "StockholdersEquity",
      "StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest",
    ],
  },
};

function pickConcept(report: any, section: Section, names: string[]): number | null {
  const items: any[] = report?.[section] || [];
  for (const name of names) {
    const hit = items.find((it) => {
      const c: string = it?.concept || "";
      const leaf = c.split("_").pop() || c;
      return leaf === name;
    });
    if (hit && hit.value != null && !isNaN(Number(hit.value))) return Number(hit.value);
  }
  return null;
}

interface RawReport {
  fy: number; // fiscal year
  quarter: number; // 1-4, or 0 for the annual report
  months: number; // length of the reporting window (3/6/9/12)
  endDate: string;
  vals: Record<string, number | null>;
}

function parseReports(payload: any): RawReport[] {
  const out: RawReport[] = [];
  for (const r of payload?.data || []) {
    const sd = r.startDate ? new Date(r.startDate) : null;
    const ed = r.endDate ? new Date(r.endDate) : null;
    const months = sd && ed ? Math.round((ed.getTime() - sd.getTime()) / (30.4 * 864e5)) : 3;
    const vals: Record<string, number | null> = {};
    for (const key of Object.keys(CONCEPTS)) {
      const { section, names } = CONCEPTS[key];
      vals[key] = pickConcept(r.report, section, names);
    }
    out.push({
      fy: Number(r.year),
      quarter: Number(r.quarter),
      months,
      endDate: r.endDate || "",
      vals,
    });
  }
  return out;
}

interface Quarter {
  period: string;
  year: number;
  q: number;
  label: string;
  projected: boolean;
  revenue: number | null;
  operatingIncome: number | null;
  netIncome: number | null;
  ocf: number | null;
  capex: number | null;
  fcf: number | null;
  eps: number | null;
  shares: number | null;
  equity: number | null;
  grossMargin: number | null;
  netMargin: number | null;
}

const FLOW_KEYS = ["revenue", "costOfRevenue", "operatingIncome", "netIncome", "ocf", "capex"] as const;

// De-cumulate one fiscal year's cumulative reports into four discrete quarters.
function buildFiscalYear(reports: RawReport[]): Quarter[] {
  // Index the cumulative windows by their length in months.
  const byMonths = new Map<number, RawReport>();
  for (const r of reports) {
    // 12-month window can arrive as quarter 0 (annual) or quarter 4.
    const m = r.months >= 11 ? 12 : r.months >= 8 ? 9 : r.months >= 5 ? 6 : 3;
    if (!byMonths.has(m)) byMonths.set(m, r);
  }
  const cum = (m: number) => byMonths.get(m) || null;

  const quarters: Quarter[] = [];
  for (let q = 1; q <= 4; q++) {
    const cur = cum(q * 3);
    const prev = q === 1 ? null : cum((q - 1) * 3);
    if (!cur) continue;

    // Discrete dollar flows: this window minus the previous cumulative window.
    const flow = (key: string): number | null => {
      const a = cur.vals[key];
      if (a == null) return null;
      if (q === 1) return a;
      const b = prev?.vals[key];
      return b == null ? null : a - b;
    };
    const f: Record<string, number | null> = {};
    for (const k of FLOW_KEYS) f[k] = flow(k);

    // Weighted-average shares: the YTD figure is averaged over the window, so
    // recover the single-quarter average by un-weighting the prior window.
    let shares: number | null = null;
    const sCur = cur.vals.shares;
    if (sCur != null) {
      if (q === 1) shares = sCur;
      else {
        const sPrev = prev?.vals.shares;
        shares = sPrev != null ? q * sCur - (q - 1) * sPrev : sCur;
      }
    }

    const revenue = f.revenue;
    const netIncome = f.netIncome;
    const fcf = f.ocf != null && f.capex != null ? f.ocf - f.capex : null;
    const eps = netIncome != null && shares ? netIncome / shares : null;
    const grossMargin =
      revenue && f.costOfRevenue != null ? (revenue - f.costOfRevenue) / revenue : null;
    const netMargin = revenue && netIncome != null ? netIncome / revenue : null;

    const end = cur.endDate ? new Date(cur.endDate) : new Date(`${cur.fy}-${q * 3}-15`);
    quarters.push({
      period: cur.endDate || end.toISOString().slice(0, 10),
      year: cur.fy,
      q,
      label: `Q${q}`,
      projected: false,
      revenue,
      operatingIncome: f.operatingIncome,
      netIncome,
      ocf: f.ocf,
      capex: f.capex,
      fcf,
      eps,
      shares,
      // Equity is a snapshot: the quarter's own report, or the annual close for Q4.
      equity: cur.vals.equity,
      grossMargin,
      netMargin,
    });
  }
  return quarters;
}

function trailing(quarters: Quarter[], i: number, key: keyof Quarter): number | null {
  if (i < 3) return null;
  let sum = 0;
  for (let k = i - 3; k <= i; k++) {
    const v = quarters[k][key];
    if (v == null) return null;
    sum += v as number;
  }
  return sum;
}

// Trailing-year-over-prior-year growth of a discrete-quarter flow series.
function yoyGrowth(values: (number | null)[]): number {
  const v = values.filter((x): x is number => x != null);
  if (v.length < 8) return 0.1;
  const last4 = v.slice(-4).reduce((a, b) => a + b, 0);
  const prev4 = v.slice(-8, -4).reduce((a, b) => a + b, 0);
  if (prev4 === 0) return 0.1;
  return Math.max(-0.5, Math.min(1.0, last4 / prev4 - 1));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticker: string }> }
) {
  try {
    const { ticker } = await params;
    const t = ticker.toUpperCase().trim();
    const key = request.headers.get("x-finnhub-key") || process.env.FINNHUB_API_KEY || "";
    if (!key) {
      return NextResponse.json(
        { error: "A Finnhub API key is required for historical charts." },
        { status: 400 }
      );
    }

    const [qRep, aRep, profile, quote] = await Promise.all([
      fh(`/stock/financials-reported?symbol=${t}&freq=quarterly`, key),
      fh(`/stock/financials-reported?symbol=${t}&freq=annual`, key),
      fh(`/stock/profile2?symbol=${t}`, key),
      fh(`/quote?symbol=${t}`, key),
    ]);

    const reports = [...parseReports(qRep), ...parseReports(aRep)];
    if (reports.length === 0) {
      return NextResponse.json(
        { error: `No as-reported financial history available for ${t}.` },
        { status: 404 }
      );
    }

    // Group every report by fiscal year, then de-cumulate each year.
    const byYear = new Map<number, RawReport[]>();
    for (const r of reports) {
      if (!byYear.has(r.fy)) byYear.set(r.fy, []);
      byYear.get(r.fy)!.push(r);
    }
    let hist: Quarter[] = [];
    for (const fy of [...byYear.keys()].sort((a, b) => a - b)) {
      hist.push(...buildFiscalYear(byYear.get(fy)!));
    }
    hist.sort((a, b) => (a.period < b.period ? -1 : a.period > b.period ? 1 : 0));
    hist = hist.slice(-QUARTERS_BACK);

    if (hist.length < 4) {
      return NextResponse.json(
        { error: `Insufficient quarterly history for ${t}.` },
        { status: 404 }
      );
    }

    // ── Resilience pass ──────────────────────────────────────────────────
    // EPS is derived as netIncome / shares, so a single missing share count
    // blanks both the EPS and Shares charts. Guarantee every actual quarter has
    // a share count: carry the nearest known value forward, falling back to the
    // live profile share count, then (re)compute EPS from it.
    const profileShares = profile?.shareOutstanding ? profile.shareOutstanding * 1e6 : null;
    const firstKnownShares = hist.find((h) => h.shares != null && h.shares > 0)?.shares ?? null;
    let carryShares: number | null = firstKnownShares ?? profileShares;
    for (const h of hist) {
      if (h.shares != null && h.shares > 0) carryShares = h.shares;
      else h.shares = carryShares;
      if ((h.eps == null || !isFinite(h.eps)) && h.netIncome != null && h.shares) {
        h.eps = h.netIncome / h.shares;
      }
    }

    // ── Forward projection (4 quarters) across every metric. Same quarter prior
    // year × (1 + that metric's trailing YoY growth). Shares are held flat
    // (projecting buybacks is speculative); EPS follows from projected income. ──
    const growthOf = (key: keyof Quarter) => yoyGrowth(hist.map((h) => h[key] as number | null));
    const g = {
      revenue: growthOf("revenue"),
      operatingIncome: growthOf("operatingIncome"),
      netIncome: growthOf("netIncome"),
      ocf: growthOf("ocf"),
      fcf: growthOf("fcf"),
      equity: growthOf("equity"),
    };
    const last = hist[hist.length - 1];
    let py = last.year;
    let pq = last.q;
    const proj: Quarter[] = [];
    for (let i = 1; i <= 4; i++) {
      const base = hist[hist.length - 4 + (i - 1)]; // same quarter, prior year
      pq += 1;
      if (pq > 4) {
        pq = 1;
        py += 1;
      }
      const grow = (key: keyof typeof g) => {
        const b = base?.[key] as number | null | undefined;
        return b != null ? b * (1 + g[key]) : null;
      };
      const netIncome = grow("netIncome");
      const shares = last.shares;
      proj.push({
        period: `${py}-${String(pq * 3).padStart(2, "0")}-15`,
        year: py,
        q: pq,
        label: `Q${pq}`,
        projected: true,
        revenue: grow("revenue"),
        operatingIncome: grow("operatingIncome"),
        netIncome,
        ocf: grow("ocf"),
        capex: null,
        fcf: grow("fcf"),
        eps: netIncome != null && shares ? netIncome / shares : null,
        shares,
        equity: grow("equity"),
        grossMargin: base?.grossMargin ?? null,
        netMargin: base?.netMargin ?? null,
      });
    }

    const all = [...hist, ...proj];

    // Rolling trailing-12-month aggregates. For the projected tail these mix
    // actual+projected quarters, which is the intended behaviour for the toggle.
    const quarters = all.map((q, i) => {
      // Trailing-4-quarter average for the share count (a stock, not a flow).
      let sharesTtm: number | null = null;
      if (i >= 3) {
        const w = all.slice(i - 3, i + 1).map((x) => x.shares);
        if (w.every((x) => x != null)) sharesTtm = (w as number[]).reduce((a, b) => a + b, 0) / 4;
      }
      return {
        ...q,
        revenueTtm: trailing(all, i, "revenue"),
        operatingIncomeTtm: trailing(all, i, "operatingIncome"),
        netIncomeTtm: trailing(all, i, "netIncome"),
        ocfTtm: trailing(all, i, "ocf"),
        fcfTtm: trailing(all, i, "fcf"),
        epsTtm: trailing(all, i, "eps"),
        sharesTtm,
      };
    });

    const marketCap = profile?.marketCapitalization ? profile.marketCapitalization * 1e6 : null;

    return NextResponse.json(
      {
        ticker: t,
        name: profile?.name || t,
        logo: profile?.logo || null,
        price: quote?.c ?? null,
        change: quote?.d ?? null,
        changePct: quote?.dp ?? null,
        marketCap,
        currency: profile?.currency || "USD",
        quarters,
        projection: g,
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
