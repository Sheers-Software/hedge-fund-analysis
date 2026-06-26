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
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setAiLoading(false);
    setError(null);
    const headers = { "x-finnhub-key": finnhubKey, "x-gemini-key": geminiKey };

    // Phase 1 — deterministic terminal (~1s): paint the dashboard immediately.
    fetch(`/api/intel/${ticker}`, { headers })
      .then((r) => r.json())
      .then((d) => {
        if (!active) return;
        if (d.error) {
          setError(d.error);
          return;
        }
        setData(d);
        setLoading(false);
        // Only record real, resolvable tickers in history (skip bad/blocked).
        if (d.price != null && Number(d.price) !== 0) {
          addHistory({ ticker, name: d.name, kind: "intel" });
        }
        // Phase 2 — AI narration (~9s) loads in the background and upgrades the
        // panels in place once Gemini responds. Never blocks the first paint.
        if (d.price != null && Number(d.price) !== 0) {
          setAiLoading(true);
          fetch(`/api/intel/${ticker}?ai=1`, { headers })
            .then((r) => r.json())
            .then((ai) => {
              if (active && ai && !ai.error && ai.aiPowered) setData(ai);
            })
            .catch(() => {})
            .finally(() => active && setAiLoading(false));
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
    // Bar heights are fixed (no randomness) so SSR/CSR markup stays identical.
    const barHeights = [52, 78, 40, 92, 64, 84, 48];
    return (
      <div className="intel-grid intel-grid-skel" aria-busy="true" aria-label={`Loading intelligence for ${ticker}`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="intel-panel intel-skelpanel"
            style={{ ["--sk-delay" as string]: `${i * 0.1}s` }}
          >
            <div className="sk-head">
              <span className="sk-pill" />
              <span className="sk-pill sk-pill-sm" />
            </div>
            <div className="sk-bars">
              {barHeights.map((h, j) => (
                <span key={j} className="sk-bar" style={{ height: `${h}%` }} />
              ))}
            </div>
            <div className="sk-rows">
              <span className="sk-row" />
              <span className="sk-row" />
              <span className="sk-row" />
            </div>
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
          {aiLoading && !data.aiPowered && (
            <span className="intel-ai-pill">
              <Activity size={12} /> Refining with AI…
            </span>
          )}
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
