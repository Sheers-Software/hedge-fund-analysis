"use client";

import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { TIERS, TIER_ORDER, stripeLinkFor, priceFor, type Tier } from "@/lib/tiers";
import { useAppStore } from "@/lib/store";
import { trackInitiateCheckout } from "@/lib/analytics";

const FEATURED: Tier = "premium";

export default function PricingTable() {
  const router = useRouter();
  const openSignup = useAppStore((s) => s.openSignup);

  const startFree = () =>
    openSignup("Create your free account — 1 full report + 3 fair-value checks every month.");

  const goPaid = (tier: Exclude<Tier, "free">) => {
    trackInitiateCheckout(priceFor(tier));
    const link = stripeLinkFor(tier);
    if (link) {
      try { localStorage.setItem("apex-alpha-pending-tier", tier); } catch {}
      const url = new URL(link);
      const ret = `${window.location.origin}/app?upgraded=1`;
      url.searchParams.set("redirect", ret);
      window.location.href = url.toString();
    } else {
      router.push("/app?upgrade=1");
    }
  };

  return (
    <div className="mkt-pricing">
      {TIER_ORDER.map((id) => {
        const t = TIERS[id];
        const featured = id === FEATURED;
        return (
          <div key={id} className={`mkt-plan ${featured ? "mkt-plan-featured" : ""}`}>
            {featured && <div className="mkt-plan-badge">Flagship</div>}
            <div className="mkt-plan-name">
              {id === "premium" && <Crown size={15} color="var(--amber)" style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />}
              {t.name}
            </div>
            <div className="mkt-plan-price">
              <span className="mkt-plan-amount">${t.priceMonthly}</span>
              <span className="mkt-plan-period">{id === "free" ? "forever" : "/ month"}</span>
            </div>
            <p className="mkt-plan-tagline">{t.tagline}</p>
            {id === "free" ? (
              <button className="mkt-btn mkt-btn-ghost mkt-btn-block" onClick={startFree}>
                Start free
              </button>
            ) : (
              <button
                className={`mkt-btn ${featured ? "mkt-btn-primary" : "mkt-btn-ghost"} mkt-btn-block`}
                onClick={() => goPaid(id as Exclude<Tier, "free">)}
              >
                Get {t.name} — ${t.priceMonthly}/mo
              </button>
            )}
            <ul className="mkt-plan-features">
              {t.features.map((f) => (
                <li key={f}>
                  <Check size={15} color={featured ? "var(--green)" : "var(--t2)"} /> {f}
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
