"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useGate } from "@/lib/useGate";
import { TIERS, requiredTierFor } from "@/lib/tiers";

/**
 * Wraps a Pro-only feature. Pro users see `children` normally; free users see
 * a blurred preview behind an upgrade overlay (the "teaser" gating from the
 * GTM tier model — they can see the quality, then pay to unlock it).
 */
export default function ProGate({
  feature,
  title,
  sub,
  reason,
  ticker,
  children,
}: {
  feature: "valuationFull" | "chartsFull" | "intelFull" | "exportEnabled";
  title: string;
  sub: string;
  reason: string;
  /** When set, a $7 deep-dive owner for this ticker sees the unlocked content. */
  ticker?: string;
  children: React.ReactNode;
}) {
  const { limits, guardPro, hasDeepDive } = useGate();
  const targetTier = TIERS[requiredTierFor(feature)].name;
  // The tripwire unlocks valuation/charts/export per ticker (not Intelligence).
  const deepDiveUnlocks = feature !== "intelFull" && !!ticker && hasDeepDive(ticker);

  // Deterministic pre-hydration render (persisted tier isn't known on the
  // server): show a stable blurred preview, then resolve gating after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) {
    return (
      <div className="lock-wrap">
        <div className="lock-blur" aria-hidden>
          {children}
        </div>
      </div>
    );
  }

  if (limits[feature] || deepDiveUnlocks) return <>{children}</>;

  return (
    <div className="lock-wrap">
      <div className="lock-blur" aria-hidden>
        {children}
      </div>
      <div className="lock-overlay">
        <div className="lock-icon">
          <Lock size={20} color="var(--accent)" />
        </div>
        <div className="lock-title">{title}</div>
        <div className="lock-sub">{sub}</div>
        <button className="mkt-btn mkt-btn-primary" onClick={() => guardPro(feature, reason, ticker)}>
          Unlock with {targetTier} →
        </button>
      </div>
    </div>
  );
}
