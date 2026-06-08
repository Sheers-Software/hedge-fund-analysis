"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ValuationCalculator from "@/components/valuation/ValuationCalculator";
import { Activity } from "lucide-react";
import { useAppStore } from "@/lib/store";

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
    if (tickerQuery) setTicker(tickerQuery.toUpperCase());
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
      <ValuationCalculator ticker={ticker} />
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
