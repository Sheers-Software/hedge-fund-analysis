"use client";

import { useState } from "react";
import { Panel, PillTabs } from "./bits";
import { fmtCompact, type FinancialQuarter } from "@/lib/intel";

function GroupedBars({
  quarters,
  keyA,
  keyB,
}: {
  quarters: FinancialQuarter[];
  keyA: { field: keyof FinancialQuarter; color: string; label: string };
  keyB: { field: keyof FinancialQuarter; color: string; label: string };
}) {
  const data = quarters.slice(-4);
  const vals = data.flatMap((q) => [Number(q[keyA.field]) || 0, Number(q[keyB.field]) || 0]);
  const max = Math.max(1, ...vals.map(Math.abs));
  const H = 150;
  const slot = 100 / data.length;
  const bw = slot * 0.26;

  return (
    <svg className="intel-fin-bars" viewBox="0 0 100 165" preserveAspectRatio="none">
      {data.map((q, i) => {
        const cx = i * slot + slot / 2;
        const a = Number(q[keyA.field]) || 0;
        const b = Number(q[keyB.field]) || 0;
        const ha = (Math.abs(a) / max) * H;
        const hb = (Math.abs(b) / max) * H;
        return (
          <g key={i}>
            <rect x={cx - bw - 1} y={H - ha} width={bw} height={ha} rx={0.8} fill={keyA.color} />
            <rect x={cx + 1} y={H - hb} width={bw} height={hb} rx={0.8} fill={keyB.color} />
            <text x={cx} y={H + 11} className="intel-fin-xlabel" textAnchor="middle">
              Q{q.quarter} &apos;{String(q.year).slice(2)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function yoy(quarters: FinancialQuarter[], field: keyof FinancialQuarter): number | null {
  if (quarters.length < 2) return null;
  const latest = quarters[quarters.length - 1];
  const prior = quarters.length >= 5 ? quarters[quarters.length - 5] : quarters[0];
  const a = Number(latest[field]);
  const b = Number(prior[field]);
  if (!a || !b || isNaN(a) || isNaN(b)) return null;
  return a / b - 1;
}

function Row({ label, value, change }: { label: string; value: string; change: number | null }) {
  return (
    <div className="intel-fin-row">
      <span className="intel-fin-rlabel">{label}</span>
      <span className="intel-fin-rval">{value}</span>
      <span className={`intel-fin-rchg ${change == null ? "" : change >= 0 ? "pos" : "neg"}`}>
        {change == null ? "—" : `${change >= 0 ? "▲" : "▼"} ${(Math.abs(change) * 100).toFixed(1)}%`}
      </span>
    </div>
  );
}

export default function FinancialsPanel({ quarters }: { quarters: FinancialQuarter[] }) {
  const [tab, setTab] = useState<"balance" | "income">("balance");
  const has = quarters.length > 0;
  const latest = has ? quarters[quarters.length - 1] : null;

  return (
    <Panel
      title="Financials"
      right={latest ? <span className="intel-horizon">USD · Q{latest.quarter} &apos;{String(latest.year).slice(2)}</span> : undefined}
    >
      <PillTabs
        tabs={[
          { id: "balance", label: "Balance Sheet" },
          { id: "income", label: "Income Statement" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {!has ? (
        <p className="intel-foot" style={{ padding: "24px 0" }}>
          Reported financial statements are unavailable for this ticker (requires a Finnhub key with statement access).
        </p>
      ) : tab === "balance" ? (
        <>
          <div className="intel-fin-legend">
            <span><i style={{ background: "#10b981" }} /> Total Assets</span>
            <span><i style={{ background: "#f59e0b" }} /> Total Liabilities</span>
          </div>
          <div className="intel-fin-chartwrap">
            <GroupedBars
              quarters={quarters}
              keyA={{ field: "totalAssets", color: "#10b981", label: "Total Assets" }}
              keyB={{ field: "totalLiabilities", color: "#f59e0b", label: "Total Liabilities" }}
            />
          </div>
          <div className="intel-fin-rows">
            <Row label="Total Assets" value={fmtCompact(latest!.totalAssets)} change={yoy(quarters, "totalAssets")} />
            <Row label="Total Liabilities" value={fmtCompact(latest!.totalLiabilities)} change={yoy(quarters, "totalLiabilities")} />
            <Row label="Total Equity" value={fmtCompact(latest!.totalEquity)} change={yoy(quarters, "totalEquity")} />
            <Row label="Cash & Equiv." value={fmtCompact(latest!.cash)} change={yoy(quarters, "cash")} />
          </div>
        </>
      ) : (
        <>
          <div className="intel-fin-legend">
            <span><i style={{ background: "#10b981" }} /> Revenue</span>
            <span><i style={{ background: "#f59e0b" }} /> Net Income</span>
          </div>
          <div className="intel-fin-chartwrap">
            <GroupedBars
              quarters={quarters}
              keyA={{ field: "revenue", color: "#10b981", label: "Revenue" }}
              keyB={{ field: "netIncome", color: "#f59e0b", label: "Net Income" }}
            />
          </div>
          <div className="intel-fin-rows">
            <Row label="Revenue" value={fmtCompact(latest!.revenue)} change={yoy(quarters, "revenue")} />
            <Row label="Gross Profit" value={fmtCompact(latest!.grossProfit)} change={yoy(quarters, "grossProfit")} />
            <Row label="Operating Income" value={fmtCompact(latest!.operatingIncome)} change={yoy(quarters, "operatingIncome")} />
            <Row label="Net Income" value={fmtCompact(latest!.netIncome)} change={yoy(quarters, "netIncome")} />
          </div>
        </>
      )}
      <p className="intel-foot">Y/Y compares the latest quarter to the same quarter a year prior. Source: company filings via Finnhub.</p>
    </Panel>
  );
}
