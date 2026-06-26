"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarClock, AlertTriangle, X, ArrowRight } from "lucide-react";
import { useUserStore } from "@/lib/store";
import { useWtpCell } from "@/lib/experiment";
import { renewalPriceForCell, type Tier } from "@/lib/tiers";
import { startSubscriptionCheckout } from "@/lib/checkout";
import { trackRenewalPrompt } from "@/lib/analytics";

// ⑥ Retention surface (Step 4). Consumes the store's renewalStatus() to nudge
// subscribers before renewal — cutting involuntary churn to lift retention r,
// the lever the LTV:CAC ≥ 3:1 math depends on — and to win back lapsed
// customers. Shown only to signed-up paying users, dismissible per session, and
// fires a RenewalPrompt retargeting signal (CAPI-deduped) when it appears so
// Meta can build the renewal-nurture / win-back audiences.
export default function RenewalBanner() {
  const isSignedUp = useUserStore((s) => s.isSignedUp());
  const tier = useUserStore((s) => s.tier);
  const renewsAt = useUserStore((s) => s.renewsAt);
  const renewalStatus = useUserStore((s) => s.renewalStatus);
  const cell = useWtpCell();

  // Persisted tier/renewal isn't known on the server — resolve after mount to
  // avoid a hydration mismatch (same pattern as ProGate / AccountBadge).
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const firedFor = useRef<string | null>(null);

  useEffect(() => setMounted(true), []);

  const status = mounted ? renewalStatus() : "active";
  const isPaid = tier !== "free";
  const show =
    mounted && isSignedUp && isPaid && (status === "renewing-soon" || status === "lapsed");

  // Per-session dismissal (lapsed re-surfaces in a later session), scoped to the
  // current status so a state change re-shows the banner.
  const dismissKey = `apex-alpha-renewal-dismissed:${status}`;
  useEffect(() => {
    if (!show) return;
    try {
      setDismissed(sessionStorage.getItem(dismissKey) === "1");
    } catch {
      /* ignore */
    }
  }, [show, dismissKey]);

  // Fire the retargeting signal once per status appearance.
  useEffect(() => {
    if (!show || dismissed) return;
    if (firedFor.current === status) return;
    firedFor.current = status;
    trackRenewalPrompt(status as "renewing-soon" | "lapsed", tier as "basic" | "premium");
  }, [show, dismissed, status, tier]);

  if (!show || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, "1");
    } catch {
      /* ignore */
    }
  };

  const renewal = renewalPriceForCell(tier, cell);
  const renewDate = renewsAt
    ? new Date(renewsAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const reSubscribe = () => startSubscriptionCheckout(tier as Exclude<Tier, "free">);

  if (status === "lapsed") {
    return (
      <div className="renewal-banner renewal-banner-lapsed" role="status">
        <div className="renewal-banner-msg">
          <AlertTriangle size={15} color="var(--amber)" />
          <span>
            Your annual plan has lapsed — renew to restore unlimited research and your full toolkit.
          </span>
        </div>
        <div className="renewal-banner-actions">
          <button className="mkt-btn mkt-btn-primary renewal-banner-cta" onClick={reSubscribe}>
            Renew now <ArrowRight size={13} />
          </button>
          <button className="renewal-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  // renewing-soon — an informational nudge (reduces involuntary churn).
  return (
    <div className="renewal-banner" role="status">
      <div className="renewal-banner-msg">
        <CalendarClock size={15} color="var(--accent)" />
        <span>
          Your annual plan renews{renewDate ? ` on ${renewDate}` : " soon"}
          {renewal ? ` at $${renewal}/yr` : ""} — you keep unlimited access, cancel anytime.
        </span>
      </div>
      <button className="renewal-banner-dismiss" onClick={dismiss} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
