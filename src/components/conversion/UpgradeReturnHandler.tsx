"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useUserStore } from "@/lib/store";
import { trackSubscribe } from "@/lib/analytics";
import { PRO_PRICE } from "@/lib/tiers";

// When the Stripe Payment Link redirects back with ?upgraded=1, optimistically
// flip the account to Pro and fire the Meta "Subscribe" conversion. (Validation
// MVP: real billing reconciliation would happen via a webhook later.)
function Handler() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const upgrade = useUserStore((s) => s.upgrade);
  const tier = useUserStore((s) => s.tier);

  useEffect(() => {
    if (params.get("upgraded") === "1") {
      if (tier !== "pro") {
        upgrade();
        trackSubscribe(PRO_PRICE);
      }
      router.replace(pathname); // strip the query param
    }
  }, [params, pathname, router, upgrade, tier]);

  return null;
}

export default function UpgradeReturnHandler() {
  return (
    <Suspense fallback={null}>
      <Handler />
    </Suspense>
  );
}
