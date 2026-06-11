// ── Meta Pixel (Conversions) wrapper ─────────────────────────────────
// Thin, SSR-safe helpers around `fbq`. The pixel script itself is injected
// by <PixelProvider> only when NEXT_PUBLIC_FB_PIXEL_ID is set, so dev and
// un-configured deploys are no-ops.
//
// Standard events map to the Meta funnel:
//   ViewContent     → landing / pricing viewed
//   Lead            → email captured (free signup)   ← primary optimization event
//   StartTrial      → entered the app / ran first free analysis
//   InitiateCheckout→ clicked "Upgrade to Pro"
//   Subscribe       → returned from Stripe as Pro
//
// Keep the conversion event names in sync with what you configure as the
// optimization goal inside Meta Ads Manager.

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID || "";

type FbqEvent =
  | "PageView"
  | "ViewContent"
  | "Lead"
  | "StartTrial"
  | "InitiateCheckout"
  | "Subscribe"
  | "CompleteRegistration"
  | "Search";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

function fire(type: "track" | "trackCustom", event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.fbq) return;
  try {
    window.fbq(type, event, params);
  } catch {
    /* never let analytics break the app */
  }
}

export const track = (event: FbqEvent, params?: Record<string, unknown>) =>
  fire("track", event, params);

export const trackCustom = (event: string, params?: Record<string, unknown>) =>
  fire("trackCustom", event, params);

// ── Funnel-specific helpers (use these in components) ────────────────
export const trackPageView = () => track("PageView");

export const trackViewContent = (name: string) =>
  track("ViewContent", { content_name: name });

export const trackLead = (source: string) =>
  track("Lead", { content_name: source });

export const trackStartTrial = () => track("StartTrial");

export const trackSearch = (ticker: string) =>
  track("Search", { search_string: ticker });

export const trackInitiateCheckout = (value: number) =>
  track("InitiateCheckout", { value, currency: "USD" });

export const trackSubscribe = (value: number) =>
  track("Subscribe", { value, currency: "USD", predicted_ltv: value * 12 });
