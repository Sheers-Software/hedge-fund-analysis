"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store";
import MetricBarChart from "./MetricBarChart";
import MarginLineChart from "./MarginLineChart";

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
  fcf: number | null;
  eps: number | null;
  shares: number | null;
  equity: number | null;
  grossMargin: number | null;
  netMargin: number | null;
  revenueTtm: number | null;
  operatingIncomeTtm: number | null;
  ocfTtm: number | null;
  fcfTtm: number | null;
  epsTtm: number | null;
  sharesTtm: number | null;
}

interface History {
  ticker: string;
  name: string;
  logo: string | null;
  price: number | null;
  change: number | null;
  changePct: number | null;
  marketCap: number | null;
  quarters: Quarter[];
}

const fmtMoney = (n: number) => {
  const a = Math.abs(n);
  const s = n < 0 ? "-" : "";
  if (a >= 1e12) return `${s}$${(a / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${s}$${(a / 1e9).toFixed(1)}B`;
  if (a >= 1e6) return `${s}$${(a / 1e6).toFixed(0)}M`;
  return `${s}$${a.toFixed(0)}`;
};
const fmtEps = (n: number) => `$${n.toFixed(2)}`;
const fmtShares = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(2)}B` : `${(n / 1e6).toFixed(0)}M`;

type Mode = "quarterly" | "ttm";

// A single chart card with an optional Quarterly / Trailing-12-Mo toggle.
function BarCard({
  title,
  color,
  format,
  quarters,
  pickQuarterly,
  pickTtm,
  defaultMode = "quarterly",
  toggle = true,
  legend,
}: {
  title: string;
  color: string;
  format: (v: number) => string;
  quarters: Quarter[];
  pickQuarterly: (q: Quarter) => number | null;
  pickTtm?: (q: Quarter) => number | null;
  defaultMode?: Mode;
  toggle?: boolean;
  legend?: React.ReactNode;
}) {
  const [mode, setMode] = useState<Mode>(toggle ? defaultMode : "quarterly");
  const pick = mode === "ttm" && pickTtm ? pickTtm : pickQuarterly;

  return (
    <div className="chart-card">
      <div className="chart-head">
        <div className="chart-title">{title}</div>
        {legend ?? <ProjLegend />}
        {toggle && pickTtm && (
          <div className="chart-toggle">
            <button className={mode === "quarterly" ? "active" : ""} onClick={() => setMode("quarterly")}>
              Quarterly
            </button>
            <button className={mode === "ttm" ? "active" : ""} onClick={() => setMode("ttm")}>
              Trailing 12 Mo
            </button>
          </div>
        )}
      </div>
      <div className="chart-scroll">
        <MetricBarChart
          color={color}
          format={format}
          data={quarters.map((q) => ({
            label: q.label,
            year: q.year,
            value: pick(q),
            projected: q.projected,
          }))}
        />
      </div>
    </div>
  );
}

export default function ChartsView({ ticker }: { ticker: string }) {
  const { finnhubKey } = useSettingsStore();
  const [data, setData] = useState<History | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  if (error || !data)
    return <div className="charts-status charts-error">Failed to load charts: {error}</div>;

  const q = data.quarters;
  const up = (data.changePct ?? 0) >= 0;

  return (
    <div className="charts-grid">
      {/* Company strip — logo, name, live price & market cap. */}
      <div className="charts-company">
        <div className="cc-left">
          {data.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="cc-logo" src={data.logo} alt={data.name} />
          ) : (
            <div className="cc-logo cc-logo-fallback">{data.name.charAt(0)}</div>
          )}
          <div>
            <div className="cc-name">{data.name}</div>
            <div className="cc-ticker">{data.ticker}</div>
          </div>
        </div>
        <div className="cc-right">
          {data.price != null && (
            <span className="cc-stat">
              Stock Price <b>${data.price.toFixed(2)}</b>
              {data.changePct != null && (
                <span className={`cc-chg ${up ? "pos" : "neg"}`}>
                  {up ? "▲" : "▼"} {Math.abs(data.changePct).toFixed(2)}%
                </span>
              )}
            </span>
          )}
          {data.marketCap != null && (
            <span className="cc-stat">
              Mkt Cap <b>{fmtMoney(data.marketCap)}</b>
            </span>
          )}
        </div>
      </div>

      {/* 1 — Revenue (default TTM, with forward projection) */}
      <BarCard
        title="Revenue"
        color="#f5a623"
        format={fmtMoney}
        quarters={q}
        defaultMode="ttm"
        pickQuarterly={(x) => x.revenue}
        pickTtm={(x) => x.revenueTtm}
      />

      {/* 2 — Gross & Net Margin */}
      <div className="chart-card">
        <div className="chart-head">
          <div className="chart-title">Gross &amp; Net Margin</div>
          <div className="chart-legend">
            <span><i className="lg-dot" style={{ background: "#d946ef" }} /> Gross Margin</span>
            <span><i className="lg-dot" style={{ background: "#22d3ee" }} /> Net Margin</span>
          </div>
        </div>
        <div className="chart-scroll">
          <MarginLineChart
            data={q.map((x) => ({
              label: x.label,
              year: x.year,
              gross: x.grossMargin,
              net: x.netMargin,
              projected: x.projected,
            }))}
          />
        </div>
      </div>

      {/* 3 — EPS (default TTM, with forward projection) */}
      <BarCard
        title="EPS (Diluted)"
        color="#22c55e"
        format={fmtEps}
        quarters={q}
        defaultMode="ttm"
        pickQuarterly={(x) => x.eps}
        pickTtm={(x) => x.epsTtm}
      />

      {/* 4 — Free Cash Flow */}
      <BarCard
        title="Free Cash Flow"
        color="#22d3ee"
        format={fmtMoney}
        quarters={q}
        defaultMode="quarterly"
        pickQuarterly={(x) => x.fcf}
        pickTtm={(x) => x.fcfTtm}
      />

      {/* 5 — Operating Cash Flow */}
      <BarCard
        title="Operating Cash Flow"
        color="#eab308"
        format={fmtMoney}
        quarters={q}
        defaultMode="ttm"
        pickQuarterly={(x) => x.ocf}
        pickTtm={(x) => x.ocfTtm}
      />

      {/* 6 — Operating Income */}
      <BarCard
        title="Operating Income"
        color="#84cc16"
        format={fmtMoney}
        quarters={q}
        defaultMode="ttm"
        pickQuarterly={(x) => x.operatingIncome}
        pickTtm={(x) => x.operatingIncomeTtm}
      />

      {/* 7 — Shareholder Equity (point-in-time snapshot, no TTM) */}
      <BarCard
        title="Shareholder Equity"
        color="#3b82f6"
        format={fmtMoney}
        quarters={q}
        toggle={false}
        pickQuarterly={(x) => x.equity}
      />

      {/* 8 — Shares Outstanding (diluted, weighted average) */}
      <BarCard
        title="Shares Outstanding"
        color="#4ade80"
        format={fmtShares}
        quarters={q}
        defaultMode="quarterly"
        pickQuarterly={(x) => x.shares}
        pickTtm={(x) => x.sharesTtm}
      />

      <div className="charts-note">
        Single-quarter figures de-cumulated from as-reported filings (Finnhub). Every chart includes
        a 4-quarter forward projection (same quarter prior year × that metric&apos;s trailing YoY
        growth) shown as red bars with a green/amber cap for the projected change — for reference
        only, not a forecast.
      </div>
    </div>
  );
}

function ProjLegend() {
  return (
    <div className="chart-legend">
      <span><i className="lg-dot" style={{ background: "#ef4444" }} /> Projected</span>
      <span><i className="lg-dot" style={{ background: "#22c55e" }} /> Proj. growth</span>
    </div>
  );
}
