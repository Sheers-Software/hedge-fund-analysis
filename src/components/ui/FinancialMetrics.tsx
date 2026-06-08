"use client";

import { CompanyData } from "@/lib/types";

const fmtPct = (v: any) => v != null ? `${(Number(v) * 100).toFixed(1)}%` : "N/A";
const fmtNum = (v: any) => v != null ? Number(v).toFixed(2) : "N/A";

export default function FinancialMetrics({ data }: { data: CompanyData }) {
  const f = data.financials || {};

  const metrics = [
    { label: "Revenue (TTM)", value: f.revenue_formatted || "N/A" },
    { label: "Net Income", value: f.net_income_formatted || "N/A" },
    { label: "EV/EBITDA", value: fmtNum(f.ev_ebitda) },
    { label: "Gross Margin", value: f.gross_margin ? fmtPct(f.gross_margin) : "N/A" },
    { label: "Operating Margin", value: f.operating_margin ? fmtPct(f.operating_margin) : "N/A" },
    { label: "Rev Growth (YoY)", value: f.revenue_growth ? fmtPct(f.revenue_growth) : "N/A" },
    { label: "Free Cash Flow", value: f.free_cashflow || "N/A" },
    { label: "Total Debt", value: f.total_debt || "N/A" },
  ];

  return (
    <div className="metrics-grid">
      {metrics.map((m, i) => (
        <div key={i} className="metric-card">
          <div className="metric-label">{m.label}</div>
          <div className="metric-value">{m.value}</div>
        </div>
      ))}
    </div>
  );
}
