import { RegionConfig } from "./region-config";

export interface PlanPriceRow {
  country: string;
  currency: string;
  amount: number;
}

export function getPlanPriceForRegion(
  prices: PlanPriceRow[],
  region: Pick<RegionConfig, "country">
) {
  // Prefer the user's country, fall back to US, then the first available row.
  const price =
    prices.find((item) => item.country === region.country) ||
    prices.find((item) => item.country === "US") ||
    prices[0];

  if (!price) {
    throw new Error("Plan is missing country pricing.");
  }

  return price;
}

export function getCountryPriceMap(prices: PlanPriceRow[]) {
  // These maps are used when the API has to serialize Prisma rows into plain JSON.
  return prices.reduce<Record<string, number>>((result, price) => {
    result[price.country] = price.amount;
    return result;
  }, {});
}

export function getCountryCurrencyMap(prices: PlanPriceRow[]) {
  // The checkout UI needs a simple country -> currency lookup for display.
  return prices.reduce<Record<string, string>>((result, price) => {
    result[price.country] = price.currency;
    return result;
  }, {});
}

export function getDoseMultiplierForFormFactor(formFactor: string) {
  const normalized = formFactor.toLowerCase();

  // Weekly-dose products and pen/vial formats are billed as four doses per month.
  if (
    normalized.includes("injection") ||
    normalized.includes("injectable") ||
    normalized.includes("pen") ||
    normalized.includes("vial") ||
    normalized.includes("syringe")
  ) {
    return 4;
  }

  return 1;
}

export function getBillablePlanPrices(prices: PlanPriceRow[], formFactor: string) {
  // Convert a single-dose catalog price into the monthly billable amount before rendering.
  const doseMultiplier = getDoseMultiplierForFormFactor(formFactor);

  return prices.map((price) => ({
    ...price,
    amount: price.amount * doseMultiplier,
  }));
}

export function getBillablePlanPriceForRegion(
  prices: PlanPriceRow[],
  region: Pick<RegionConfig, "country">,
  formFactor: string
) {
  // Region-first selection, then apply the dose multiplier for billable checkout totals.
  return getPlanPriceForRegion(getBillablePlanPrices(prices, formFactor), region);
}

export function getStartingMonthlyPriceFromRows<
  T extends { durationMonths: number; prices: PlanPriceRow[] }
>(plans: T[], region: Pick<RegionConfig, "country">) {
  if (plans.length === 0) {
    return null;
  }

  // Useful for "from" pricing where we only need the cheapest monthly equivalent.
  return Math.min(
    ...plans.map((plan) => {
      const price = getPlanPriceForRegion(plan.prices, region);
      return price.amount / plan.durationMonths;
    })
  );
}

export function getConsultationFee(currency: string) {
  // Consultation and shipping are only charged in INR right now.
  return currency === "INR" ? 49 : 0;
}

export function getShippingFee(currency: string) {
  // Shipping is a fixed India-only fee for the current checkout flow.
  return currency === "INR" ? 100 : 0;
}

export function getOrderTotal(planAmount: number, currency: string) {
  // Total order amount is the medication + service fees.
  return planAmount + getConsultationFee(currency) + getShippingFee(currency);
}
