// ── Subscription tiers ───────────────────────────────────────────────
// Single source of truth for what each tier can do. The whole app gates
// features off this config so the free→paid funnel stays consistent.
//
// Good-better-best ladder (validation-MVP):
//   Free      — the hook: quota-limited, everything else teased.
//   Basic $9  — the core research toolkit (valuation, charts, export, unlimited).
//   Premium $19 — adds the flagship AI Intelligence terminal on top of Basic.
//
// Keys are supplied server-side; upgrades go through Stripe Payment Links
// (no backend billing yet) — see UpgradeModal.

export type Tier = "free" | "basic" | "premium";

// Low → high. Authorization is "does my tier rank >= the feature's required tier".
export const TIER_ORDER: Tier[] = ["free", "basic", "premium"];
export const tierRank = (t: Tier): number => TIER_ORDER.indexOf(t);
export const meetsTier = (current: Tier, required: Tier): boolean =>
  tierRank(current) >= tierRank(required);

export interface TierLimits {
  /** Full AI research memos per calendar month. null = unlimited. */
  reportsPerMonth: number | null;
  /** Quick "fair value" checks per calendar month. null = unlimited. */
  checksPerMonth: number | null;
  /** Full interactive valuation calculator (Bull/Base/Bear). false = teaser only. */
  valuationFull: boolean;
  /** Full quarterly charts + forward projections. false = teaser only. */
  chartsFull: boolean;
  /** Full AI Intelligence terminal (multi-model, technicals, S/R, transactors). false = teaser only. */
  intelFull: boolean;
  /** Export reports to PDF / Markdown. */
  exportEnabled: boolean;
  /** How many history items are retained/visible. null = unlimited. */
  historyLimit: number | null;
}

/** The Pro/paid feature flags that can be gated behind a tier. */
export type GatedFeature = "valuationFull" | "chartsFull" | "intelFull" | "exportEnabled";

/** The minimum tier that unlocks each gated feature — drives the upgrade target. */
export const FEATURE_MIN_TIER: Record<GatedFeature, Tier> = {
  valuationFull: "basic",
  chartsFull: "basic",
  exportEnabled: "basic",
  intelFull: "premium",
};

/** Quota'd actions (reports/checks) become unlimited at this tier and above. */
export const QUOTA_UNLOCK_TIER: Tier = "basic";

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
      intelFull: false,
      exportEnabled: false,
      historyLimit: 3,
    },
    features: [
      "1 full AI research memo / month",
      "3 quick fair-value checks / month",
      "Real-time price & fundamentals",
      "Valuation, charts & Intelligence preview",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    priceMonthly: 9,
    tagline: "The core research toolkit, unlimited.",
    limits: {
      reportsPerMonth: null,
      checksPerMonth: null,
      valuationFull: true,
      chartsFull: true,
      intelFull: false,
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
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthly: 19,
    tagline: "Everything, plus the AI Intelligence desk.",
    limits: {
      reportsPerMonth: null,
      checksPerMonth: null,
      valuationFull: true,
      chartsFull: true,
      intelFull: true,
      exportEnabled: true,
      historyLimit: null,
    },
    features: [
      "Everything in Basic",
      "AI Intelligence terminal — multi-model outlook",
      "AI technical & fundamental reads (Gemini 2.5)",
      "Support/resistance zones + insider transactors",
      "Quarterly balance sheet & income statement",
      "Priority data refresh",
    ],
  },
};

/** Paid tiers in upsell order (for the pricing page / upgrade modal). */
export const PAID_TIERS: Exclude<Tier, "free">[] = ["basic", "premium"];

export const BASIC_PRICE = TIERS.basic.priceMonthly;
export const PREMIUM_PRICE = TIERS.premium.priceMonthly;
/** @deprecated kept for back-compat; prefer BASIC_PRICE / PREMIUM_PRICE. */
export const PRO_PRICE = TIERS.basic.priceMonthly;

export const priceFor = (tier: Tier): number => TIERS[tier].priceMonthly;

/** Where each paid tier's "Upgrade" button sends users (Stripe Payment Links). */
export const STRIPE_PAYMENT_LINKS: Record<Exclude<Tier, "free">, string> = {
  basic: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "",
  premium: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM || "",
};
/** @deprecated single-link back-compat (maps to Basic). */
export const STRIPE_PAYMENT_LINK = STRIPE_PAYMENT_LINKS.basic;

export const stripeLinkFor = (tier: Exclude<Tier, "free">): string =>
  STRIPE_PAYMENT_LINKS[tier];

export function limitsFor(tier: Tier): TierLimits {
  return TIERS[tier].limits;
}

/** The tier a user must reach to unlock a given gated feature. */
export function requiredTierFor(feature: GatedFeature): Tier {
  return FEATURE_MIN_TIER[feature];
}
