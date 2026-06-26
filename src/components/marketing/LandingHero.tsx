"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { trackViewContent, trackSearch } from "@/lib/analytics";

const SAMPLES = ["NVDA", "AAPL", "TSLA", "PLTR", "AMZN"];

export default function LandingHero() {
  const router = useRouter();
  const [ticker, setTicker] = useState("");

  useEffect(() => {
    trackViewContent("landing");
  }, []);

  const run = (raw: string) => {
    const t = raw.trim().toUpperCase();
    if (!t) return;
    trackSearch(t);
    // Hand off to the app, which runs the free ungated verdict for cold traffic
    // (no modal on the first check) — the account gate comes on the 2nd action.
    router.push(`/app?check=${encodeURIComponent(t)}`);
  };

  return (
    <section className="mkt-hero">
      <div className="mkt-eyebrow">Research &amp; education tool · You make the call</div>
      <h1 className="mkt-hero-title">
        Hedge-fund-grade stock research.
        <br />
        <span className="title-accent">For the price of a coffee.</span>
      </h1>
      <p className="mkt-hero-sub">
        Type any ticker and get an AI fair-value verdict in seconds — free, no
        card. Then go deeper with a full institutional-style memo and a 5-year
        valuation model, in minutes, not a weekend in spreadsheets.
      </p>

      <form
        className="mkt-hero-form"
        onSubmit={(e) => {
          e.preventDefault();
          run(ticker);
        }}
      >
        <div className="mkt-hero-input-wrap">
          <Search size={18} className="mkt-hero-input-icon" />
          <input
            className="mkt-hero-input"
            placeholder="Enter a ticker, e.g. NVDA"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            aria-label="Stock ticker"
          />
        </div>
        <button type="submit" className="mkt-btn mkt-btn-primary mkt-btn-lg">
          Check it free <ArrowRight size={16} />
        </button>
      </form>

      <div className="mkt-hero-samples">
        <span className="mkt-hero-samples-label">Try:</span>
        {SAMPLES.map((t) => (
          <button key={t} className="mkt-chip" onClick={() => run(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="mkt-hero-trust">
        <span>⚡ Live market data</span>
        <span>🧠 Memos by Google Gemini</span>
        <span>💳 First verdict free — no card</span>
        <span>🛡 30-day money-back guarantee</span>
      </div>
    </section>
  );
}
