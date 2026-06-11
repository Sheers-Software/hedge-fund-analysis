"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { FB_PIXEL_ID, trackPageView } from "@/lib/analytics";

// Fires a PageView on every *subsequent* client-side navigation. The initial
// load is already counted by the pixel init script, so we skip the first run
// to avoid double-counting. Wrapped in Suspense because useSearchParams opts
// the subtree into client-side rendering.
function RouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    trackPageView();
  }, [pathname, searchParams]);

  return null;
}

/**
 * Injects the Meta Pixel only when NEXT_PUBLIC_FB_PIXEL_ID is configured.
 * Without it (local dev / un-set deploys) this renders nothing and every
 * analytics call is a safe no-op.
 */
export default function PixelProvider() {
  if (!FB_PIXEL_ID) return null;

  return (
    <>
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${FB_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          alt=""
          src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
        />
      </noscript>
      <Suspense fallback={null}>
        <RouteTracker />
      </Suspense>
    </>
  );
}
