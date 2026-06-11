import Link from "next/link";
import type { Metadata } from "next";
import {
  FileText,
  Calculator,
  LineChart,
  Gauge,
  Newspaper,
  Download,
  Clock,
  DollarSign,
  ArrowRight,
} from "lucide-react";
import LandingHero from "@/components/marketing/LandingHero";
import PricingTable from "@/components/marketing/PricingTable";

export const metadata: Metadata = {
  title: "Hedge-fund-grade stock research for the price of a coffee",
  description:
    "Type a ticker, get an instant fair-value check + a full AI investment memo + a 5-year valuation model. Free to start, $9/mo for unlimited. Research & education tool — not investment advice.",
};

const STEPS = [
  {
    n: "01",
    title: "Type a ticker",
    body: "NVDA, your watchlist, the stock your group chat won't shut up about. One box.",
  },
  {
    n: "02",
    title: "Read the analysis",
    body: "A hedge-fund-style memo streams in live — thesis, moat, financial quality, and an investment judgment — next to a fair-value estimate.",
  },
  {
    n: "03",
    title: "Make your call",
    body: "Set Bull / Base / Bear assumptions, export the report to PDF, and decide with conviction. You own the conclusion.",
  },
];

const FEATURES = [
  {
    icon: Gauge,
    title: "Fair-value check",
    body: "A fast verdict on whether a stock looks over- or undervalued, on live data.",
  },
  {
    icon: FileText,
    title: "AI investment memo",
    body: "Executive summary, core thesis, business model, competitive position, financial quality, and a final judgment — written the way analysts frame it.",
  },
  {
    icon: Calculator,
    title: "5-year valuation model",
    body: "Interactive Bull / Base / Bear scenarios with CAGR and auto-filled fundamentals → a fair-value estimate you control.",
  },
  {
    icon: LineChart,
    title: "Charts + projections",
    body: "Quarterly history and 4-quarter forward projections for EPS, margins, and free cash flow.",
  },
  {
    icon: Newspaper,
    title: "Real-time context",
    body: "Live fundamentals, quotes, and the latest news — not stale snapshots.",
  },
  {
    icon: Download,
    title: "PDF export",
    body: "Turn any report into a clean, branded PDF to save or share.",
  },
];

const FAQ = [
  {
    q: "Can't I get this free on Yahoo Finance?",
    a: "Yahoo gives you numbers. ApexAlpha gives you the analysis — a written thesis, a competitive read, and a valuation model built around those numbers.",
  },
  {
    q: "Is this just ChatGPT with a wrapper?",
    a: "No. It's structured, institutional-style research wired to live fundamentals and a real valuation model — not a blank chat box. Every memo follows the same sections a hedge-fund analyst writes.",
  },
  {
    q: "$9 — what's the catch?",
    a: "No catch. The free plan gives you a full report and fair-value checks every month so you can judge the quality yourself before you ever pay.",
  },
  {
    q: "Will it tell me what to buy?",
    a: "No — and that's the point. ApexAlpha is a research and education tool. It hands you the analysis so you make the call.",
  },
];

export default function LandingPage() {
  return (
    <>
      <LandingHero />

      {/* CONTRAST — the old way vs ApexAlpha */}
      <section className="mkt-section mkt-contrast">
        <div className="mkt-contrast-col mkt-contrast-old">
          <div className="mkt-contrast-tag">The old way</div>
          <ul>
            <li>
              <Clock size={16} /> A weekend lost in spreadsheets
            </li>
            <li>
              <DollarSign size={16} /> $24,000/yr for a Bloomberg terminal
            </li>
            <li>Guessing whether a stock is actually worth it</li>
          </ul>
        </div>
        <div className="mkt-contrast-arrow">
          <ArrowRight size={22} />
        </div>
        <div className="mkt-contrast-col mkt-contrast-new">
          <div className="mkt-contrast-tag mkt-contrast-tag-new">With ApexAlpha</div>
          <ul>
            <li>
              <Clock size={16} /> A full institutional-style memo in minutes
            </li>
            <li>
              <DollarSign size={16} /> $9/month — the price of a coffee
            </li>
            <li>A fair-value estimate you can actually defend</li>
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mkt-section">
        <h2 className="mkt-section-title">From ticker to thesis in three steps</h2>
        <div className="mkt-steps">
          {STEPS.map((s) => (
            <div key={s.n} className="mkt-step">
              <div className="mkt-step-num">{s.n}</div>
              <div className="mkt-step-title">{s.title}</div>
              <p className="mkt-step-body">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mkt-section">
        <h2 className="mkt-section-title">Everything a serious analysis needs</h2>
        <p className="mkt-section-sub">
          The same analytical framework institutions use — packaged for a retail screen.
        </p>
        <div className="mkt-features">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="mkt-feature">
                <div className="mkt-feature-icon">
                  <Icon size={20} color="var(--accent)" />
                </div>
                <div className="mkt-feature-title">{f.title}</div>
                <p className="mkt-feature-body">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PRICING */}
      <section className="mkt-section" id="pricing">
        <h2 className="mkt-section-title">Start free. Upgrade when it pays for itself.</h2>
        <p className="mkt-section-sub">
          One good decision avoided pays for years of Pro. No card required to start.
        </p>
        <PricingTable />
      </section>

      {/* FAQ */}
      <section className="mkt-section">
        <h2 className="mkt-section-title">Straight answers</h2>
        <div className="mkt-faq">
          {FAQ.map((f) => (
            <div key={f.q} className="mkt-faq-item">
              <div className="mkt-faq-q">{f.q}</div>
              <p className="mkt-faq-a">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mkt-section mkt-cta-band">
        <h2 className="mkt-cta-title">
          Stop guessing what a stock is worth.
        </h2>
        <p className="mkt-cta-sub">
          Run your first ticker free — see the memo, the model, and the verdict in minutes.
        </p>
        <Link href="/app" className="mkt-btn mkt-btn-primary mkt-btn-lg">
          Get started free <ArrowRight size={16} />
        </Link>
      </section>
    </>
  );
}
