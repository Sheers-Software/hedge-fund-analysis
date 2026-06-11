import Navbar from "@/components/layout/Navbar";
import SettingsModal from "@/components/layout/SettingsModal";
import SignupModal from "@/components/conversion/SignupModal";
import UpgradeModal from "@/components/conversion/UpgradeModal";
import UpgradeReturnHandler from "@/components/conversion/UpgradeReturnHandler";
import "@/app/globals.css";

// The authenticated-product shell. Marketing pages live in (marketing) and
// deliberately do NOT get this chrome.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-[#0d1117] text-[#e8edf2] font-sans">
      <Navbar />
      <div className="flex w-full">{children}</div>

      {/* Global modals + funnel plumbing */}
      <SettingsModal />
      <SignupModal />
      <UpgradeModal />
      <UpgradeReturnHandler />
    </div>
  );
}
