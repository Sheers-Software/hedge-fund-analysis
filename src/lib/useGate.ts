"use client";

import { useAppStore, useUserStore } from "@/lib/store";
import {
  TIERS,
  QUOTA_UNLOCK_TIER,
  meetsTier,
  requiredTierFor,
  type Tier,
  type GatedFeature,
} from "@/lib/tiers";

// Central gating logic for the free→paid funnel. Every gated action in the
// app routes through here so the rules (and the correct *upgrade target tier*)
// live in exactly one place.
export function useGate() {
  const openSignup = useAppStore((s) => s.openSignup);
  const openUpgrade = useAppStore((s) => s.openUpgrade);
  const user = useUserStore();

  const tierName = (t: Tier) => TIERS[t].name;

  /**
   * Ensure the visitor has an account before running a free action.
   * Returns true if they can proceed now; otherwise opens the auth modal
   * (which resumes `action` after they sign up) and returns false.
   */
  const ensureSignedUp = (reason: string, action?: () => void): boolean => {
    if (user.isSignedUp()) return true;
    openSignup(reason, action);
    return false;
  };

  /**
   * Gate a quota'd action (reports / fair-value checks).
   * not-signed-up → auth modal; over-quota → upgrade to the cheapest paid tier.
   */
  const guardQuota = (kind: "reports" | "checks", action: () => void): void => {
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
          ? `You've used your ${cap} free report this month. Upgrade to ${tierName(QUOTA_UNLOCK_TIER)} for unlimited research memos.`
          : `You've used your ${cap} free fair-value checks this month. Upgrade to ${tierName(QUOTA_UNLOCK_TIER)} for unlimited checks.`,
        QUOTA_UNLOCK_TIER
      );
      return;
    }
    action();
  };

  /**
   * Gate a tier-locked feature. Returns true if unlocked; otherwise opens the
   * signup modal (anonymous) or the upgrade modal targeting the *minimum tier*
   * that unlocks the feature, and returns false.
   */
  const guardPro = (feature: GatedFeature, reason: string): boolean => {
    if (user.limits()[feature]) return true;
    const target = requiredTierFor(feature);
    if (!user.isSignedUp()) {
      openSignup(reason);
      return false;
    }
    openUpgrade(reason, target);
    return false;
  };

  return {
    tier: user.tier,
    isPaid: user.tier !== "free",
    isPro: user.tier !== "free", // back-compat alias (any paid tier)
    isBasic: user.tier === "basic",
    isPremium: user.tier === "premium",
    isSignedUp: user.isSignedUp(),
    limits: user.limits(),
    remainingReports: user.remaining("reports"),
    remainingChecks: user.remaining("checks"),
    requiredTierFor,
    isUnlocked: (feature: GatedFeature) => meetsTier(user.tier, requiredTierFor(feature)),
    ensureSignedUp,
    guardQuota,
    guardPro,
  };
}
