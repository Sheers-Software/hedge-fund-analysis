"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { useGate } from "@/lib/useGate";

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
  children,
}: {
  feature: "valuationFull" | "chartsFull" | "exportEnabled";
  title: string;
  sub: string;
  reason: string;
  children: React.ReactNode;
}) {
  const { limits, guardPro } = useGate();

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

  if (limits[feature]) return <>{children}</>;

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
        <button className="mkt-btn mkt-btn-primary" onClick={() => guardPro(feature, reason)}>
          Unlock with Pro →
        </button>
      </div>
    </div>
  );
}
