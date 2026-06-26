import { NextResponse } from "next/server";

// ── Meta Conversions API (CAPI) relay — server send ──────────────────
// The browser mirrors every conversion here with the SAME `event_id` the pixel
// used, so Meta deduplicates the two copies and attributes the optimized event
// exactly once (see docs/meta-gtm/conversion-tracking.md). This handler enriches
// the event with server-only signals (IP, user-agent), hashes PII per Meta's
// spec, and forwards it to the Graph API.
//
// Until META_CAPI_DATASET_ID + META_CAPI_ACCESS_TOKEN are set the handler
// acknowledges the beacon and no-ops, so dev and un-configured deploys are safe.
// Optional META_CAPI_TEST_EVENT_CODE routes sends to Events Manager → Test Events.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GRAPH_VERSION = process.env.META_GRAPH_API_VERSION || "v21.0";
const DATASET_ID = process.env.META_CAPI_DATASET_ID || "";
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";
const TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE || "";

/** Lowercase + trim then SHA-256 (hex) — Meta's normalization for email/PII. */
async function sha256(raw: string): Promise<string> {
  const data = new TextEncoder().encode(raw.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** First client IP from the proxy chain (Vercel sets x-forwarded-for). */
function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || undefined;
}

interface RelayBody {
  event_name?: string;
  event_id?: string;
  event_time?: number;
  event_source_url?: string;
  custom_data?: Record<string, unknown>;
  user_data?: { email?: string; fbp?: string; fbc?: string };
}

export async function POST(request: Request) {
  let body: RelayBody = {};
  try {
    body = (await request.json()) as RelayBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  if (!body.event_name) {
    return NextResponse.json({ ok: false, error: "Missing event_name." }, { status: 400 });
  }

  // Build Meta's user_data: hashed PII (email) + raw browser/network signals.
  const ud = body.user_data ?? {};
  const user_data: Record<string, unknown> = {};
  if (ud.email) {
    const hashed = await sha256(ud.email);
    user_data.em = [hashed];
    user_data.external_id = [hashed]; // stable per-user id improves matching
  }
  if (ud.fbp) user_data.fbp = ud.fbp; // raw — Meta does not hash these
  if (ud.fbc) user_data.fbc = ud.fbc;
  const ip = clientIp(request);
  const ua = request.headers.get("user-agent") || undefined;
  if (ip) user_data.client_ip_address = ip;
  if (ua) user_data.client_user_agent = ua;

  const event = {
    event_name: body.event_name,
    event_time: body.event_time ?? Math.floor(Date.now() / 1000),
    event_id: body.event_id, // ← dedup key, shared with the pixel
    event_source_url: body.event_source_url,
    action_source: "website",
    user_data,
    custom_data: body.custom_data ?? {},
  };

  // Not configured yet — acknowledge so the client beacon resolves cleanly. In
  // dev we echo the exact event we *would* send so the funnel can be verified
  // (hashing, dedup id, user_data) without a live Graph call.
  if (!DATASET_ID || !ACCESS_TOKEN) {
    return NextResponse.json({
      ok: true,
      forwarded: false,
      reason: "capi-not-configured",
      ...(process.env.NODE_ENV !== "production" ? { would_send: event } : {}),
    });
  }

  const payload: Record<string, unknown> = { data: [event] };
  if (TEST_EVENT_CODE) payload.test_event_code = TEST_EVENT_CODE;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${DATASET_ID}/events?access_token=${encodeURIComponent(
    ACCESS_TOKEN
  )}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Surface Graph errors server-side without breaking the client beacon.
      console.error("[CAPI] Graph API error", res.status, result);
      return NextResponse.json(
        { ok: true, forwarded: false, status: res.status, error: result?.error ?? null },
        { status: 200 }
      );
    }
    return NextResponse.json({
      ok: true,
      forwarded: true,
      events_received: result?.events_received ?? null,
      event_name: body.event_name,
    });
  } catch (e) {
    console.error("[CAPI] send failed", e);
    return NextResponse.json({ ok: true, forwarded: false, error: "send-failed" }, { status: 200 });
  }
}
