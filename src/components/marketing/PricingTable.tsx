"use client";

import { useRouter } from "next/navigation";
import { Check, Crown } from "lucide-react";
import { TIERS, TIER_ORDER, renewalPriceForCell, type Tier } from "@/lib/tiers";
import { useAppStore } from "@/lib/store";
import { startSubscriptionCheckout } from "@/lib/checkout";
import { useWtpCell } from "@/lib/experiment";

// Annual ladder pricing table (free → annual Basic/Premium) + trust row.
const FEATURED: Tier = "premium";

export default function PricingTable() {
  const router = useRouter();
  const openSignup = useAppStore((s) => s.openSignup);
  const cell = useWtpCell();

  const startFree = () =>
    openSignup("Create your free account — your first verdict is on us, no card required.");

  const goPaid = (tier: Exclude<Tier, "free">) => {
    // Returns to /app after Stripe. With no link configured (dev) the purchase
    // applies optimistically, so just land them in the app.
    const redirected = startSubscriptionCheckout(tier, { returnTo: "/app?upgraded=1" });
    if (!redirected) router.push("/app");
  };

  return (
    <>
    <div className="mkt-pricing">
      {TIER_ORDER.map((id) => {
        const t = TIERS[id];
        const featured = id === FEATURED;
        const renewal = renewalPriceForCell(id, cell);
        return (
          <div key={id} className={`mkt-plan ${featured ? "mkt-plan-featured" : ""}`}>
            {featured && <div className="mkt-plan-badge">Flagship</div>}
            <div className="mkt-plan-name">
              {id === "premium" && <Crown size={15} color="var(--amber)" style={{ display: "inline", marginRight: 6, verticalAlign: "-2px" }} />}
              {t.name}
            </div>
            <div className="mkt-plan-price">
              {id === "free" ? (
                <>
                  <span className="mkt-plan-amount">$0</span>
                  <span className="mkt-plan-period">forever</span>
                </>
              ) : (
                <>
                  <span className="mkt-plan-strike">${renewal}</span>
                  <span className="mkt-plan-amount">${t.introPrice}</span>
                  <span className="mkt-plan-period">first year</span>
                </>
              )}
            </div>
            {id !== "free" && (
              <div className="mkt-plan-renew">Renews at ${renewal}/yr · cancel anytime</div>
            )}
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
                Get {t.name} — ${t.introPrice} first year
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
    <div className="mkt-pricing-guarantee">
      <span>🛡 30-day money-back guarantee — full refund, no questions asked.</span>
      <span>vs Seeking Alpha $299/yr · Motley Fool $199/yr</span>
    </div>
    </>
  );
}
