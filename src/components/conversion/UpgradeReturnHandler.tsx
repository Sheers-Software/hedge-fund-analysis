"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { trackSubscribe } from "@/lib/analytics";
import { priceFor, type Tier } from "@/lib/tiers";

// When the Stripe Payment Link redirects back with ?upgraded=1, optimistically
// flip the account to the purchased tier and fire the Meta "Subscribe" event.
// The tier is read from the pending-tier crumb set before redirect. (Validation
// MVP: a Stripe webhook would reconcile real billing in production.)
function Handler() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const upgrade = useUserStore((s) => s.upgrade);

  useEffect(() => {
    if (params.get("upgraded") !== "1") return;
    let tier: Tier = "premium";
    try {
      const crumb = localStorage.getItem("apex-alpha-pending-tier");
      if (crumb === "basic" || crumb === "premium") tier = crumb;
      localStorage.removeItem("apex-alpha-pending-tier");
    } catch {}
    upgrade(tier);
    trackSubscribe(priceFor(tier));
    router.replace(pathname); // strip the query param
  }, [params, pathname, router, upgrade]);

  return null;
}

export default function UpgradeReturnHandler() {
  return (
    <Suspense fallback={null}>
      <Handler />
    </Suspense>
  );
}
