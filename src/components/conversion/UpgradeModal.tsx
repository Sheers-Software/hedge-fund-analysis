"use client";

import { useUserStore, useAppStore } from "@/lib/store";
import { TIERS, PRO_PRICE, STRIPE_PAYMENT_LINK } from "@/lib/tiers";
import { trackInitiateCheckout } from "@/lib/analytics";
import { Check, Zap } from "lucide-react";

// The paywall. Triggered whenever a free user hits a Pro-only feature or a
// quota limit. CTA points at a Stripe Payment Link (validation-MVP billing).
export default function UpgradeModal() {
  const { isUpgradeOpen, upgradeReason, closeUpgrade } = useAppStore();
  const upgrade = useUserStore((s) => s.upgrade);
  const email = useUserStore((s) => s.email);

  const startCheckout = () => {
    trackInitiateCheckout(PRO_PRICE);
    if (STRIPE_PAYMENT_LINK) {
      // Prefill + tag the return so we can flip the tier on come-back.
      const url = new URL(STRIPE_PAYMENT_LINK);
      if (email) url.searchParams.set("prefilled_email", email);
      const ret = `${window.location.origin}${window.location.pathname}?upgraded=1`;
      url.searchParams.set("redirect", ret);
      window.location.href = url.toString();
    } else {
      // No payment link configured yet (e.g. local/dev) — optimistically
      // unlock so the funnel is fully testable end-to-end.
      upgrade();
      closeUpgrade();
    }
  };

  return (
    <div className={`modal-overlay ${isUpgradeOpen ? "open" : ""}`} onClick={closeUpgrade}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Zap size={18} color="var(--accent)" />
            <span className="modal-title">Upgrade to Pro</span>
          </div>
          <button className="modal-close-btn" onClick={closeUpgrade}>
            ✕
          </button>
        </div>

        <p className="modal-subtitle">
          {upgradeReason ||
            "You've reached the limits of the free plan. Unlock the full toolkit."}
        </p>

        <div
          className="flex items-baseline gap-2 mb-4"
          style={{ paddingBottom: 14, borderBottom: "1px solid var(--border)" }}
        >
          <span style={{ fontSize: "2.2rem", fontWeight: 800, letterSpacing: "-.02em" }}>
            ${PRO_PRICE}
          </span>
          <span style={{ color: "var(--t3)", fontSize: ".85rem" }}>/ month</span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: ".7rem",
              color: "var(--green)",
              background: "rgba(16,185,129,.12)",
              border: "1px solid rgba(16,185,129,.25)",
              borderRadius: 4,
              padding: "3px 8px",
              fontWeight: 700,
            }}
          >
            Cancel anytime
          </span>
        </div>

        <ul className="flex flex-col gap-2 mb-5" style={{ listStyle: "none" }}>
          {TIERS.pro.features.map((f) => (
            <li key={f} className="flex items-center gap-2" style={{ fontSize: ".85rem", color: "var(--t1)" }}>
              <Check size={15} color="var(--green)" style={{ flexShrink: 0 }} />
              {f}
            </li>
          ))}
        </ul>

        <button className="btn-save" style={{ width: "100%" }} onClick={startCheckout}>
          Upgrade for ${PRO_PRICE}/mo →
        </button>

        <p className="modal-subtitle mt-3 mb-0" style={{ textAlign: "center", fontSize: ".7rem" }}>
          Research & educational tool. Not investment advice.
        </p>
      </div>
    </div>
  );
}
