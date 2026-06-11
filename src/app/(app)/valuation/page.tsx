"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ValuationCalculator from "@/components/valuation/ValuationCalculator";
import { Activity } from "lucide-react";
import { useAppStore, useHistoryStore } from "@/lib/store";
import ProGate from "@/components/app/ProGate";

function ValuationContent() {
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
      useHistoryStore.getState().add({ ticker: t, kind: "valuation" });
    }
  }, [tickerQuery]);

  const handleSample = (t: string) => {
    router.push(`/valuation?ticker=${t}`);
  };

  if (!ticker) {
    return (
      <main className="val-main">
        <div className="val-empty">
          <div className="val-empty-icon">
            <Activity size={32} color="#3b82f6" />
          </div>
          <h1 className="val-empty-title">Stock Valuation Calculator</h1>
          <p className="val-empty-sub">
            Search for any stock to build multi-year Bull, Base and Bear case price target models. 
            All projections update in real-time.
          </p>
          <div className="val-empty-tickers">
            <p className="welcome-label">Quick access</p>
            <div className="sample-tickers">
              {["AAPL", "NVDA", "MSFT", "META", "GOOGL", "TSLA", "NOW", "CRM"].map((t) => (
                <button key={t} className="sample-ticker" onClick={() => handleSample(t)}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="val-main">
      <ProGate
        feature="valuationFull"
        title="The full 5-year valuation model is a Pro feature"
        sub="Set Bull / Base / Bear assumptions, auto-fill fundamentals, and get a fair-value estimate you control. Unlimited with Pro — $9/mo."
        reason="The interactive 5-year valuation model (Bull / Base / Bear) is included with Pro."
      >
        <ValuationCalculator ticker={ticker} />
      </ProGate>
      <div className="val-disclaimer mt-8">
        ⚠ This tool is for educational purposes only. Projections are hypothetical and do not constitute financial advice.
      </div>
    </main>
  );
}

export default function ValuationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ValuationContent />
    </Suspense>
  );
}
