import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { sendWaTextMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

function getWebhookSecret(): string {
  try {
    const settingsPath = path.join(process.cwd(), '.openclaw-local', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.razorpayWebhookSecret) return data.razorpayWebhookSecret;
    }
  } catch (e) {}
  return process.env.RAZORPAY_WEBHOOK_SECRET || 'drgodly_webhook_secret_2026';
}

function getCalendarLink(): string {
  try {
    const settingsPath = path.join(process.cwd(), '.openclaw-local', 'settings.json');
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (data.calendarLink) return data.calendarLink;
    }
  } catch (e) {}
  return process.env.CALENDAR_BOOKING_LINK || 'https://cal.com/drgodly/telehealth-consultation';
}

function readJson<T>(file: string, fallback: T): T {
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {}
  }
  return fallback;
}

function writeJson(file: string, data: any) {
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const secret = getWebhookSecret();

    // 1. HMAC SHA256 Signature Verification
    if (secret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.error('⛔ Razorpay Webhook Invalid Signature!');
        return NextResponse.json({ success: false, error: 'Invalid HMAC signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`🔔 Razorpay Webhook Received Event: ${event}`);

    // Filter relevant payment events
    if (event === 'payment_link.paid' || event === 'payment.captured' || event === 'order.paid') {
      const entity = payload.payload?.payment_link?.entity || payload.payload?.payment?.entity || {};
      const notes = entity.notes || {};
      
      // Extract phone number from notes or contact field
      let rawPhone = notes.phone_number || notes.phone || entity.contact || '';
      let cleanPhone = String(rawPhone).replace(/\D/g, '');

      // Fallback: If contact starts with country code, keep standard 10-12 digits
      if (!cleanPhone && notes.email) {
        console.log(`Searching orders by email: ${notes.email}`);
      }

      console.log(`💳 Razorpay Payment Verified for Phone: +${cleanPhone}`);

      // 2. Update Database & Local Storage Payment Status
      const ORDERS_FILE = path.join(process.cwd(), '.openclaw-local', 'orders.json');
      const orders = readJson<any[]>(ORDERS_FILE, []);
      const existingOrderIndex = orders.findIndex(
        (o) => o.phone && o.phone.replace(/\D/g, '') === cleanPhone
      );

      if (existingOrderIndex !== -1) {
        orders[existingOrderIndex].paymentStatus = 'VERIFIED';
        orders[existingOrderIndex].orderStatus = 'PAID';
        orders[existingOrderIndex].razorpayPaymentId = entity.id || entity.payment_id;
        writeJson(ORDERS_FILE, orders);
      } else {
        orders.unshift({
          id: `RZP-${entity.id || Math.floor(1000 + Math.random() * 9000)}`,
          phone: `+${cleanPhone}`,
          amount: entity.amount ? entity.amount / 100 : 500,
          paymentStatus: 'VERIFIED',
          orderStatus: 'PAID',
          createdAt: new Date().toISOString(),
        });
        writeJson(ORDERS_FILE, orders);
      }

      // 3. Instant Calendar Booking Link WhatsApp Auto-Dispatch
      if (cleanPhone) {
        const calLink = getCalendarLink();
        const targetJid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
        
        const messageText = [
          `✅ *PAYMENT VERIFIED!*`,
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
          `Thank you for completing your consultation payment. Your GLP-1 telehealth assessment profile is active!`,
          ``,
          `📅 *STEP 2 OF 2: Pick Your Appointment Slot*`,
          `Please click the link below to select your consultation time slot on Dr. Kalyan's calendar:`,
          ``,
          `🔗 *Calendar Booking Link:*`,
          `${calLink}`,
          ``,
          `*(After selecting your slot, you will receive a WhatsApp booking confirmation card with your exact appointment time!)* 🩺✨`,
        ].join('\n');

        try {
          await sendWaTextMessage(targetJid, messageText);
          console.log(`📱 Instant Calendar Booking Link dispatched over WhatsApp to +${cleanPhone}`);
        } catch (waErr) {
          console.error('Failed to send WhatsApp calendar link:', waErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified and Calendar link dispatched to WhatsApp',
      });
    }

    return NextResponse.json({ success: true, message: 'Event ignored' });
  } catch (error: any) {
    console.error('Razorpay Webhook Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
