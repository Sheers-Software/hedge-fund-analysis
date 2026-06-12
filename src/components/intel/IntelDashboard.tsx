"use client";

import { useEffect, useState } from "react";
import { Activity, AlertTriangle } from "lucide-react";
import { useSettingsStore, useHistoryStore } from "@/lib/store";
import { fmtPctSigned } from "@/lib/intel";
import MultiModelView from "./MultiModelView";
import AIAnalysisPanel from "./AIAnalysisPanel";
import SupportResistance from "./SupportResistance";
import TopTransactors from "./TopTransactors";
import FinancialsPanel from "./FinancialsPanel";

export default function IntelDashboard({ ticker }: { ticker: string }) {
  const { finnhubKey, geminiKey } = useSettingsStore();
  const addHistory = useHistoryStore((s) => s.add);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetch(`/api/intel/${ticker}`, {
      headers: { "x-finnhub-key": finnhubKey, "x-gemini-key": geminiKey },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) {
          setError(d.error);
        } else {
          setData(d);
          // Only record real, resolvable tickers in history (skip bad/blocked).
          if (d.price != null && Number(d.price) !== 0) {
            addHistory({ ticker, name: d.name, kind: "intel" });
          }
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, finnhubKey, geminiKey]);

  if (loading) {
    return (
      <div className="intel-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="intel-panel intel-skel" style={{ height: i < 3 ? 360 : 320 }}>
            <div className="skeleton" style={{ height: "100%" }} />
          </div>
        ))}
      </div>
    );
  }

  // A real, tradeable price is the floor for a meaningful dashboard. A null/0
  // price means the symbol didn't resolve (bad ticker) or live data is blocked —
  // show a clean message instead of a degenerate "$0.00" terminal.
  const noData = !!data && (data.price == null || Number(data.price) === 0);

  if (error || !data || noData) {
    return (
      <div className="intel-error">
        <AlertTriangle size={20} color="var(--amber)" />
        <div>
          <strong>No market data for {ticker}.</strong>
          <p>
            {error
              ? error
              : `We couldn't resolve a live price for "${ticker}". Check the ticker symbol`}
            {!error && ", or add a Finnhub key in Settings if Yahoo is blocked here."}
          </p>
        </div>
      </div>
    );
  }

  const up = (data.changePct ?? 0) >= 0;

  return (
    <>
      <div className="intel-topbar">
        <div className="intel-topbar-id">
          <span className="intel-topbar-ticker">{data.ticker}</span>
          <span className="intel-topbar-name">{data.name}</span>
          {data.sector && <span className="intel-topbar-sector">{data.sector}</span>}
        </div>
        <div className="intel-topbar-price">
          <span className="intel-topbar-px">{data.price != null ? `$${Number(data.price).toFixed(2)}` : "—"}</span>
          {data.changePct != null && (
            <span className={`intel-topbar-chg ${up ? "pos" : "neg"}`}>
              {up ? "▲" : "▼"} {fmtPctSigned(data.changePct)}
            </span>
          )}
        </div>
      </div>

      {data.dataWarning && (
        <div className="intel-warn">
          <AlertTriangle size={14} /> Live market data is partially blocked here. Add a Finnhub key in Settings for full fidelity.
        </div>
      )}

      <div className="intel-grid">
        <MultiModelView
          price={data.price}
          changePct={data.changePct}
          horizonLabel={data.projection.horizonLabel}
          history={data.projection.history}
          models={data.projection.models}
        />
        <AIAnalysisPanel technical={data.technical} fundamental={data.fundamental} aiPowered={data.aiPowered} />
        <SupportResistance
          current={data.supportResistance.current}
          supports={data.supportResistance.supports}
          resistances={data.supportResistance.resistances}
          confidence={data.supportResistance.confidence}
          summary={data.supportResistance.summary}
          history={data.projection.history}
        />
        <TopTransactors
          name={data.name}
          ticker={data.ticker}
          marketCap={data.marketCap}
          institutionalPct={data.ownership.institutionalPct}
          insiderPct={data.ownership.insiderPct}
          summary={data.ownership.summary}
          insiderTx={data.ownership.insiderTx}
          netInsiderShares={data.ownership.netInsiderShares}
        />
        <FinancialsPanel quarters={data.financials.quarters} />
      </div>

      <div className="intel-disclaimer">
        <Activity size={13} color="var(--accent)" /> ApexAlpha Intelligence blends deterministic quant models with{" "}
        {data.aiPowered ? "Gemini 2.5 Flash narration" : "rule-based narration"}. Research &amp; education only — not financial
        advice. You make the call.
      </div>
    </>
  );
}
