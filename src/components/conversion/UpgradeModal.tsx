"use client";

import { useUserStore, useAppStore } from "@/lib/store";
import { TIERS, PAID_TIERS, priceFor, stripeLinkFor, type Tier } from "@/lib/tiers";
import { trackInitiateCheckout } from "@/lib/analytics";
import { Check, Zap, Crown } from "lucide-react";

// The paywall. Triggered when a user hits a tier-locked feature or quota.
// Shows the paid tiers, highlights the one that unlocks what they tried to do,
// and routes each CTA to its own Stripe Payment Link (validation-MVP billing).
export default function UpgradeModal() {
  const { isUpgradeOpen, upgradeReason, upgradeTier, closeUpgrade } = useAppStore();
  const upgrade = useUserStore((s) => s.upgrade);
  const email = useUserStore((s) => s.email);
  const currentTier = useUserStore((s) => s.tier);

  // Which tier to spotlight: the gate's target, else the top tier.
  const target: Tier = upgradeTier ?? "premium";

  const startCheckout = (tier: Exclude<Tier, "free">) => {
    trackInitiateCheckout(priceFor(tier));
    const link = stripeLinkFor(tier);
    if (link) {
      // Remember which tier was purchased so the return handler flips correctly.
      try { localStorage.setItem("apex-alpha-pending-tier", tier); } catch {}
      const url = new URL(link);
      if (email) url.searchParams.set("prefilled_email", email);
      const ret = `${window.location.origin}${window.location.pathname}?upgraded=1`;
      url.searchParams.set("redirect", ret);
      window.location.href = url.toString();
    } else {
      // No payment link configured (local/dev) — optimistically unlock so the
      // funnel is fully testable end-to-end.
      upgrade(tier);
      closeUpgrade();
    }
  };

  return (
    <div className={`modal-overlay ${isUpgradeOpen ? "open" : ""}`} onClick={closeUpgrade}>
      <div className="modal-box modal-box-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap size={18} color="var(--accent)" />
            <span className="modal-title">Choose your plan</span>
          </div>
          <button className="modal-close-btn" onClick={closeUpgrade}>✕</button>
        </div>

        <p className="modal-subtitle">
          {upgradeReason || "Unlock the full toolkit. Cancel anytime."}
        </p>

        <div className="upg-grid">
          {PAID_TIERS.map((id) => {
            const t = TIERS[id];
            const isTarget = id === target;
            const owned = currentTier === id;
            return (
              <div key={id} className={`upg-card ${isTarget ? "upg-card-target" : ""}`}>
                {isTarget && <div className="upg-card-flag">Recommended</div>}
                <div className="upg-card-name">
                  {id === "premium" && <Crown size={14} color="var(--amber)" />}
                  {t.name}
                </div>
                <div className="upg-card-price">
                  <span className="upg-amount">${t.priceMonthly}</span>
                  <span className="upg-period">/ mo</span>
                </div>
                <p className="upg-tagline">{t.tagline}</p>
                <button
                  className={`mkt-btn ${isTarget ? "mkt-btn-primary" : "mkt-btn-ghost"} mkt-btn-block`}
                  onClick={() => startCheckout(id)}
                  disabled={owned}
                >
                  {owned ? "Current plan" : `Get ${t.name} — $${t.priceMonthly}/mo`}
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

        <p className="modal-subtitle mt-3 mb-0" style={{ textAlign: "center", fontSize: ".7rem" }}>
          Research &amp; educational tool. Not investment advice.
        </p>
      </div>
    </div>
  );
}
