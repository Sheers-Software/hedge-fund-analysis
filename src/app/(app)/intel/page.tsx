"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrainCircuit, Crown, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useGate } from "@/lib/useGate";
import { startExpansionCheckout } from "@/lib/checkout";
import { PREMIUM_EXPANSION_DELTA } from "@/lib/tiers";

export default function IntelLandingPage() {
  const router = useRouter();
  const { setSidebarOpen, setCurrentTicker } = useAppStore();
  const { isBasic } = useGate();

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

        {/* ⑤ Expansion touchpoint — Basic subscribers add the desk as an annual upgrade. */}
        {isBasic && (
          <div className="intel-upsell">
            <div className="intel-upsell-head">
              <Crown size={15} color="var(--amber)" /> Add the AI Intelligence desk to your plan
            </div>
            <p className="intel-upsell-sub">
              You&apos;re on Basic. Unlock the full Intelligence terminal for every ticker — just
              +${PREMIUM_EXPANSION_DELTA}/yr on your annual plan.
            </p>
            <button
              className="mkt-btn mkt-btn-primary"
              onClick={() => startExpansionCheckout({ returnTo: "/intel?upgraded=1" })}
            >
              Add AI Intelligence — +${PREMIUM_EXPANSION_DELTA}/yr <ArrowRight size={14} />
            </button>
          </div>
        )}

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
