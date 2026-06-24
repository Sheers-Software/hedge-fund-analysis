"use client";

import { useAppStore, useUserStore } from "@/lib/store";
import { startTripwireCheckout } from "@/lib/checkout";
import {
  TIERS,
  QUOTA_UNLOCK_TIER,
  meetsTier,
  requiredTierFor,
  type Tier,
  type GatedFeature,
} from "@/lib/tiers";

// One free ungated verdict for cold traffic lives client-side (the visitor has
// no account yet). This counter is what flips the gate from "show the wow" to
// "ask them to sign up" on the *second* action.
const ANON_VERDICT_KEY = "apex-alpha-anon-verdicts";

function anonVerdictsUsed(): number {
  if (typeof window === "undefined") return 0;
  try {
    return Number(localStorage.getItem(ANON_VERDICT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function recordAnonVerdict() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ANON_VERDICT_KEY, String(anonVerdictsUsed() + 1));
  } catch {
    /* ignore */
  }
}

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
   * Gate a quota'd action (reports / fair-value checks). Value before gate:
   *
   *  - checks, anonymous, 0 used  → run it, NO gate (the free ungated verdict).
   *  - checks, anonymous, ≥1 used → signup ("save your results / run another").
   *  - reports, anonymous         → signup (the heavier action is the ② gate).
   *  - signed-up, over quota       → upgrade (paywall leads with the $7 tripwire).
   */
  const guardQuota = (kind: "reports" | "checks", action: () => void): void => {
    if (!user.isSignedUp()) {
      // The one free verdict cold traffic gets before any modal.
      if (kind === "checks" && anonVerdictsUsed() < 1) {
        recordAnonVerdict();
        action();
        return;
      }
      openSignup(
        kind === "reports"
          ? "Create a free account to generate your first AI research memo."
          : "Save your results — create a free account to run another check.",
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
          ? `You've used your ${cap} free report this month. Go annual with ${tierName(QUOTA_UNLOCK_TIER)} for unlimited research memos — or unlock just this ticker for $${7}.`
          : `You've used your ${cap} free fair-value checks this month. Go annual with ${tierName(QUOTA_UNLOCK_TIER)} for unlimited checks.`,
        QUOTA_UNLOCK_TIER
      );
      return;
    }
    action();
  };

  /**
   * Route to the $7 single-ticker deep-dive checkout (card-on-file tripwire).
   * No-op if the ticker is already unlocked.
   */
  const guardTripwire = (ticker: string): void => {
    if (user.hasDeepDive(ticker)) return;
    startTripwireCheckout(ticker);
  };

  /**
   * Gate a tier-locked feature. Returns true if unlocked; otherwise opens the
   * signup modal (anonymous) or the upgrade modal targeting the *minimum tier*
   * that unlocks the feature, and returns false.
   */
  // The $7 tripwire unlocks the memo + valuation + charts + export for one
  // ticker — but NOT the Premium-only AI Intelligence terminal.
  const tripwireCovers = (feature: GatedFeature) => feature !== "intelFull";

  const guardPro = (feature: GatedFeature, reason: string, ticker?: string): boolean => {
    if (user.limits()[feature]) return true;
    if (ticker && tripwireCovers(feature) && user.hasDeepDive(ticker)) return true;
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
    hasDeepDive: (ticker: string) => user.hasDeepDive(ticker),
    renewalStatus: user.renewalStatus(),
    ensureSignedUp,
    guardQuota,
    guardTripwire,
    guardPro,
  };
}
