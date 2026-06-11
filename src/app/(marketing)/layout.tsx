import MarketingHeader from "@/components/marketing/MarketingHeader";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import SignupModal from "@/components/conversion/SignupModal";
import "@/app/globals.css";

// Conversion-focused chrome for cold Meta traffic. No app navbar/search —
// the whole page is built to move a visitor toward "Start free".
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mkt-shell">
      <MarketingHeader />
      <main className="mkt-main">{children}</main>
      <MarketingFooter />
      {/* Allow email capture directly from the landing page CTAs. */}
      <SignupModal />
    </div>
  );
}
