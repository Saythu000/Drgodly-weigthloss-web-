/**
 * DrGodly Telehealth First-Party Attribution & UTM Tracking Engine
 * Captures, normalizes, and persists acquisition channels without client-side PHI exposure.
 */

export interface AttributionData {
  source: string; // e.g. "meta", "google", "youtube", "direct", "organic"
  medium: string; // e.g. "cpc", "stories", "reels", "search", "organic"
  campaign?: string; // e.g. "summer_wegovy_promo"
  content?: string;
  term?: string;
  gclid?: string; // Google Click ID
  fbclid?: string; // Meta Click ID
  referrer?: string;
  landingPage?: string;
  firstTouchAt: string;
}

export const ATTRIBUTION_COOKIE_NAME = '_dg_attr';

/**
 * Normalizes raw query params and headers into a standardized attribution object
 */
export function parseAttribution(
  searchParams: Record<string, string | undefined> | URLSearchParams,
  referrerHeader?: string | null,
  pathname: string = '/'
): AttributionData {
  const getParam = (key: string): string | undefined => {
    if (searchParams instanceof URLSearchParams) {
      return searchParams.get(key) || undefined;
    }
    return searchParams[key];
  };

  const utmSource = getParam('utm_source');
  const utmMedium = getParam('utm_medium');
  const utmCampaign = getParam('utm_campaign');
  const utmContent = getParam('utm_content');
  const utmTerm = getParam('utm_term');
  const gclid = getParam('gclid');
  const fbclid = getParam('fbclid');

  let normalizedSource = 'direct';
  let normalizedMedium = 'none';

  if (gclid) {
    normalizedSource = 'google';
    normalizedMedium = utmMedium || 'cpc';
  } else if (fbclid) {
    normalizedSource = 'meta';
    normalizedMedium = utmMedium || 'social_cpc';
  } else if (utmSource) {
    normalizedSource = utmSource.toLowerCase().trim();
    normalizedMedium = (utmMedium || 'referral').toLowerCase().trim();
  } else if (referrerHeader) {
    const ref = referrerHeader.toLowerCase();
    if (ref.includes('google.') || ref.includes('bing.') || ref.includes('yahoo.')) {
      normalizedSource = 'google_organic';
      normalizedMedium = 'organic_search';
    } else if (ref.includes('instagram.com') || ref.includes('facebook.com') || ref.includes('fb.com')) {
      normalizedSource = 'meta_organic';
      normalizedMedium = 'social_organic';
    } else if (ref.includes('youtube.com')) {
      normalizedSource = 'youtube';
      normalizedMedium = 'video';
    } else if (ref.includes('whatsapp') || ref.includes('wa.me')) {
      normalizedSource = 'whatsapp';
      normalizedMedium = 'chat';
    } else {
      normalizedSource = 'referral';
      normalizedMedium = 'web';
    }
  }

  return {
    source: normalizedSource,
    medium: normalizedMedium,
    campaign: utmCampaign || undefined,
    content: utmContent || undefined,
    term: utmTerm || undefined,
    gclid: gclid || undefined,
    fbclid: fbclid || undefined,
    referrer: referrerHeader || undefined,
    landingPage: pathname,
    firstTouchAt: new Date().toISOString(),
  };
}

/**
 * Human-readable badge formatting for Staff CRM
 */
export function formatAttributionBadge(attr?: AttributionData | null): {
  label: string;
  badgeClass: string;
} {
  if (!attr || !attr.source) {
    return {
      label: 'Direct / Unknown',
      badgeClass: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700',
    };
  }

  const s = attr.source.toLowerCase();

  if (s.includes('meta') || s.includes('facebook') || s.includes('instagram')) {
    return {
      label: attr.campaign ? `Meta: ${attr.campaign}` : 'Meta / Instagram Ad',
      badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
    };
  }

  if (s.includes('google')) {
    return {
      label: attr.campaign ? `Google: ${attr.campaign}` : 'Google Search Ads',
      badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };
  }

  if (s.includes('youtube')) {
    return {
      label: 'YouTube Ad',
      badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30',
    };
  }

  if (s.includes('whatsapp')) {
    return {
      label: 'WhatsApp Campaign',
      badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    };
  }

  return {
    label: attr.campaign ? `${attr.source} (${attr.campaign})` : attr.source,
    badgeClass: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
  };
}
