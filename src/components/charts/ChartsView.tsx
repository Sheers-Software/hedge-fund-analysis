"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store";
import QuarterlyBarChart from "./QuarterlyBarChart";
import MarginLineChart from "./MarginLineChart";

interface Quarter {
  period: string;
  year: number;
  q: number;
  label: string;
  eps: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  fcf: number | null;
  fcfTtm: number | null;
  projected: boolean;
}

const fmtMoney = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e12) return `$${(n / 1e12).toFixed(1)}T`;
  if (a >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `$${(n / 1e6).toFixed(0)}M`;
  return `$${n.toFixed(0)}`;
};
const fmtEps = (n: number) => `$${n.toFixed(2)}`;

export default function ChartsView({ ticker }: { ticker: string }) {
  const { finnhubKey } = useSettingsStore();
  const [data, setData] = useState<{ name: string; quarters: Quarter[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fcfMode, setFcfMode] = useState<"quarterly" | "ttm">("quarterly");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/history/${ticker}`, { headers: { "x-finnhub-key": finnhubKey } })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [ticker, finnhubKey]);

  if (loading) return <div className="charts-status">Loading historical data for {ticker}…</div>;
  if (error || !data) return <div className="charts-status charts-error">Failed to load charts: {error}</div>;

  const q = data.quarters;

  return (
    <div className="charts-grid">
      <div className="chart-card">
        <div className="chart-head">
          <div className="chart-title">Quarterly EPS</div>
          <div className="chart-legend">
            <span><i className="lg-dot" style={{ background: "#22c55e" }} /> Positive</span>
            <span><i className="lg-dot" style={{ background: "#ef4444" }} /> Negative</span>
            <span><i className="lg-dot" style={{ background: "#f59e0b" }} /> Projected</span>
          </div>
        </div>
        <div className="chart-scroll">
          <QuarterlyBarChart
            mode="eps"
            format={fmtEps}
            data={q.map((x) => ({ label: x.label, year: x.year, value: x.eps, projected: x.projected }))}
          />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <div className="chart-title">Free Cash Flow</div>
          <div className="chart-toggle">
            <button className={fcfMode === "quarterly" ? "active" : ""} onClick={() => setFcfMode("quarterly")}>
              Quarterly
            </button>
            <button className={fcfMode === "ttm" ? "active" : ""} onClick={() => setFcfMode("ttm")}>
              Trailing 12 Mo
            </button>
          </div>
        </div>
        <div className="chart-scroll">
          <QuarterlyBarChart
            mode="fcf"
            format={fmtMoney}
            data={q.map((x) => ({
              label: x.label,
              year: x.year,
              value: fcfMode === "quarterly" ? x.fcf : x.fcfTtm,
              projected: x.projected,
            }))}
          />
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-head">
          <div className="chart-title">Gross &amp; Net Margin</div>
          <div className="chart-legend">
            <span><i className="lg-dot" style={{ background: "#d946ef" }} /> Gross Margin</span>
            <span><i className="lg-dot" style={{ background: "#22d3ee" }} /> Net Margin</span>
            <span className="lg-muted">dashed = projected</span>
          </div>
        </div>
        <div className="chart-scroll">
          <MarginLineChart
            data={q.map((x) => ({ label: x.label, year: x.year, gross: x.grossMargin, net: x.netMargin, projected: x.projected }))}
          />
        </div>
      </div>

      <div className="charts-note">
        Last 4 quarters are a forward projection (same quarter prior year × trailing YoY growth; margins held at the trailing‑4Q average). For reference only — not a forecast.
      </div>
    </div>
  );
}
