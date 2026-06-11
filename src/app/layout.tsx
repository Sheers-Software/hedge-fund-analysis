import type { Metadata } from "next";
import "./globals.css";
import PixelProvider from "@/components/analytics/PixelProvider";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://apexalpha.app"
  ),
  title: {
    default: "ApexAlpha — Hedge-fund-grade stock analysis for the price of a coffee",
    template: "%s · ApexAlpha",
  },
  description:
    "Stop guessing what a stock is worth. Get an institutional-grade AI research memo and a fair-value estimate on any stock in seconds — for $9/mo. For research & educational use only.",
  openGraph: {
    title: "ApexAlpha — Hedge-fund-grade stock analysis in seconds",
    description:
      "The analysis Wall Street pays $24k/yr for, without the terminal. Run a free fair-value check on any stock.",
    type: "website",
    siteName: "ApexAlpha",
  },
  twitter: {
    card: "summary_large_image",
    title: "ApexAlpha — Hedge-fund-grade stock analysis in seconds",
    description:
      "Stop guessing what a stock is worth. Free fair-value check on any stock.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <PixelProvider />
        {children}
      </body>
    </html>
  );
}
