"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Activity } from "lucide-react";
import { useAppStore, useUserStore, useHistoryStore } from "@/lib/store";
import { useGate } from "@/lib/useGate";
import FairValueCheck from "@/components/app/FairValueCheck";
import RecentSearches from "@/components/app/RecentSearches";
import type { FairValueResult } from "@/lib/fairValue";

const SAMPLES = ["AAPL", "TSLA", "NVDA", "PLTR", "AMZN"];

function Dashboard() {
  const router = useRouter();
  const params = useSearchParams();
  const { setCurrentTicker, setSidebarOpen, openUpgrade } = useAppStore();
  const { isPro, isSignedUp, remainingChecks, remainingReports, guardQuota } = useGate();
  const recordCheck = useUserStore((s) => s.recordCheck);
  const addHistory = useHistoryStore((s) => s.add);

  const [activeCheck, setActiveCheck] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const handled = useRef<string>("");

  useEffect(() => {
    setMounted(true);
    setCurrentTicker(null);
    setSidebarOpen(false);
  }, [setCurrentTicker, setSidebarOpen]);

  // Handle deep-links from the marketing site: ?check=TICKER and ?upgrade=1
  useEffect(() => {
    const key = params.toString();
    if (handled.current === key) return;
    handled.current = key;

    if (params.get("upgrade") === "1") {
      openUpgrade();
      router.replace("/app");
      return;
    }
    const check = params.get("check");
    if (check) {
      const ticker = check.toUpperCase();
      router.replace("/app");
      // Gate the free check (signup if anonymous, paywall if over quota).
      guardQuota("checks", () => setActiveCheck(ticker));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const runCheck = (ticker: string) =>
    guardQuota("checks", () => setActiveCheck(ticker.toUpperCase()));

  const onCheckComplete = (r: FairValueResult) => {
    recordCheck();
    addHistory({ ticker: r.ticker, name: r.name, kind: "check" });
  };

  return (
    <main className="main-content">
      <div className="welcome-state">
        <div className="welcome-hero">
          <div className="welcome-icon">
            <Activity size={32} color="var(--accent)" />
          </div>
          <h1 className="welcome-title">
            Apex<span className="title-accent">Alpha</span>
          </h1>
          <p className="welcome-subtitle">
            Type a ticker for an instant fair-value check, then read the full
            hedge-fund-grade AI memo. Research &amp; education — you make the call.
          </p>

          {mounted && isSignedUp && !isPro && (
            <div className="usage-meter">
              <span>
                <b>{remainingReports}</b> report{remainingReports === 1 ? "" : "s"} left
              </span>
              <span className="usage-sep" />
              <span>
                <b>{remainingChecks}</b> check{remainingChecks === 1 ? "" : "s"} left this month
              </span>
              <span className="usage-sep" />
              <button
                onClick={() => openUpgrade()}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 700, cursor: "pointer" }}
              >
                Upgrade
              </button>
            </div>
          )}
          {mounted && isPro && (
            <div className="usage-meter">
              <span style={{ color: "var(--green)" }}>● Pro — unlimited reports &amp; checks</span>
            </div>
          )}
        </div>

        {activeCheck && (
          <FairValueCheck
            ticker={activeCheck}
            onComplete={onCheckComplete}
            onClose={() => setActiveCheck(null)}
          />
        )}

        <div className="welcome-tickers">
          <div className="welcome-label">Run a quick check</div>
          <div className="sample-tickers">
            {SAMPLES.map((t) => (
              <button key={t} className="sample-ticker" onClick={() => runCheck(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <RecentSearches />

        <div className="welcome-sections-card">
          <div className="wsc-header">Every AI memo includes</div>
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<main className="main-content" />}>
      <Dashboard />
    </Suspense>
  );
}
