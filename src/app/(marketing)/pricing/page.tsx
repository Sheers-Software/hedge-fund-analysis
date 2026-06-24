import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import PricingTable from "@/components/marketing/PricingTable";
import { ANNUAL_INTRO_PRICE } from "@/lib/tiers";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Your first fair-value verdict is free — no card. Then go annual: $99 for the first year (unlimited research, the full valuation model, charts, and PDF export), or add the AI Intelligence terminal with Premium. 30-day money-back guarantee.",
};

export default function PricingPage() {
  return (
    <section className="mkt-section mkt-pricing-page">
      <div className="mkt-eyebrow">Simple annual pricing</div>
      <h1 className="mkt-section-title" style={{ fontSize: "2.2rem" }}>
        Hedge-fund-grade research from ${ANNUAL_INTRO_PRICE} for the first year
      </h1>
      <p className="mkt-section-sub">
        Run your first verdict free — no card. Go annual only when ApexAlpha is
        already saving you hours. 30-day money-back guarantee, cancel anytime.
      </p>

      <PricingTable />

      <div className="mkt-pricing-note">
        <p>
          <strong>Why so cheap?</strong> A Bloomberg terminal runs ~$24,000/year.
          ApexAlpha gives you the analysis layer on top of live data for the price
          of a coffee — because good research shouldn&apos;t be locked behind a
          Wall Street paywall.
        </p>
        <p style={{ marginTop: 10 }}>
          ApexAlpha is a research &amp; educational tool, not investment advice.
        </p>
      </div>

      <div className="mkt-cta-band" style={{ marginTop: 32 }}>
        <h2 className="mkt-cta-title">Ready to see it?</h2>
        <p className="mkt-cta-sub">Run your first ticker free — no card required.</p>
        <Link href="/app" className="mkt-btn mkt-btn-primary mkt-btn-lg">
          Start free <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
