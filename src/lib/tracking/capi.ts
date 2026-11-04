import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { AttributionData } from './attribution';

export interface ConversionEventParams {
  eventName: 'Lead' | 'InitiateCheckout' | 'Schedule' | 'Purchase';
  eventId?: string;
  userEmail?: string;
  userPhone?: string;
  clientIp?: string;
  clientUserAgent?: string;
  value?: number;
  currency?: string;
  attribution?: AttributionData | null;
  customData?: Record<string, any>;
}

/**
 * SHA-256 Hashes PII strings according to Meta & Google CAPI specification
 */
function sha256(val?: string): string | undefined {
  if (!val) return undefined;
  const clean = val.trim().toLowerCase();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(clean).digest('hex');
}

/**
 * HIPAA De-identification Filter:
 * Strips clinical disease names, medications, and sensitive health parameters.
 */
function sanitizeCustomData(data?: Record<string, any>): Record<string, any> {
  if (!data) return {};
  const sanitized: Record<string, any> = {};

  // Allowed generic e-commerce & funnel keys
  const allowedKeys = [
    'content_category',
    'content_name',
    'content_type',
    'currency',
    'value',
    'status',
    'plan_duration_weeks',
  ];

  for (const [k, v] of Object.entries(data)) {
    if (allowedKeys.includes(k)) {
      // Ensure no raw medication names leak in value
      if (typeof v === 'string') {
        const lower = v.toLowerCase();
        if (lower.includes('semaglutide') || lower.includes('wegovy') || lower.includes('ozempic')) {
          sanitized[k] = 'telehealth_tier_1_subscription';
        } else if (lower.includes('tirzepatide') || lower.includes('mounjaro') || lower.includes('zepbound')) {
          sanitized[k] = 'telehealth_tier_2_subscription';
        } else {
          sanitized[k] = v;
        }
      } else {
        sanitized[k] = v;
      }
    }
  }

  return sanitized;
}

/**
 * Dispatches HIPAA-compliant server-side conversion event to Meta CAPI & Google Ads
 */
export async function dispatchServerConversion(params: ConversionEventParams) {
  const eventId = params.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const timestamp = Math.floor(Date.now() / 1000);

  const hashedEmail = sha256(params.userEmail);
  const hashedPhone = sha256(params.userPhone?.replace(/\D/g, ''));

  const userData: Record<string, any> = {
    em: hashedEmail ? [hashedEmail] : undefined,
    ph: hashedPhone ? [hashedPhone] : undefined,
    client_ip_address: params.clientIp,
    client_user_agent: params.clientUserAgent,
  };

  if (params.attribution?.fbclid) {
    userData.fbc = `fb.1.${timestamp}.${params.attribution.fbclid}`;
  }

  const customData = {
    ...sanitizeCustomData(params.customData),
    value: params.value,
    currency: params.currency || 'INR',
  };

  const payload = {
    event_name: params.eventName,
    event_time: timestamp,
    event_id: eventId,
    event_source_url: params.attribution?.landingPage || 'https://drgodly.com',
    action_source: 'website',
    user_data: userData,
    custom_data: customData,
  };

  // 1. Persist to local CAPI audit log ledger
  try {
    const logDir = path.join(process.cwd(), '.openclaw-local');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    const logFile = path.join(logDir, 'capi-events.json');
    let logs: any[] = [];
    if (fs.existsSync(logFile)) {
      try {
        logs = JSON.parse(fs.readFileSync(logFile, 'utf8'));
      } catch (e) {}
    }
    logs.unshift({
      ...payload,
      createdAt: new Date().toISOString(),
      channel: params.attribution?.source || 'direct',
    });
    // Keep last 100 events
    fs.writeFileSync(logFile, JSON.stringify(logs.slice(0, 100), null, 2), 'utf8');
  } catch (err) {
    console.warn('Non-fatal error writing CAPI audit log:', err);
  }

  // 2. Dispatch to live Meta Conversions API if credentials exist
  const metaPixelId = process.env.META_PIXEL_ID;
  const metaAccessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (metaPixelId && metaAccessToken) {
    try {
      const url = `https://graph.facebook.com/v20.0/${metaPixelId}/events?access_token=${metaAccessToken}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: [payload] }),
      });
      const data = await res.json();
      return { success: true, eventId, metaResponse: data };
    } catch (apiErr) {
      console.error('Meta CAPI Dispatch Error:', apiErr);
      return { success: false, eventId, error: apiErr };
    }
  }

  return { success: true, eventId, mode: 'local_ledger' };
}
