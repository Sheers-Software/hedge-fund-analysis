import { NextResponse } from "next/server";

// Real-time, never cached.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const QUARTERS_BACK = 16; // ~4 years of history
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

const toMap = (arr: any[]): Record<string, number> => {
  const m: Record<string, number> = {};
  (arr || []).forEach((x) => {
    if (x && x.period != null && x.v != null) m[x.period] = x.v;
  });
  return m;
};

function quarterMeta(period: string) {
  const d = new Date(period);
  const q = Math.floor(d.getUTCMonth() / 3) + 1;
  return { year: d.getUTCFullYear(), q, label: `Q${q}` };
}

// Trailing-year-over-prior-year growth of a series (last 4 vs prior 4).
function yoyGrowth(values: (number | null)[]): number {
  const v = values.filter((x): x is number => x != null);
  if (v.length < 8) return 0.1;
  const last4 = v.slice(-4).reduce((a, b) => a + b, 0);
  const prev4 = v.slice(-8, -4).reduce((a, b) => a + b, 0);
  if (prev4 === 0) return 0.1;
  const g = last4 / prev4 - 1;
  // Clamp to a sane band so anomalies don't produce absurd projections.
  return Math.max(-0.5, Math.min(1.0, g));
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

    const [metric, profile] = await Promise.all([
      fh(`/stock/metric?symbol=${t}&metric=all`, key),
      fh(`/stock/profile2?symbol=${t}`, key),
    ]);

    const sq = metric?.series?.quarterly || {};
    const shares = profile?.shareOutstanding ? profile.shareOutstanding * 1e6 : null;

    const eps = toMap(sq.eps);
    const gm = toMap(sq.grossMargin);
    const nm = toMap(sq.netMargin);
    const fcfM = toMap(sq.fcfMargin);
    const sps = toMap(sq.salesPerShare);

    const periods = Array.from(
      new Set([...Object.keys(eps), ...Object.keys(nm), ...Object.keys(fcfM)])
    ).sort();

    if (periods.length === 0) {
      return NextResponse.json(
        { error: `No quarterly history available for ${t}.` },
        { status: 404 }
      );
    }

    const recent = periods.slice(-QUARTERS_BACK);

    const hist = recent.map((p) => {
      const meta = quarterMeta(p);
      const revenueQ = sps[p] != null && shares ? sps[p] * shares : null;
      const fcf = fcfM[p] != null && revenueQ != null ? fcfM[p] * revenueQ : null;
      return {
        period: p,
        ...meta,
        eps: eps[p] ?? null,
        grossMargin: gm[p] ?? null,
        netMargin: nm[p] ?? null,
        fcf,
        projected: false,
      };
    });

    // 4-quarter forward projection: same quarter prior year x (1 + YoY growth).
    const epsG = yoyGrowth(hist.map((h) => h.eps));
    const fcfG = yoyGrowth(hist.map((h) => h.fcf));
    const avg = (key: "grossMargin" | "netMargin") => {
      const v = hist.slice(-4).map((h) => h[key]).filter((x): x is number => x != null);
      return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
    };
    const gmAvg = avg("grossMargin");
    const nmAvg = avg("netMargin");

    const last = hist[hist.length - 1];
    let py = last.year;
    let pq = last.q;
    const proj = [];
    for (let i = 1; i <= 4; i++) {
      const base = hist[hist.length - 4 + (i - 1)]; // same quarter, prior year
      pq += 1;
      if (pq > 4) {
        pq = 1;
        py += 1;
      }
      const period = `${py}-${String(pq * 3).padStart(2, "0")}-15`;
      proj.push({
        period,
        year: py,
        q: pq,
        label: `Q${pq}`,
        eps: base?.eps != null ? base.eps * (1 + epsG) : null,
        grossMargin: gmAvg,
        netMargin: nmAvg,
        fcf: base?.fcf != null ? base.fcf * (1 + fcfG) : null,
        projected: true,
      });
    }

    const quarters = [...hist, ...proj];

    // Trailing-12-month FCF (rolling 4-quarter sum) for the FCF toggle.
    quarters.forEach((q, i) => {
      const window = quarters.slice(Math.max(0, i - 3), i + 1).map((x) => x.fcf);
      (q as any).fcfTtm =
        window.length === 4 && window.every((x) => x != null)
          ? (window as number[]).reduce((a, b) => a + b, 0)
          : null;
    });

    return NextResponse.json(
      {
        ticker: t,
        name: profile?.name || t,
        quarters,
        projection: { epsGrowth: epsG, fcfGrowth: fcfG },
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
