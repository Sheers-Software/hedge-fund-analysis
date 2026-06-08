import Navbar from "./Navbar";
import SettingsModal from "./SettingsModal";
import "@/app/globals.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell min-h-screen bg-[#0d1117] text-[#e8edf2] font-sans">
      <Navbar />
      <div className="flex w-full">
        {children}
      </div>
      <SettingsModal />
    </div>
  );
}
