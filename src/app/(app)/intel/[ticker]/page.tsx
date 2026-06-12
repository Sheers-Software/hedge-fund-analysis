"use client";

import { use, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import IntelDashboard from "@/components/intel/IntelDashboard";
import ProGate from "@/components/app/ProGate";

export default function IntelPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker: encoded } = use(params);
  const ticker = decodeURIComponent(encoded).toUpperCase();
  const { setCurrentTicker, setSidebarOpen } = useAppStore();

  useEffect(() => {
    setCurrentTicker(ticker);
    setSidebarOpen(false);
  }, [ticker, setCurrentTicker, setSidebarOpen]);

  return (
    <main className="val-main intel-main">
      <ProGate
        feature="intelFull"
        title="The AI Intelligence terminal is a Premium feature"
        sub="Multi-model price outlook, AI technical & fundamental reads, support/resistance, insider transactors, and quarterly financials — one screen. Included with Premium, $19/mo."
        reason="The AI Intelligence terminal is included with Premium."
      >
        <IntelDashboard ticker={ticker} />
      </ProGate>
    </main>
  );
}
