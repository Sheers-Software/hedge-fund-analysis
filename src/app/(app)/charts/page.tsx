"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ChartsView from "@/components/charts/ChartsView";
import { BarChart3 } from "lucide-react";
import { useAppStore, useHistoryStore } from "@/lib/store";
import ProGate from "@/components/app/ProGate";

function ChartsContent() {
  const searchParams = useSearchParams();
  const tickerQuery = searchParams.get("ticker");
  const [ticker, setTicker] = useState(tickerQuery || "");
  const router = useRouter();
  const { setSidebarOpen } = useAppStore();

  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    if (tickerQuery) {
      const t = tickerQuery.toUpperCase();
      setTicker(t);
      useHistoryStore.getState().add({ ticker: t, kind: "charts" });
    }
  }, [tickerQuery]);

  const handleSample = (t: string) => router.push(`/charts?ticker=${t}`);

  if (!ticker) {
    return (
      <main className="val-main">
        <div className="val-empty">
          <div className="val-empty-icon">
            <BarChart3 size={32} color="#3b82f6" />
          </div>
          <h1 className="val-empty-title">Historical Charts</h1>
          <p className="val-empty-sub">
            Visualize quarterly EPS, free cash flow, and margins over the last several years,
            with a 4-quarter forward projection. Search a ticker to begin.
          </p>
          <div className="val-empty-tickers">
            <p className="welcome-label">Quick access</p>
            <div className="sample-tickers">
              {["META", "AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "PLTR", "TSLA"].map((t) => (
                <button key={t} className="sample-ticker" onClick={() => handleSample(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="val-main">
      <div className="charts-header">
        <span className="charts-ticker-badge">{ticker}</span>
        <span className="charts-header-label">Historical Quarterly Charts</span>
      </div>
      <ProGate
        feature="chartsFull"
        title="Full charts + forward projections are a Pro feature"
        sub="See multi-year quarterly EPS, margins, and free cash flow with a 4-quarter forward projection. Included with Pro — $9/mo."
        reason="Quarterly history charts and forward projections are included with Pro."
      >
        <ChartsView ticker={ticker} />
      </ProGate>
    </main>
  );
}

export default function ChartsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
      <ChartsContent />
    </Suspense>
  );
}
