import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ReportSectionData } from "@/components/ui/SectionCard";
import { TIERS, QUOTA_UNLOCK_TIER, meetsTier, type Tier, type TierLimits } from "@/lib/tiers";
import { hashPassword, verifyPassword, validateEmail, validatePassword, genVerificationCode } from "@/lib/auth";

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
  upgradeTier: Tier | null; // which tier the gate wants the user to reach
  openUpgrade: (reason?: string, tier?: Tier) => void;
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
  upgradeTier: null,
  openUpgrade: (reason, tier) =>
    set({ isUpgradeOpen: true, upgradeReason: reason ?? null, upgradeTier: tier ?? null }),
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

// ── User / accounts / auth / tier / quota ────────────────────────────
// Client-side account model (validation MVP — see src/lib/auth.ts for the
// security caveat). `accounts` is the local "user DB" keyed by email; the
// active session mirrors the logged-in account onto top-level fields
// (email/tier/usage/…) so every existing `useUserStore(s => s.email|tier|…)`
// selector keeps working. Logout clears the session but keeps the account, so
// relogin works. Upgrades flip the active account's tier (optimistically, or
// after returning from the Stripe Payment Link).

function currentPeriod(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export interface UsageState {
  period: string; // YYYY-MM — usage resets when this rolls over
  reports: number;
  checks: number;
}

export interface Account {
  email: string;
  passwordHash: string;
  salt: string;
  verified: boolean;
  tier: Tier;
  signedUpAt: number;
  proSince: number | null;
  usage: UsageState;
}

export interface PendingVerification {
  email: string;
  code: string;
  expiresAt: number;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  /** Verification code, surfaced so the dev UI can show it (no ESP wired yet). */
  code?: string;
  /** True when login/register needs an email-verification step next. */
  needsVerification?: boolean;
}

interface UserState {
  // Active-session mirror of the logged-in account (logged-out defaults below).
  email: string | null;
  tier: Tier;
  signedUpAt: number | null;
  proSince: number | null;
  usage: UsageState;

  // Account "DB" + session.
  accounts: Record<string, Account>;
  sessionEmail: string | null;
  pending: PendingVerification | null;

  // derived helpers
  isSignedUp: () => boolean; // logged in with a verified account
  isLoggedIn: () => boolean;
  hasAccount: (email: string) => boolean;
  limits: () => TierLimits;
  remaining: (kind: "reports" | "checks") => number; // Infinity when unlimited
  canUse: (kind: "reports" | "checks") => boolean;

  // auth lifecycle
  register: (email: string, password: string) => Promise<AuthResult>;
  verifyEmail: (code: string) => AuthResult;
  resendCode: () => string | null;
  login: (email: string, password: string) => Promise<AuthResult>;
  logout: () => void;

  // tier / billing / usage
  setTier: (tier: Tier) => void;
  upgrade: (tier?: Tier) => void;
  recordReport: () => void;
  recordCheck: () => void;
  reset: () => void;
}

const freshUsage = (): UsageState => ({ period: currentPeriod(), reports: 0, checks: 0 });

// Roll usage over to a clean slate when the month changes.
function normalizedUsage(u: UsageState): UsageState {
  return u.period === currentPeriod() ? u : freshUsage();
}

const LOGGED_OUT = {
  email: null,
  tier: "free" as Tier,
  signedUpAt: null,
  proSince: null,
  usage: freshUsage(),
};

// Flatten an account onto the active-session mirror fields.
function activeFromAccount(acc: Account) {
  return {
    email: acc.email,
    tier: acc.tier,
    signedUpAt: acc.signedUpAt,
    proSince: acc.proSince,
    usage: normalizedUsage(acc.usage),
  };
}

// Write the active session's usage back into its account record.
function syncUsage(
  s: { sessionEmail: string | null; accounts: Record<string, Account> },
  usage: UsageState
): Record<string, Account> {
  if (!s.sessionEmail || !s.accounts[s.sessionEmail]) return s.accounts;
  return { ...s.accounts, [s.sessionEmail]: { ...s.accounts[s.sessionEmail], usage } };
}

const CODE_TTL_MS = 15 * 60 * 1000;

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...LOGGED_OUT,
      accounts: {},
      sessionEmail: null,
      pending: null,

      isSignedUp: () => {
        const s = get();
        return !!s.sessionEmail && !!s.accounts[s.sessionEmail]?.verified;
      },
      isLoggedIn: () => !!get().sessionEmail,
      hasAccount: (email) => !!get().accounts[email.trim().toLowerCase()],
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

      register: async (emailRaw, password) => {
        const email = emailRaw.trim().toLowerCase();
        const emailErr = validateEmail(email);
        if (emailErr) return { ok: false, error: emailErr };
        const pwErr = validatePassword(password);
        if (pwErr) return { ok: false, error: pwErr };

        const existing = get().accounts[email];
        if (existing?.verified)
          return { ok: false, error: "An account with this email already exists. Log in instead." };

        const { hash, salt } = await hashPassword(password);
        const account: Account = existing
          ? { ...existing, passwordHash: hash, salt }
          : {
              email,
              passwordHash: hash,
              salt,
              verified: false,
              tier: "free",
              signedUpAt: Date.now(),
              proSince: null,
              usage: freshUsage(),
            };
        const code = genVerificationCode();
        set((s) => ({
          accounts: { ...s.accounts, [email]: account },
          pending: { email, code, expiresAt: Date.now() + CODE_TTL_MS },
        }));
        return { ok: true, needsVerification: true, code };
      },

      verifyEmail: (code) => {
        const { pending, accounts } = get();
        if (!pending) return { ok: false, error: "Nothing to verify. Start over." };
        if (Date.now() > pending.expiresAt)
          return { ok: false, error: "That code expired. Resend a new one." };
        if (code.trim() !== pending.code)
          return { ok: false, error: "Incorrect code. Check and try again." };
        const acc = accounts[pending.email];
        if (!acc) return { ok: false, error: "Account not found." };
        const verified: Account = { ...acc, verified: true };
        set((s) => ({
          accounts: { ...s.accounts, [verified.email]: verified },
          sessionEmail: verified.email,
          pending: null,
          ...activeFromAccount(verified),
        }));
        return { ok: true };
      },

      resendCode: () => {
        const { pending } = get();
        if (!pending) return null;
        const code = genVerificationCode();
        set({ pending: { ...pending, code, expiresAt: Date.now() + CODE_TTL_MS } });
        return code;
      },

      login: async (emailRaw, password) => {
        const email = emailRaw.trim().toLowerCase();
        const acc = get().accounts[email];
        if (!acc) return { ok: false, error: "No account found for that email. Sign up first." };
        const ok = await verifyPassword(password, acc.passwordHash, acc.salt);
        if (!ok) return { ok: false, error: "Incorrect password. Try again." };
        if (!acc.verified) {
          const code = genVerificationCode();
          set({ pending: { email, code, expiresAt: Date.now() + CODE_TTL_MS } });
          return { ok: false, needsVerification: true, code, error: "Verify your email to finish signing in." };
        }
        set({ sessionEmail: email, pending: null, ...activeFromAccount(acc) });
        return { ok: true };
      },

      logout: () => set({ sessionEmail: null, pending: null, ...LOGGED_OUT }),

      setTier: (tier) => {
        const { sessionEmail, accounts } = get();
        if (!sessionEmail || !accounts[sessionEmail]) return set({ tier });
        const acc: Account = { ...accounts[sessionEmail], tier };
        set((s) => ({ accounts: { ...s.accounts, [sessionEmail]: acc }, tier }));
      },

      upgrade: (tier = "premium") => {
        const { sessionEmail, accounts } = get();
        const proSince = Date.now();
        if (!sessionEmail || !accounts[sessionEmail]) return set({ tier, proSince });
        const acc: Account = { ...accounts[sessionEmail], tier, proSince };
        set((s) => ({ accounts: { ...s.accounts, [sessionEmail]: acc }, tier, proSince }));
      },

      recordReport: () =>
        set((s) => {
          const u = normalizedUsage(s.usage);
          const usage = { ...u, reports: u.reports + 1 };
          const accounts = syncUsage(s, usage);
          return { usage, accounts };
        }),
      recordCheck: () =>
        set((s) => {
          const u = normalizedUsage(s.usage);
          const usage = { ...u, checks: u.checks + 1 };
          const accounts = syncUsage(s, usage);
          return { usage, accounts };
        }),
      reset: () => set({ ...LOGGED_OUT, accounts: {}, sessionEmail: null, pending: null }),
    }),
    {
      name: "apex-alpha-user",
      version: 1, // shape changed (accounts + session); discard pre-auth state
      migrate: (): any => ({
        ...LOGGED_OUT,
        accounts: {},
        sessionEmail: null,
        pending: null,
      }),
    }
  )
);

// ── Search / query history (recent & last searched) ──────────────────
export type HistoryKind = "report" | "check" | "valuation" | "charts" | "intel";

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
