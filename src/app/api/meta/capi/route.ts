import { NextResponse } from "next/server";

// ── Meta Conversions API (CAPI) relay — STUB ─────────────────────────
// The client mirrors every conversion event here with a shared `event_id` so
// the server copy can be deduplicated against the browser pixel. This is the
// product-side surface only; the full server send (Graph API call with the
// dataset's access token, hashed user-data, and server event_time) is wired in
// Step 5 (see docs/meta-gtm/conversion-machine.md §6).
//
// Until then this accepts the beacon and no-ops, so the funnel already emits the
// correct event names + payloads + dedup keys end-to-end.

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FB_DATASET_ID = process.env.META_CAPI_DATASET_ID || "";
const FB_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN || "";

export async function POST(request: Request) {
  let event: Record<string, unknown> = {};
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid payload." }, { status: 400 });
  }

  // Not configured yet (Step 5 wires the real Graph API send). Acknowledge so
  // the client beacon resolves cleanly without surfacing an error to the user.
  if (!FB_DATASET_ID || !FB_ACCESS_TOKEN) {
    return NextResponse.json({ ok: true, forwarded: false });
  }

  // Placeholder for the Step 5 server send. Intentionally not implemented here.
  return NextResponse.json({ ok: true, forwarded: false, received: event.event_name ?? null });
}
