import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReportSectionData } from "@/components/ui/SectionCard";

interface SettingsState {
  geminiKey: string;
  finnhubKey: string;
  setGeminiKey: (key: string) => void;
  setFinnhubKey: (key: string) => void;
  clearKeys: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      geminiKey: "",
      finnhubKey: "",
      setGeminiKey: (key) => set({ geminiKey: key }),
      setFinnhubKey: (key) => set({ finnhubKey: key }),
      clearKeys: () => set({ geminiKey: "", finnhubKey: "" }),
    }),
    {
      name: "apex-alpha-settings",
    }
  )
);

interface AppState {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  isSettingsOpen: boolean;
  setSettingsOpen: (isOpen: boolean) => void;
  currentTicker: string | null;
  setCurrentTicker: (ticker: string | null) => void;
  researchGuide: any;
  setResearchGuide: (guide: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  isSettingsOpen: false,
  setSettingsOpen: (isOpen) => set({ isSettingsOpen: isOpen }),
  currentTicker: null,
  setCurrentTicker: (ticker) => set({ currentTicker: ticker }),
  researchGuide: null,
  setResearchGuide: (guide) => set({ researchGuide: guide }),
}));

// Persists generated reports per ticker so navigating between features
// (Research Hub / Valuation / Charts) doesn't discard a generated report.
export interface ReportEntry {
  sections: ReportSectionData[];
  researchGuide: any;
  generatedAt: number;
}

interface ReportState {
  reports: Record<string, ReportEntry>;
  saveReport: (ticker: string, entry: ReportEntry) => void;
  clearReport: (ticker: string) => void;
}

export const useReportStore = create<ReportState>()(
  persist(
    (set) => ({
      reports: {},
      saveReport: (ticker, entry) =>
        set((state) => ({ reports: { ...state.reports, [ticker]: entry } })),
      clearReport: (ticker) =>
        set((state) => {
          const reports = { ...state.reports };
          delete reports[ticker];
          return { reports };
        }),
    }),
    { name: "apex-alpha-reports" }
  )
);
