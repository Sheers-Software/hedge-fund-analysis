// ── Meta Pixel + Conversions API (CAPI) wrapper ──────────────────────
// Thin, SSR-safe helpers around `fbq` (browser pixel) PLUS a server-side CAPI
// relay. Every conversion fires through both with a shared `event_id` so Meta
// deduplicates and attributes the optimized event exactly once. The pixel
// script is injected by <PixelProvider> only when NEXT_PUBLIC_FB_PIXEL_ID is
// set, so dev and un-configured deploys are no-ops.
//
// The event ladder is the conversion machine (docs/meta-gtm/conversion-machine.md):
//   ① ViewVerdict          → free ungated fair-value verdict (custom event)
//   ② CompleteRegistration → account created  ← LAUNCH OPTIMIZATION EVENT
//   ③ Purchase (tripwire)  → $7 single-ticker deep-dive
//   ④ Purchase (subscription) → annual $99 intro / $279–299 renewal  ★
//   ⑤ Purchase (expansion) → Premium AI Intelligence add-on (≈ +$100/yr)
//
// DEPRECATED: StartTrial / Lead semantics from the monthly model. The launch
// event is now CompleteRegistration, graduating to Purchase. Keep a trackCustom
// fallback ready in case Purchase/Lead are filtered on a finance domain (recon §3).

import { MODELED_LTV } from "@/lib/tiers";

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

type FbqEvent =
  | "PageView"
  | "ViewContent"
  | "CompleteRegistration"
  | "Purchase"
  | "Search"
  // Deprecated (monthly model) — retained so legacy callers still type-check.
  | "Lead"
  | "StartTrial"
  | "InitiateCheckout"
  | "Subscribe";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** A shared id for pixel⇄CAPI deduplication. */
export function newEventId(): string {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    /* fall through */
  }
  return `evt_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

// Best-effort server-side CAPI relay. The full spec (access token, hashed
// user-data, server event time) lands in Step 5; this stubs the surface so the
// product already emits the right names + payloads with a dedup key.
function sendCapi(event: string, params: Record<string, unknown>, eventId: string) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      event_name: event,
      event_id: eventId,
      event_source_url: window.location.href,
      custom_data: params,
    });
    // keepalive so the beacon survives a navigation (e.g. Stripe redirect).
    fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never let analytics break the app */
  }
}

function fire(
  type: "track" | "trackCustom",
  event: string,
  params: Record<string, unknown> = {},
  opts?: { dedup?: boolean }
) {
  const eventId = newEventId();
  if (typeof window !== "undefined" && window.fbq) {
    try {
      // 4th arg carries eventID → pixel⇄CAPI dedup.
      window.fbq(type, event, params, { eventID: eventId });
    } catch {
      /* never let analytics break the app */
    }
  }
  // Mirror conversion events to CAPI with the same id.
  if (opts?.dedup) sendCapi(event, params, eventId);
}

export const track = (event: FbqEvent, params?: Record<string, unknown>) =>
  fire("track", event, params);

export const trackCustom = (event: string, params?: Record<string, unknown>) =>
  fire("trackCustom", event, params);

// ── Funnel-specific helpers (use these in components) ────────────────
export const trackPageView = () => track("PageView");

export const trackViewContent = (name: string) =>
  track("ViewContent", { content_name: name });

export const trackSearch = (ticker: string) =>
  track("Search", { search_string: ticker });

/** ① Free ungated verdict shown — the top-of-funnel custom event. */
export const trackViewVerdict = (ticker: string) =>
  fire("trackCustom", "ViewVerdict", { ticker }, { dedup: true });

/** ② Account created — the launch optimization event (deduped via CAPI). */
export const trackCompleteRegistration = () =>
  fire("track", "CompleteRegistration", {}, { dedup: true });

/** ③ $7 tripwire purchased (card-on-file, single ticker). */
export const trackPurchaseTripwire = (ticker: string) =>
  fire(
    "track",
    "Purchase",
    { value: 7, currency: "USD", content_type: "tripwire", ticker },
    { dedup: true }
  );

/** ④ Annual subscription purchased — the core revenue event. */
export const trackPurchaseSubscription = (params: {
  value: number;
  plan: "basic" | "premium";
}) =>
  fire(
    "track",
    "Purchase",
    {
      value: params.value,
      currency: "USD",
      content_type: "subscription",
      plan: params.plan,
      cadence: "annual",
      // Modeled blended LTV — never a monthly extrapolation (value×12).
      predicted_ltv: MODELED_LTV,
    },
    { dedup: true }
  );

/** ⑤ Premium expansion (order-bump or in-app /intel upsell). */
export const trackPurchaseExpansion = (value: number) =>
  fire(
    "track",
    "Purchase",
    { value, currency: "USD", content_type: "expansion", plan: "premium" },
    { dedup: true }
  );
