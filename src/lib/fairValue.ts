import type { CompanyData } from "@/lib/types";

// ── Quick "fair value check" ─────────────────────────────────────────
// A fast, transparent verdict built from public consensus + fundamentals.
// It is intentionally NOT a recommendation — it blends an analyst-consensus
// anchor with a growth-adjusted earnings multiple and the 52-week range so a
// user can see, at a glance, whether a stock screens cheap or expensive.
//
// Deliberately simple and explainable (every input is shown as a "signal").

export type Verdict = "undervalued" | "fair" | "overvalued" | "unknown";

export interface FairValueResult {
  ticker: string;
  name: string;
  price: number | null;
  fairValue: number | null;
  gapPct: number | null; // (fairValue - price) / price
  verdict: Verdict;
  verdictLabel: string;
  basis: string;
  signals: string[];
}

const num = (v: any): number | null =>
  v === null || v === undefined || isNaN(Number(v)) ? null : Number(v);

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

const verdictLabels: Record<Verdict, string> = {
  undervalued: "Screens undervalued",
  fair: "Roughly fairly valued",
  overvalued: "Screens overvalued",
  unknown: "Not enough data",
};

export function computeFairValue(data: CompanyData): FairValueResult {
  const f = data?.financials || {};
  const name = data?.info?.longName || data?.ticker || "";
  const price =
    num(data?.real_time_quote?.current) ?? num(f.current_price);

  const signals: string[] = [];

  // 1) Analyst-consensus anchor (primary when available).
  const target = num(f.analyst_target);
  const nAnalysts = num(f.num_analyst_opinions);
  let fairValue: number | null = null;
  let basis = "";

  if (target && target > 0) {
    fairValue = target;
    basis = "12-month analyst consensus target";
    signals.push(
      `Analyst consensus target: $${target.toFixed(2)}${
        nAnalysts ? ` (${nAnalysts} analysts)` : ""
      }`
    );
  }

  // 2) Growth-adjusted earnings multiple (fallback / cross-check).
  const fwdEps = num(f.forward_eps) ?? num(f.eps_fwd) ?? num(f.trailing_eps);
  const growth =
    num(f.earnings_growth) ??
    num(f.eps_growth_cur_fy) ??
    num(f.revenue_growth);
  if (fwdEps && fwdEps > 0) {
    // Base PE 15, add up to ~20x for growth, capped — a transparent heuristic.
    const growthPts = growth ? clamp(growth * 100, -5, 25) : 5;
    const impliedPe = clamp(15 + growthPts, 8, 45);
    const multipleFV = fwdEps * impliedPe;
    if (fairValue === null) {
      fairValue = multipleFV;
      basis = "growth-adjusted earnings multiple";
    }
    signals.push(
      `Forward EPS $${fwdEps.toFixed(2)} × ${impliedPe.toFixed(0)} (growth-adjusted P/E)`
    );
  }

  const pe = num(f.pe_ratio) ?? num(f.forward_pe);
  if (pe) signals.push(`P/E ratio: ${pe.toFixed(1)}`);
  const peg = num(f.peg_ratio);
  if (peg) signals.push(`PEG ratio: ${peg.toFixed(2)} (1.0 ≈ growth-fair)`);

  // 3) 52-week range context.
  const hi = num(f["52w_high"]);
  const lo = num(f["52w_low"]);
  if (price && hi && lo && hi > lo) {
    const pos = clamp(((price - lo) / (hi - lo)) * 100, 0, 100);
    signals.push(`At ${pos.toFixed(0)}% of its 52-week range`);
  }

  let gapPct: number | null = null;
  let verdict: Verdict = "unknown";
  if (price && fairValue) {
    gapPct = (fairValue - price) / price;
    verdict = gapPct > 0.1 ? "undervalued" : gapPct < -0.1 ? "overvalued" : "fair";
  }

  return {
    ticker: data?.ticker || "",
    name,
    price,
    fairValue,
    gapPct,
    verdict,
    verdictLabel: verdictLabels[verdict],
    basis,
    signals,
  };
}
