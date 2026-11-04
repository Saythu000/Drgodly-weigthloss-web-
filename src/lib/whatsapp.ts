/**
 * WhatsApp Cloud API Client & Helpers
 * Supports Meta WhatsApp Business Cloud API (Graph API v21.0)
 */

export interface SendWhatsAppMessageOptions {
  to: string;
  body: string;
  previewUrl?: boolean;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Normalizes phone numbers to standard WhatsApp international format (digits only, no + or spaces).
 * Defaults Indian numbers without country code to 91.
 */
export function normalizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    // 10 digit Indian mobile number
    return `91${digits}`;
  }
  return digits;
}

/**
 * Gets configured WhatsApp Business phone number for public display / click-to-chat links.
 */
export function getWhatsAppBusinessNumber(): string {
  const envNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || process.env.WHATSAPP_BUSINESS_NUMBER;
  if (envNumber) {
    return normalizeWhatsAppNumber(envNumber);
  }
  // Default placeholder for DrGodly Clinical Care WhatsApp
  return "919876543210";
}

/**
 * Generates a direct wa.me link with an optional prefilled message
 */
export function generateWhatsAppLink(message?: string): string {
  const phone = getWhatsAppBusinessNumber();
  const defaultMessage = "Hi DrGodly! I'd like to check my qualification for the doctor-guided weight loss program.";
  const encoded = encodeURIComponent(message || defaultMessage);
  return `https://wa.me/${phone}?text=${encoded}`;
}

/**
 * Sends a text message via Meta WhatsApp Business Cloud API.
 * If credentials are not configured (e.g. in development/tests), logs the message gracefully.
 */
export async function sendWhatsAppTextMessage(
  options: SendWhatsAppMessageOptions
): Promise<WhatsAppSendResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const recipient = normalizeWhatsAppNumber(options.to);

  if (!phoneNumberId || !accessToken) {
    console.warn(
      `[WhatsApp] WhatsApp credentials not configured. Mock sending message to ${recipient}: "${options.body.substring(0, 80)}..."`
    );
    return {
      success: true,
      messageId: `mock_msg_${Date.now()}`,
    };
  }

  const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "text",
        text: {
          preview_url: options.previewUrl ?? true,
          body: options.body,
        },
      }),
    });

    const data = (await res.json()) as Record<string, any>;

    if (!res.ok) {
      console.error("[WhatsApp] Meta API error sending message:", data);
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp message",
      };
    }

    const messageId = data.messages?.[0]?.id;
    return {
      success: true,
      messageId,
    };
  } catch (error) {
    console.error("[WhatsApp] Exception sending WhatsApp message:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Marks an incoming WhatsApp message as read to show blue ticks.
 */
export async function markWhatsAppMessageRead(messageId: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken || !messageId) {
    return false;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: messageId,
      }),
    });
    return true;
  } catch (e) {
    console.warn("[WhatsApp] Failed to mark message as read:", e);
    return false;
  }
}
