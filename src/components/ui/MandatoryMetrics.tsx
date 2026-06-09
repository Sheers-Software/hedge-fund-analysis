"use client";

import { CompanyData } from "@/lib/types";

const fmtNum = (v: any) =>
  v === null || v === undefined || isNaN(Number(v)) ? "—" : Number(v).toFixed(2);

const fmtPct = (v: any) =>
  v === null || v === undefined || isNaN(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;

interface Row {
  label: string;
  value: string;
  benchmark: string;
}

export default function MandatoryMetrics({ data }: { data: CompanyData }) {
  const f = data.financials || {};

  // Each group renders with a divider gap, mirroring the reference layout.
  const groups: Row[][] = [
    [
      { label: "TTM PE", value: fmtNum(f.pe_ratio), benchmark: "Many stocks trade at 20-28" },
      { label: "Forward PE", value: fmtNum(f.pe_fwd ?? f.forward_pe), benchmark: "Many stocks trade at 18-26" },
      { label: "2 Year Forward PE", value: fmtNum(f.pe_2y_fwd), benchmark: "Many stocks trade at 16-24" },
    ],
    [
      { label: "TTM EPS Growth", value: fmtPct(f.earnings_growth), benchmark: "Many stocks trade at 8-12%" },
      { label: "Current Yr Exp EPS Growth", value: fmtPct(f.eps_growth_cur_fy), benchmark: "Many stocks trade at 8-12%" },
      { label: "Next Year EPS Growth", value: fmtPct(f.eps_growth_next_fy), benchmark: "Many stocks trade at 8-12%" },
    ],
    [
      { label: "TTM Rev Growth", value: fmtPct(f.revenue_growth), benchmark: "Many stocks trade at 4.5-6.5%" },
      { label: "Current Yr Exp Rev Growth", value: fmtPct(f.rev_growth_cur_fy), benchmark: "Many stocks trade at 4.5-6.5%" },
      { label: "Next Year Rev Growth", value: fmtPct(f.rev_growth_next_fy), benchmark: "Many stocks trade at 4.5-6.5%" },
    ],
    [
      { label: "Gross Margin", value: fmtPct(f.gross_margin), benchmark: "Many stocks trade at 40-48%" },
      { label: "Net Margin", value: fmtPct(f.profit_margin), benchmark: "Many stocks trade at 8-10%" },
      { label: "TTM P/S Ratio", value: fmtNum(f.ps_ratio), benchmark: "Many stocks trade at 1.8-2.6" },
      { label: "Forward P/S Ratio", value: fmtNum(f.forward_ps), benchmark: "Many stocks trade at 1.8-2.6" },
    ],
  ];

  return (
    <div className="mandatory-metrics">
      <div className="mm-title">Mandatory Metrics</div>
      <div className="mm-groups">
        {groups.map((group, gi) => (
          <div key={gi} className="mm-group">
            {group.map((row) => (
              <div key={row.label} className="mm-row">
                <div className="mm-label">{row.label}</div>
                <div className="mm-value">{row.value}</div>
                <div className="mm-benchmark">{row.benchmark}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
