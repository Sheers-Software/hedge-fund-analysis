"use client";

import { useAppStore } from "@/lib/store";
import { Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const router = useRouter();
  const { setCurrentTicker, setSidebarOpen } = useAppStore();

  useEffect(() => {
    setCurrentTicker(null);
    setSidebarOpen(false);
  }, []);

  const handleSample = (ticker: string) => {
    router.push(`/report/${ticker}`);
  };

  return (
    <main className="main-content">
      <div className="welcome-state">
        <div className="welcome-hero">
          <div className="welcome-icon">
            <Activity size={32} color="var(--accent)" />
          </div>
          <h1 className="welcome-title">Apex<span className="title-accent">Alpha</span></h1>
          <p className="welcome-subtitle">
            Institutional-grade equity research generation powered by Gemini.
            Search a ticker or select a sample below to begin.
          </p>
        </div>

        <div className="welcome-tickers">
          <div className="welcome-label">Try a sample</div>
          <div className="sample-tickers">
            {["AAPL", "TSLA", "PLTR", "SNOW", "ARM"].map((t) => (
              <button key={t} className="sample-ticker" onClick={() => handleSample(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="welcome-sections-card">
          <div className="wsc-header">Report Sections Generated</div>
          <div className="wsc-grid">
            {[
              "Executive Summary",
              "Core Thesis",
              "Business Model",
              "Industry Structure",
              "Competitive Position",
              "Management & Capital",
              "Financial Quality",
              "Investment Judgment",
            ].map((s, i) => (
              <div key={i} className="wsc-item">
                <span className="wsc-num">0{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
