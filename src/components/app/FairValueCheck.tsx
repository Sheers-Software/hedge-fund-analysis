"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSettingsStore, useAppStore } from "@/lib/store";
import { useGate } from "@/lib/useGate";
import { computeFairValue, type FairValueResult } from "@/lib/fairValue";
import { trackViewVerdict } from "@/lib/analytics";
import { TRIPWIRE, introPriceFor } from "@/lib/tiers";
import { CompanyData } from "@/lib/types";
import { FileText, X, Gauge, Lock, ArrowRight } from "lucide-react";

const verdictColor: Record<string, string> = {
  undervalued: "var(--green)",
  fair: "var(--amber)",
  overvalued: "var(--red)",
  unknown: "var(--t3)",
};

export default function FairValueCheck({
  ticker,
  onComplete,
  onClose,
}: {
  ticker: string;
  onComplete?: (r: FairValueResult) => void;
  onClose?: () => void;
}) {
  const router = useRouter();
  const finnhubKey = useSettingsStore((s) => s.finnhubKey);
  const setCurrentTicker = useAppStore((s) => s.setCurrentTicker);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const { guardTripwire, hasDeepDive } = useGate();
  const [result, setResult] = useState<FairValueResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const firedFor = useRef<string | null>(null);
  const verdictFiredFor = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);
    (async () => {
      try {
        const res = await fetch(`/api/quote/${ticker}`, {
          headers: { "x-finnhub-key": finnhubKey },
        });
        const data: CompanyData = await res.json();
        if (cancelled) return;
        if (!data || (data.error && !data.financials?.current_price && !data.real_time_quote?.current)) {
          setError(`Couldn't load data for ${ticker}.`);
          setLoading(false);
          return;
        }
        const r = computeFairValue(data);
        setResult(r);
        setLoading(false);
        // ① The free ungated verdict was shown — fire ViewVerdict once.
        if (verdictFiredFor.current !== ticker) {
          verdictFiredFor.current = ticker;
          trackViewVerdict(ticker);
        }
        // Record usage/history once per ticker render.
        if (onComplete && firedFor.current !== ticker) {
          firedFor.current = ticker;
          onComplete(r);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e.message || "Network error.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, finnhubKey]);

  return (
    <div className="fvc-card">
      <div className="fvc-head">
        <div className="fvc-head-left">
          <Gauge size={16} color="var(--accent)" />
          <span>Fair-Value Check</span>
          <span className="fvc-ticker">{ticker}</span>
        </div>
        {onClose && (
          <button className="fvc-close" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        )}
      </div>

      {loading && (
        <div className="fvc-body">
          <div className="skeleton" style={{ height: 64, marginBottom: 10 }} />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line" />
        </div>
      )}

      {error && <div className="fvc-body fvc-error">{error}</div>}

      {result && !loading && (
        <div className="fvc-body">
          <div className="fvc-verdict-row">
            <div>
              <div className="fvc-verdict" style={{ color: verdictColor[result.verdict] }}>
                {result.verdictLabel}
              </div>
              {result.gapPct !== null && (
                <div className="fvc-gap">
                  {result.gapPct >= 0 ? "▲" : "▼"}{" "}
                  {Math.abs(result.gapPct * 100).toFixed(0)}%{" "}
                  {result.gapPct >= 0 ? "below" : "above"} estimated fair value
                </div>
              )}
            </div>
            <div className="fvc-prices">
              <div className="fvc-price-block">
                <span className="fvc-price-label">Price</span>
                <span className="fvc-price-val">
                  {result.price ? `$${result.price.toFixed(2)}` : "—"}
                </span>
              </div>
              <div className="fvc-price-block">
                <span className="fvc-price-label">Fair value*</span>
                <span className="fvc-price-val" style={{ color: "var(--accent)" }}>
                  {result.fairValue ? `$${result.fairValue.toFixed(2)}` : "—"}
                </span>
              </div>
            </div>
          </div>

          {result.signals.length > 0 && (
            <ul className="fvc-signals">
              {result.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          )}

          <div className="fvc-actions">
            <button
              className="btn-save"
              onClick={() => router.push(`/report/${ticker}`)}
            >
              <FileText size={14} /> Read the full AI memo →
            </button>
            <button
              className="export-btn"
              onClick={() => router.push(`/intel/${ticker}`)}
            >
              Open AI Intelligence →
            </button>
            <button
              className="export-btn"
              onClick={() => router.push(`/valuation?ticker=${ticker}`)}
            >
              Build your own valuation
            </button>
          </div>

          {/* Post-verdict conversion: low-commitment tripwire vs the annual plan. */}
          {!hasDeepDive(ticker) && (
            <div className="fvc-unlock">
              <div className="fvc-unlock-head">
                <Lock size={13} color="var(--accent)" />
                Unlock the full deep-dive for {ticker} — memo, 5-year model, charts &amp; export
              </div>
              <div className="fvc-unlock-cta">
                <button className="mkt-btn mkt-btn-ghost" onClick={() => guardTripwire(ticker)}>
                  ${TRIPWIRE.price} this ticker
                </button>
                <button
                  className="mkt-btn mkt-btn-primary"
                  onClick={() => {
                    setCurrentTicker(ticker);
                    openUpgrade(
                      `Unlock everything for ${ticker} — and every ticker — with the annual plan.`,
                      "basic"
                    );
                  }}
                >
                  ${introPriceFor("basic")}/yr unlock everything <ArrowRight size={13} />
                </button>
              </div>
            </div>
          )}

          <p className="fvc-disclaimer">
            *An informational estimate{result.basis ? ` based on the ${result.basis}` : ""} and
            fundamentals — not a price target or investment advice. Do your own research.
          </p>
        </div>
      )}
    </div>
  );
}
