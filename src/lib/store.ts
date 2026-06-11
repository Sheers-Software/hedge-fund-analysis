import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReportSectionData } from "@/components/ui/SectionCard";
import { TIERS, type Tier, type TierLimits } from "@/lib/tiers";

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

  // Global conversion modals (signup / paywall). `reason` lets the trigger
  // explain *why* the gate appeared so copy can be contextual.
  isSignupOpen: boolean;
  signupReason: string | null;
  afterAuth: (() => void) | null; // optional action to resume once signed up
  openSignup: (reason?: string, afterAuth?: () => void) => void;
  closeSignup: () => void;
  isUpgradeOpen: boolean;
  upgradeReason: string | null;
  openUpgrade: (reason?: string) => void;
  closeUpgrade: () => void;
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

  isSignupOpen: false,
  signupReason: null,
  afterAuth: null,
  openSignup: (reason, afterAuth) =>
    set({ isSignupOpen: true, signupReason: reason ?? null, afterAuth: afterAuth ?? null }),
  closeSignup: () => set({ isSignupOpen: false, afterAuth: null }),
  isUpgradeOpen: false,
  upgradeReason: null,
  openUpgrade: (reason) => set({ isUpgradeOpen: true, upgradeReason: reason ?? null }),
  closeUpgrade: () => set({ isUpgradeOpen: false }),
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

// ── User / account / tier / quota ────────────────────────────────────
// Validation-MVP account model: no backend. Email capture is the "signup"
// (a Meta Lead), tier + monthly usage live in localStorage. Upgrades flip
// the tier optimistically when the user returns from the Stripe Payment Link.

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface UsageState {
  period: string; // YYYY-MM — usage resets when this rolls over
  reports: number;
  checks: number;
}

interface UserState {
  email: string | null;
  tier: Tier;
  signedUpAt: number | null;
  proSince: number | null;
  usage: UsageState;

  // derived helpers
  isSignedUp: () => boolean;
  limits: () => TierLimits;
  remaining: (kind: "reports" | "checks") => number; // Infinity when unlimited
  canUse: (kind: "reports" | "checks") => boolean;

  // mutations
  signup: (email: string) => void;
  setTier: (tier: Tier) => void;
  upgrade: () => void;
  recordReport: () => void;
  recordCheck: () => void;
  reset: () => void;
}

const freshUsage = (): UsageState => ({ period: currentPeriod(), reports: 0, checks: 0 });

// Roll usage over to a clean slate when the month changes.
function normalizedUsage(u: UsageState): UsageState {
  return u.period === currentPeriod() ? u : freshUsage();
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      email: null,
      tier: "free",
      signedUpAt: null,
      proSince: null,
      usage: freshUsage(),

      isSignedUp: () => !!get().email,
      limits: () => TIERS[get().tier].limits,
      remaining: (kind) => {
        const cap =
          kind === "reports"
            ? get().limits().reportsPerMonth
            : get().limits().checksPerMonth;
        if (cap === null) return Infinity;
        const u = normalizedUsage(get().usage);
        return Math.max(0, cap - (kind === "reports" ? u.reports : u.checks));
      },
      canUse: (kind) => get().remaining(kind) > 0,

      signup: (email) =>
        set((s) => ({
          email: email.trim().toLowerCase(),
          signedUpAt: s.signedUpAt ?? Date.now(),
        })),
      setTier: (tier) => set({ tier }),
      upgrade: () => set({ tier: "pro", proSince: Date.now() }),
      recordReport: () =>
        set((s) => {
          const u = normalizedUsage(s.usage);
          return { usage: { ...u, reports: u.reports + 1 } };
        }),
      recordCheck: () =>
        set((s) => {
          const u = normalizedUsage(s.usage);
          return { usage: { ...u, checks: u.checks + 1 } };
        }),
      reset: () =>
        set({
          email: null,
          tier: "free",
          signedUpAt: null,
          proSince: null,
          usage: freshUsage(),
        }),
    }),
    { name: "apex-alpha-user" }
  )
);

// ── Search / query history (recent & last searched) ──────────────────
export type HistoryKind = "report" | "check" | "valuation" | "charts";

export interface HistoryItem {
  ticker: string;
  name?: string;
  kind: HistoryKind;
  at: number;
}

interface HistoryState {
  items: HistoryItem[];
  add: (item: Omit<HistoryItem, "at">) => void;
  remove: (ticker: string) => void;
  clear: () => void;
  recent: (limit?: number) => HistoryItem[];
  lastSearched: () => HistoryItem | null;
}

const HISTORY_CAP = 50; // hard storage cap; tier-based display limit is separate

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const ticker = item.ticker.toUpperCase();
          // De-dupe by ticker, move to front, keep newest metadata.
          const rest = s.items.filter((i) => i.ticker !== ticker);
          const next: HistoryItem = { ...item, ticker, at: Date.now() };
          return { items: [next, ...rest].slice(0, HISTORY_CAP) };
        }),
      remove: (ticker) =>
        set((s) => ({ items: s.items.filter((i) => i.ticker !== ticker.toUpperCase()) })),
      clear: () => set({ items: [] }),
      recent: (limit) => {
        const items = get().items;
        return limit ? items.slice(0, limit) : items;
      },
      lastSearched: () => get().items[0] ?? null,
    }),
    { name: "apex-alpha-history" }
  )
);
