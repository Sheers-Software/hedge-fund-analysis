// ── Checkout orchestration (annual ladder + $7 tripwire) ─────────────
// One place that knows how to start a purchase and how to apply it. Both the
// redirect flow (Stripe Payment Link → ?upgraded=1 → UpgradeReturnHandler) and
// the local/dev optimistic flow (no link configured) funnel through `applyPurchase`
// so the store mutation + the correct Meta Purchase event always fire together.
//
// Validation MVP: there's no billing backend, so the tier flips optimistically.
// A Stripe webhook would reconcile real billing in production.

"use client";

import {
  stripeLinkFor,
  STRIPE_TRIPWIRE_LINK,
  introPriceFor,
  PREMIUM_EXPANSION_DELTA,
} from "@/lib/tiers";
import { useUserStore } from "@/lib/store";
import {
  trackPurchaseTripwire,
  trackPurchaseSubscription,
  trackPurchaseExpansion,
} from "@/lib/analytics";

/** What was bought — stashed before a Stripe redirect, replayed on return. */
export type PendingPurchase =
  | { kind: "subscription"; tier: "basic" | "premium"; bump?: boolean }
  | { kind: "expansion" }
  | { kind: "tripwire"; ticker: string };

const CRUMB_KEY = "apex-alpha-pending-purchase";

function setCrumb(p: PendingPurchase) {
  try {
    localStorage.setItem(CRUMB_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Read & clear the pending-purchase crumb (set before a Stripe redirect). */
export function readPendingPurchase(): PendingPurchase | null {
  try {
    const raw = localStorage.getItem(CRUMB_KEY);
    localStorage.removeItem(CRUMB_KEY);
    return raw ? (JSON.parse(raw) as PendingPurchase) : null;
  } catch {
    return null;
  }
}

/** Apply a completed purchase: flip the account + fire the matching Purchase event. */
export function applyPurchase(p: PendingPurchase) {
  const store = useUserStore.getState();
  if (p.kind === "tripwire") {
    store.buyDeepDive(p.ticker);
    trackPurchaseTripwire(p.ticker);
    return;
  }
  if (p.kind === "expansion") {
    store.subscribeAnnual("premium");
    trackPurchaseExpansion(PREMIUM_EXPANSION_DELTA);
    return;
  }
  // subscription — order-bump decomposes into base subscription + expansion.
  if (p.bump) {
    store.subscribeAnnual("premium");
    trackPurchaseSubscription({ value: introPriceFor("basic"), plan: "basic" });
    trackPurchaseExpansion(PREMIUM_EXPANSION_DELTA);
  } else {
    store.subscribeAnnual(p.tier);
    trackPurchaseSubscription({ value: introPriceFor(p.tier), plan: p.tier });
  }
}

// Build the Stripe checkout URL with a prefilled email + return crumb.
function redirect(link: string, returnTo?: string) {
  const email = useUserStore.getState().email;
  const url = new URL(link);
  if (email) url.searchParams.set("prefilled_email", email);
  const path = returnTo ?? `${window.location.pathname}?upgraded=1`;
  url.searchParams.set("redirect", `${window.location.origin}${path}`);
  window.location.href = url.toString();
}

/**
 * Start an annual subscription checkout. `bump` (on the Basic plan) adds the
 * Premium AI Intelligence desk as an order-bump, so checkout buys Premium.
 * Returns true if it redirected to Stripe, false if it applied optimistically.
 */
export function startSubscriptionCheckout(
  tier: "basic" | "premium",
  opts?: { bump?: boolean; returnTo?: string }
): boolean {
  const bump = !!opts?.bump && tier === "basic";
  const effectiveTier = bump ? "premium" : tier;
  const link = stripeLinkFor(effectiveTier);
  if (link) {
    setCrumb({ kind: "subscription", tier, bump });
    redirect(link, opts?.returnTo);
    return true;
  }
  applyPurchase({ kind: "subscription", tier, bump });
  return false;
}

/** Start the Premium expansion checkout (in-app /intel upsell for Basic users). */
export function startExpansionCheckout(opts?: { returnTo?: string }): boolean {
  const link = stripeLinkFor("premium");
  if (link) {
    setCrumb({ kind: "expansion" });
    redirect(link, opts?.returnTo);
    return true;
  }
  applyPurchase({ kind: "expansion" });
  return false;
}

/** Start the $7 single-ticker tripwire checkout (card-on-file). */
export function startTripwireCheckout(ticker: string, opts?: { returnTo?: string }): boolean {
  const link = STRIPE_TRIPWIRE_LINK;
  if (link) {
    setCrumb({ kind: "tripwire", ticker });
    redirect(link, opts?.returnTo);
    return true;
  }
  applyPurchase({ kind: "tripwire", ticker });
  return false;
}
