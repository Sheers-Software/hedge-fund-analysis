"use client";

import { useEffect, useState } from "react";
import { useUserStore, useAppStore } from "@/lib/store";
import {
  TIERS,
  PAID_TIERS,
  TRIPWIRE,
  CATEGORY_ANCHORS,
  PREMIUM_EXPANSION_DELTA,
  type Tier,
} from "@/lib/tiers";
import { startSubscriptionCheckout, startTripwireCheckout } from "@/lib/checkout";
import { Check, Zap, Crown, ShieldCheck } from "lucide-react";

// The paywall. Triggered when a user hits a tier-locked feature or quota.
// Leads with the low-commitment $7 tripwire (for the current ticker), then the
// annual ladder: $99 intro struck through from the renewal price, a category
// anchor vs the incumbents, a Premium order-bump, and a money-back guarantee.
export default function UpgradeModal() {
  const { isUpgradeOpen, upgradeReason, upgradeTier, closeUpgrade } = useAppStore();
  const currentTicker = useAppStore((s) => s.currentTicker);
  const email = useUserStore((s) => s.email);
  const currentTier = useUserStore((s) => s.tier);
  const hasDeepDive = useUserStore((s) => s.hasDeepDive);

  // Order-bump: add the Premium AI Intelligence desk to the Basic annual plan.
  const [addPremium, setAddPremium] = useState(false);
  useEffect(() => {
    if (isUpgradeOpen) setAddPremium(false);
  }, [isUpgradeOpen]);

  // Which tier to spotlight: the gate's target, else the core annual plan.
  const target: Tier = upgradeTier ?? "basic";
  const tripwireTicker = currentTicker?.toUpperCase() || null;
  const showTripwire = !!tripwireTicker && !hasDeepDive(tripwireTicker);

  const buyPlan = (tier: Exclude<Tier, "free">) => {
    const bump = tier === "basic" && addPremium;
    const redirected = startSubscriptionCheckout(tier, { bump });
    if (!redirected) closeUpgrade(); // optimistic (no Stripe link in dev)
  };

  const buyTripwire = () => {
    if (!tripwireTicker) return;
    const redirected = startTripwireCheckout(tripwireTicker);
    if (!redirected) closeUpgrade();
  };

  return (
    <div className={`modal-overlay ${isUpgradeOpen ? "open" : ""}`} onClick={closeUpgrade}>
      <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap size={18} color="var(--accent)" />
            <span className="modal-title">Unlock the full toolkit</span>
          </div>
          <button className="modal-close-btn" onClick={closeUpgrade}>✕</button>
        </div>

        <p className="modal-subtitle">
          {upgradeReason || "One good decision avoided pays for years. Go annual — or start with a single deep-dive."}
        </p>

        {/* Low-commitment tripwire for the ticker in context */}
        {showTripwire && (
          <div className="upg-tripwire">
            <div>
              <div className="upg-tripwire-title">Just need {tripwireTicker} right now?</div>
              <div className="upg-tripwire-sub">
                {TRIPWIRE.tagline}
              </div>
            </div>
            <button className="mkt-btn mkt-btn-ghost" onClick={buyTripwire}>
              ${TRIPWIRE.price} deep-dive →
            </button>
          </div>
        )}

        <div className="upg-grid">
          {PAID_TIERS.map((id) => {
            const t = TIERS[id];
            const isTarget = id === target;
            const owned = currentTier === id;
            const bumpActive = id === "basic" && addPremium;
            return (
              <div key={id} className={`upg-card ${isTarget ? "upg-card-target" : ""}`}>
                {isTarget && <div className="upg-card-flag">Recommended</div>}
                <div className="upg-card-name">
                  {id === "premium" && <Crown size={14} color="var(--amber)" />}
                  {t.name}
                </div>
                <div className="upg-card-price">
                  <span className="upg-strike">${t.renewalPrice}</span>
                  <span className="upg-amount">${t.introPrice}</span>
                  <span className="upg-period">/ first year</span>
                </div>
                <div className="upg-renew">Renews at ${t.renewalPrice}/yr · cancel anytime</div>
                <p className="upg-tagline">{t.tagline}</p>

                {/* Premium order-bump on the Basic plan */}
                {id === "basic" && !owned && (
                  <label className="upg-bump">
                    <input
                      type="checkbox"
                      checked={addPremium}
                      onChange={(e) => setAddPremium(e.target.checked)}
                    />
                    <span>
                      <b>＋ Add the AI Intelligence desk</b> — multi-model outlook, technicals &amp;
                      insider flow. Just +${PREMIUM_EXPANSION_DELTA}/yr.
                    </span>
                  </label>
                )}

                <button
                  className={`mkt-btn ${isTarget ? "mkt-btn-primary" : "mkt-btn-ghost"} mkt-btn-block`}
                  onClick={() => buyPlan(id)}
                  disabled={owned}
                >
                  {owned
                    ? "Current plan"
                    : bumpActive
                      ? `Get Basic + Premium — $${TIERS.premium.introPrice} first year`
                      : `Get ${t.name} — $${t.introPrice} first year`}
                </button>
                <ul className="upg-features">
                  {t.features.map((f) => (
                    <li key={f}>
                      <Check size={14} color={isTarget ? "var(--green)" : "var(--t2)"} style={{ flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Category anchor — what the incumbents charge */}
        <div className="upg-anchor">
          {CATEGORY_ANCHORS.map((a) => `${a.name} $${a.price}/yr`).join(" · ")} — same category, a fraction of the price.
        </div>

        {/* Money-back guarantee (allowed — distinct from a performance guarantee) */}
        <div className="upg-guarantee">
          <ShieldCheck size={15} color="var(--green)" />
          30-day money-back guarantee — full refund, no questions asked.
        </div>

        <p className="modal-subtitle mt-3 mb-0" style={{ textAlign: "center", fontSize: ".7rem" }}>
          Research &amp; educational tool. Not investment advice.
        </p>
      </div>
    </div>
  );
}
