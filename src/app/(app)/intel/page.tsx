"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import { useAppStore } from "@/lib/store";

export default function IntelLandingPage() {
  const router = useRouter();
  const { setSidebarOpen, setCurrentTicker } = useAppStore();

  useEffect(() => {
    setSidebarOpen(false);
    setCurrentTicker(null);
  }, [setSidebarOpen, setCurrentTicker]);

  return (
    <main className="val-main">
      <div className="val-empty">
        <div className="val-empty-icon">
          <BrainCircuit size={32} color="#10b981" />
        </div>
        <h1 className="val-empty-title">AI Intelligence Terminal</h1>
        <p className="val-empty-sub">
          A hedge-fund research desk on one screen: a multi-model price outlook, AI technical &amp;
          fundamental reads, support/resistance zones, insider transactors, and quarterly financials.
          Search a ticker to begin.
        </p>
        <div className="val-empty-tickers">
          <p className="welcome-label">Quick access</p>
          <div className="sample-tickers">
            {["NVDA", "AAPL", "TSLA", "PLTR", "META", "AMZN", "MSFT", "RDW"].map((t) => (
              <button key={t} className="sample-ticker" onClick={() => router.push(`/intel/${t}`)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
