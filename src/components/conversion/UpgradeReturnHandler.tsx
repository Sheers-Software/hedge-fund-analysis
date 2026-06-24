"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { readPendingPurchase, applyPurchase } from "@/lib/checkout";

// When a Stripe Payment Link redirects back with ?upgraded=1, replay the
// pending-purchase crumb set before redirect: flip the account and fire the
// matching Meta Purchase event (subscription / expansion / tripwire), deduped
// against the browser pixel. (Validation MVP: a Stripe webhook would reconcile
// real billing in production.)
function Handler() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (params.get("upgraded") !== "1") return;
    const pending = readPendingPurchase();
    // Default to the core annual plan if the crumb was lost.
    applyPurchase(pending ?? { kind: "subscription", tier: "basic" });
    router.replace(pathname); // strip the query param
  }, [params, pathname, router]);

  return null;
}

export default function UpgradeReturnHandler() {
  return (
    <Suspense fallback={null}>
      <Handler />
    </Suspense>
  );
}
