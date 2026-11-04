/**
 * Unit conversion utilities between Metric and Imperial systems.
 */
export const units = {
  inchesToCm: (inches: number) => inches * 2.54,
  cmToInches: (cm: number) => cm / 2.54,
  lbsToKg: (lbs: number) => lbs * 0.453592,
  kgToLbs: (kg: number) => kg / 0.453592,
};

/**
 * Formats a numeric amount into a localized currency string.
 */
export function formatCurrency(amount: number, currency: string = "USD", locale: string = "en-US") {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(amount);
  } catch (error) {
    console.error("Currency formatting error:", error);
    return `${currency} ${amount.toFixed(2)}`;
  }
}

/**
 * Ensures a URL string has a protocol (http/https).
 * If the URL is just a domain (like 'vercel.app'), it defaults to 'https://'.
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative path, keep it
  if (url.startsWith('/')) {
    return url;
  }

  // Otherwise assume https for external/domain URLs
  return `https://${url}`;
}

/**
 * Returns the base URL of the application.
 * Prioritizes NEXT_PUBLIC_APP_URL, then BETTER_AUTH_URL, then a fallback.
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  if (url) return sanitizeUrl(url) || "http://localhost:3000";
  
  // Vercel specific fallback if the others are missing
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  
  return "http://localhost:3000";
}
