"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { TIERS, PRO_PRICE, STRIPE_PAYMENT_LINK } from "@/lib/tiers";
import { useAppStore } from "@/lib/store";
import { trackInitiateCheckout } from "@/lib/analytics";

export default function PricingTable() {
  const router = useRouter();
  const openSignup = useAppStore((s) => s.openSignup);

  const startFree = () =>
    openSignup("Create your free account — 1 full report + 3 fair-value checks every month.");

  const goPro = () => {
    trackInitiateCheckout(PRO_PRICE);
    if (STRIPE_PAYMENT_LINK) {
      const url = new URL(STRIPE_PAYMENT_LINK);
      const ret = `${window.location.origin}/app?upgraded=1`;
      url.searchParams.set("redirect", ret);
      window.location.href = url.toString();
    } else {
      router.push("/app?upgrade=1");
    }
  };

  return (
    <div className="mkt-pricing">
      {/* FREE */}
      <div className="mkt-plan">
        <div className="mkt-plan-name">{TIERS.free.name}</div>
        <div className="mkt-plan-price">
          <span className="mkt-plan-amount">$0</span>
          <span className="mkt-plan-period">forever</span>
        </div>
        <p className="mkt-plan-tagline">{TIERS.free.tagline}</p>
        <button className="mkt-btn mkt-btn-ghost mkt-btn-block" onClick={startFree}>
          Start free
        </button>
        <ul className="mkt-plan-features">
          {TIERS.free.features.map((f) => (
            <li key={f}>
              <Check size={15} color="var(--t2)" /> {f}
            </li>
          ))}
        </ul>
      </div>

      {/* PRO */}
      <div className="mkt-plan mkt-plan-featured">
        <div className="mkt-plan-badge">Most popular</div>
        <div className="mkt-plan-name">{TIERS.pro.name}</div>
        <div className="mkt-plan-price">
          <span className="mkt-plan-amount">${PRO_PRICE}</span>
          <span className="mkt-plan-period">/ month</span>
        </div>
        <p className="mkt-plan-tagline">{TIERS.pro.tagline}</p>
        <button className="mkt-btn mkt-btn-primary mkt-btn-block" onClick={goPro}>
          Get Pro — ${PRO_PRICE}/mo
        </button>
        <ul className="mkt-plan-features">
          {TIERS.pro.features.map((f) => (
            <li key={f}>
              <Check size={15} color="var(--green)" /> {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
