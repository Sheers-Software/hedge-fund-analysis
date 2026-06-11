// ── Subscription tiers ───────────────────────────────────────────────
// Single source of truth for what each tier can do. The whole app gates
// features off this config so the Meta free→paid funnel stays consistent.
//
// Validation-MVP model (per GTM): keys are supplied server-side, the FREE
// tier is quota-limited, and PRO unlocks depth. Upgrades go through a Stripe
// Payment Link (no backend billing yet) — see UpgradeModal.

export type Tier = "free" | "pro";

export interface TierLimits {
  /** Full AI research memos per calendar month. null = unlimited. */
  reportsPerMonth: number | null;
  /** Quick "fair value" checks per calendar month. null = unlimited. */
  checksPerMonth: number | null;
  /** Full interactive valuation calculator (Bull/Base/Bear). false = teaser only. */
  valuationFull: boolean;
  /** Full quarterly charts + forward projections. false = teaser only. */
  chartsFull: boolean;
  /** Export reports to PDF / Markdown. */
  exportEnabled: boolean;
  /** How many history items are retained/visible. null = unlimited. */
  historyLimit: number | null;
}

export interface TierConfig {
  id: Tier;
  name: string;
  /** Price in USD per month. 0 for free. */
  priceMonthly: number;
  tagline: string;
  limits: TierLimits;
  /** Marketing bullet points for the pricing page. */
  features: string[];
}

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    tagline: "See the quality before you pay a cent.",
    limits: {
      reportsPerMonth: 1,
      checksPerMonth: 3,
      valuationFull: false,
      chartsFull: false,
      exportEnabled: false,
      historyLimit: 3,
    },
    features: [
      "1 full AI research memo / month",
      "3 quick fair-value checks / month",
      "Real-time price & fundamentals",
      "Valuation & charts preview",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 9,
    tagline: "Hedge-fund-grade research for the price of a coffee.",
    limits: {
      reportsPerMonth: null,
      checksPerMonth: null,
      valuationFull: true,
      chartsFull: true,
      exportEnabled: true,
      historyLimit: null,
    },
    features: [
      "Unlimited AI research memos",
      "Unlimited fair-value checks",
      "Full 5-year valuation model (Bull / Base / Bear)",
      "Full quarterly charts + forward projections",
      "One-click PDF & Markdown export",
      "Unlimited saved history",
    ],
  },
};

export const PRO_PRICE = TIERS.pro.priceMonthly;

/** Where the "Upgrade" button sends users (Stripe Payment Link). */
export const STRIPE_PAYMENT_LINK =
  process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "";

export type GatedFeature =
  | "report"
  | "check"
  | "valuation"
  | "charts"
  | "export"
  | "history";

export function limitsFor(tier: Tier): TierLimits {
  return TIERS[tier].limits;
}
