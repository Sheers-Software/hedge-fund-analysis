"use client";

import { useAppStore, useUserStore } from "@/lib/store";
import { TIERS } from "@/lib/tiers";

// Central gating logic for the free→paid funnel. Every gated action in the
// app should route through here so the rules live in exactly one place.
export function useGate() {
  const openSignup = useAppStore((s) => s.openSignup);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const user = useUserStore();

  /**
   * Ensure the visitor has an account before running a free action.
   * Returns true if they can proceed now; otherwise opens the signup modal
   * (which will resume `action` after they sign up) and returns false.
   */
  const ensureSignedUp = (reason: string, action?: () => void): boolean => {
    if (user.isSignedUp()) return true;
    openSignup(reason, action);
    return false;
  };

  /**
   * Gate a quota'd action (reports / fair-value checks).
   * Handles: not-signed-up → signup; over-quota → paywall; else run/allow.
   */
  const guardQuota = (
    kind: "reports" | "checks",
    action: () => void
  ): void => {
    if (!user.isSignedUp()) {
      openSignup(
        kind === "reports"
          ? "Create a free account to generate your first AI research memo."
          : "Create a free account to run a fair-value check.",
        action
      );
      return;
    }
    if (!user.canUse(kind)) {
      const cap =
        kind === "reports"
          ? TIERS.free.limits.reportsPerMonth
          : TIERS.free.limits.checksPerMonth;
      openUpgrade(
        kind === "reports"
          ? `You've used your ${cap} free report this month. Upgrade to Pro for unlimited research memos.`
          : `You've used your ${cap} free fair-value checks this month. Upgrade to Pro for unlimited checks.`
      );
      return;
    }
    action();
  };

  /** Gate a Pro-only feature (full valuation / charts / export). */
  const guardPro = (
    feature: "valuationFull" | "chartsFull" | "exportEnabled",
    reason: string
  ): boolean => {
    if (user.limits()[feature]) return true;
    if (!user.isSignedUp()) {
      openSignup(reason);
      return false;
    }
    openUpgrade(reason);
    return false;
  };

  return {
    tier: user.tier,
    isPro: user.tier === "pro",
    isSignedUp: user.isSignedUp(),
    limits: user.limits(),
    remainingReports: user.remaining("reports"),
    remainingChecks: user.remaining("checks"),
    ensureSignedUp,
    guardQuota,
    guardPro,
  };
}
