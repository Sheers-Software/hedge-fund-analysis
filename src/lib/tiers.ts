// ── Subscription tiers ───────────────────────────────────────────────
// Single source of truth for what each tier can do. The whole app gates
// features off this config so the free→paid funnel stays consistent.
//
// The pricing model is the Meta conversion machine (see
// docs/meta-gtm/conversion-machine.md): a free ungated verdict → account →
// $7 card-on-file tripwire → an ANNUAL ladder ($99 intro → $279/$299 renewal)
// with Premium as an annual expansion. Cadence is annual, NOT monthly — the
// LTV:CAC ≥ 3:1 math depends on it.
//
//   Free        — the hook: quota-limited, everything else teased.
//   Basic       — the core annual plan ($99 intro / $279–299 renewal).
//   Premium     — annual + the AI Intelligence desk (≈ +$100/yr expansion).
//   Tripwire    — a $7 one-off single-ticker deep-dive (not a Tier; see TRIPWIRE).
//
// Keys are supplied server-side; upgrades go through Stripe Payment Links
// (no backend billing yet) — see UpgradeModal / UpgradeReturnHandler.

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

export type Cadence = "annual" | "oneoff" | "free";

export interface TierConfig {
  id: Tier;
  name: string;
  /** Billing cadence — the ladder is annual (the monthly model is retired). */
  cadence: Cadence;
  /** First-term price in USD (annual intro: $99). 0 for free. */
  introPrice: number;
  /** Recurring price in USD after the intro term (annual renewal). 0 for free. */
  renewalPrice: number;
  tagline: string;
  limits: TierLimits;
  /** Marketing bullet points for the pricing page. */
  features: string[];
}

// ── Annual ladder pricing (Step 3 WTP test is runtime-switchable) ─────
/** First-year intro price for the core annual (Basic) plan. */
export const ANNUAL_INTRO_PRICE = 99;
/**
 * Renewal price for the core annual plan. The Step 3 WTP test A/Bs $279 vs $299
 * with no redeploy via NEXT_PUBLIC_ANNUAL_RENEWAL_PRICE (defaults to $279).
 */
export const ANNUAL_RENEWAL_PRICE: 279 | 299 =
  Number(process.env.NEXT_PUBLIC_ANNUAL_RENEWAL_PRICE) === 299 ? 299 : 279;
/** Premium is the annual expansion: ≈ +$100/yr over Basic (recon assumption). */
export const PREMIUM_EXPANSION_DELTA = 100;
/** Modeled blended LTV (~$528–598) — what CAPI sends as predicted_ltv (never value×12). */
export const MODELED_LTV = 560;

export const TIERS: Record<Tier, TierConfig> = {
  free: {
    id: "free",
    name: "Free",
    cadence: "free",
    introPrice: 0,
    renewalPrice: 0,
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
      "1 free fair-value verdict — no account needed",
      "1 full AI research memo / month",
      "Real-time price & fundamentals",
      "Valuation, charts & Intelligence preview",
    ],
  },
  basic: {
    id: "basic",
    name: "Basic",
    cadence: "annual",
    introPrice: ANNUAL_INTRO_PRICE,
    renewalPrice: ANNUAL_RENEWAL_PRICE,
    tagline: "The complete research toolkit — unlimited, all year.",
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
    cadence: "annual",
    introPrice: ANNUAL_INTRO_PRICE + PREMIUM_EXPANSION_DELTA,
    renewalPrice: ANNUAL_RENEWAL_PRICE + PREMIUM_EXPANSION_DELTA,
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

// ── The $7 tripwire (a one-off product, NOT a Tier) ──────────────────
// Card-on-file single-ticker unlock: the full memo + valuation + charts +
// export for ONE ticker. Ownership lives on the account as `deepDives`.
export const TRIPWIRE = {
  id: "deepdive" as const,
  price: 7,
  name: "Single deep-dive report",
  tagline: "Unlock the full memo, model, charts & export for one ticker.",
} as const;

/** Paid tiers in upsell order (for the pricing page / upgrade modal). */
export const PAID_TIERS: Exclude<Tier, "free">[] = ["basic", "premium"];

/** First-term (intro) price for a tier. */
export const introPriceFor = (tier: Tier): number => TIERS[tier].introPrice;
/** Recurring (renewal) price for a tier. */
export const renewalPriceFor = (tier: Tier): number => TIERS[tier].renewalPrice;

// Category anchors for the paywall (competitor annual list prices).
export const CATEGORY_ANCHORS = [
  { name: "Seeking Alpha", price: 299 },
  { name: "Motley Fool", price: 199 },
];

/** Where each paid tier's annual checkout sends users (Stripe Payment Links). */
export const STRIPE_PAYMENT_LINKS: Record<Exclude<Tier, "free">, string> = {
  basic:
    process.env.NEXT_PUBLIC_STRIPE_LINK_ANNUAL ||
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ||
    "",
  premium:
    process.env.NEXT_PUBLIC_STRIPE_LINK_ANNUAL_PREMIUM ||
    process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_PREMIUM ||
    "",
};
/** The $7 tripwire checkout link. */
export const STRIPE_TRIPWIRE_LINK = process.env.NEXT_PUBLIC_STRIPE_LINK_TRIPWIRE || "";

export const stripeLinkFor = (tier: Exclude<Tier, "free">): string =>
  STRIPE_PAYMENT_LINKS[tier];

// ── Step 3 WTP A/B: renewal-anchor cells (intro stays $99/$199) ───────
// Each cell binds a renewal anchor to its matching Stripe link so the price the
// customer SEES always equals the price they're CHARGED. Assignment lives in
// src/lib/experiment.ts; the chosen cell rides the Purchase event as `wtp_cell`.
export type WtpCell = "a" | "b";

export const WTP_CELLS: Record<
  WtpCell,
  { renewal: Record<Exclude<Tier, "free">, number>; links: Record<Exclude<Tier, "free">, string> }
> = {
  a: {
    renewal: { basic: 279, premium: 379 },
    links: { basic: STRIPE_PAYMENT_LINKS.basic, premium: STRIPE_PAYMENT_LINKS.premium },
  },
  b: {
    renewal: { basic: 299, premium: 399 },
    links: {
      basic: process.env.NEXT_PUBLIC_STRIPE_LINK_ANNUAL_B || "",
      premium: process.env.NEXT_PUBLIC_STRIPE_LINK_ANNUAL_PREMIUM_B || "",
    },
  },
};

/** Renewal price for a tier in a given WTP cell (0 for free). */
export const renewalPriceForCell = (tier: Tier, cell: WtpCell): number =>
  tier === "free" ? 0 : WTP_CELLS[cell].renewal[tier];

/** Stripe checkout link for a paid tier in a given WTP cell. */
export const stripeLinkForCell = (tier: Exclude<Tier, "free">, cell: WtpCell): string =>
  WTP_CELLS[cell].links[tier] || STRIPE_PAYMENT_LINKS[tier];

export function limitsFor(tier: Tier): TierLimits {
  return TIERS[tier].limits;
}

/** The tier a user must reach to unlock a given gated feature. */
export function requiredTierFor(feature: GatedFeature): Tier {
  return FEATURE_MIN_TIER[feature];
}
