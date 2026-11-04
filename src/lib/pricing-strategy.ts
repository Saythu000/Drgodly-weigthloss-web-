export type PricingBand = "affordable" | "standard" | "premium";

export interface PricingStrategyTier {
  band: PricingBand;
  title: string;
  medication: string;
  formFactor: string;
  monthlyRangeINR: {
    min: number;
    max?: number;
  };
  includes: string[];
  audience: string;
}

export const TIERED_PRICING_STRATEGY: PricingStrategyTier[] = [
  // Tier 1 is the entry point: lowest-friction semaglutide delivered in a vial/syringe format.
  {
    band: "affordable",
    title: "Tier 1: The Mass-Market Disruptor",
    medication: "Generic Semaglutide",
    formFactor: "Vial + syringe",
    monthlyRangeINR: { min: 1999, max: 2499 },
    includes: [
      "Doctor consultation",
      "4 weeks of vials/syringes",
      "Basic WhatsApp chat support",
    ],
    audience: "Built for the Indian middle class and users who want the lowest entry price.",
  },
  // Tier 2 keeps the same medication family but packages it as a more premium pen experience.
  {
    band: "standard",
    title: "Tier 2: The Premium Slick Experience",
    medication: "Generic Semaglutide",
    formFactor: "Pre-filled / reusable pen",
    monthlyRangeINR: { min: 3999, max: 4999 },
    includes: [
      "Doctor consultation",
      "4 weeks of medication",
      "Priority WhatsApp support",
    ],
    audience: "Built for users who want a smoother injection experience and a more premium feel.",
  },
  // Tier 3 is reserved for the highest-efficacy medication path.
  {
    band: "premium",
    title: "Tier 3: The High-Efficacy Tier",
    medication: "Tirzepatide",
    formFactor: "Premium injection",
    monthlyRangeINR: { min: 6000 },
    includes: [
      "Doctor consultation",
      "4 weeks of medication",
      "Higher-intensity support",
    ],
    audience: "Built for patients with stronger metabolic resistance or those switching from semaglutide.",
  },
];

type ProductLike = {
  drugType?: string;
  activeIngredient?: string | null;
  formFactor?: string | null;
  name?: string;
};

export function getPricingTierForProduct(product: ProductLike): PricingStrategyTier {
  // Keep the mapping deterministic: product metadata, then form factor, then fallback.
  const drugType = `${product.drugType ?? ""} ${product.activeIngredient ?? ""} ${product.name ?? ""}`.toLowerCase();
  const formFactor = (product.formFactor ?? "").toLowerCase();

  if (drugType.includes("tirzepatide")) {
    return TIERED_PRICING_STRATEGY[2];
  }

  if (drugType.includes("liraglutide")) {
    return TIERED_PRICING_STRATEGY[1];
  }

  if (drugType.includes("semaglutide") && formFactor.includes("pen")) {
    return TIERED_PRICING_STRATEGY[1];
  }

  return TIERED_PRICING_STRATEGY[0];
}

export function formatTierMonthlyPrice(tier: PricingStrategyTier) {
  // The UI only needs a readable price band, not a database-grade price calculation here.
  const min = formatINR(tier.monthlyRangeINR.min);
  if (tier.monthlyRangeINR.max) {
    return `${min} - ${formatINR(tier.monthlyRangeINR.max)}/mo`;
  }

  return `${min}+/mo`;
}

export function getLowestEntryPriceLabel(country: string, locale = "en-IN") {
  // Landing page copy only highlights the lowest India entry point; other regions get generic copy.
  if (country !== "IN") {
    return "Localized pricing shown after intake";
  }

  return `Lowest medication option from ${formatINR(TIERED_PRICING_STRATEGY[0].monthlyRangeINR.min, locale)}/mo`;
}

function formatINR(amount: number, locale = "en-IN") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
