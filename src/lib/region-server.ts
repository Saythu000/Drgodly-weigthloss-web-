import { headers } from "next/headers";
import { RegionConfig, REGION_MAPPING } from "./region-config";

/**
 * Automatically detects the user's region.
 * 
 * Works across:
 * 1. Vercel (x-vercel-ip-country)
 * 2. Cloudflare (cf-ipcountry) - Highly recommended for VPS deployments
 * 3. Custom Proxy (x-country-code)
 * 
 * MUST only be called from Server Components or Route Handlers.
 */
export async function getDetectedRegion(): Promise<RegionConfig> {
  const headerList = await headers();
  
  // Try different common headers for country detection
  const countryCode = 
    headerList.get("x-vercel-ip-country") || 
    headerList.get("cf-ipcountry") || 
    headerList.get("x-country-code") || 
    "US"; // Default to US if detection fails

  const config = REGION_MAPPING[countryCode] || REGION_MAPPING.DEFAULT;

  return {
    country: countryCode,
    ...config,
  };
}
