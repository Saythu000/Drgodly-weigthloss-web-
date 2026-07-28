import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { sendWaTextMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

const ORDERS_FILE = path.join(process.cwd(), '.openclaw-local', 'orders.json');

const DEFAULT_ORDERS = [
  {
    id: 'ORD-9021',
    phone: '+919390834107',
    patientName: 'Kalyan Sontha',
    medication: 'Wegovy 0.25mg Weekly Injection Pen',
    amount: 5660,
    shippingAddress: 'Plot 42, Jubilee Hills, Hyderabad, Telangana - 500033',
    utrNumber: '420918274012',
    paymentStatus: 'UNVERIFIED',
    orderStatus: 'PAYMENT_PENDING',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ORD-9020',
    phone: '+919876543210',
    patientName: 'Priya Sharma',
    medication: 'Rybelsus 7mg Daily Tablets',
    amount: 3300,
    shippingAddress: 'Flat 302, Green Glen Layout, Bangalore, Karnataka - 560103',
    utrNumber: '319204857192',
    paymentStatus: 'VERIFIED',
    orderStatus: 'PAYMENT_VERIFIED',
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

function readJsonFile(filePath: string, defaultVal: any) {
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return defaultVal;
}

function writeJsonFile(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  try {
    const orders = readJsonFile(ORDERS_FILE, DEFAULT_ORDERS);
    return NextResponse.json({ success: true, orders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, orderId, courierName, trackingAwb } = body;

    let orders = readJsonFile(ORDERS_FILE, DEFAULT_ORDERS);
    const orderIndex = orders.findIndex((o: any) => o.id === orderId);

    if (orderIndex === -1) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const targetOrder = orders[orderIndex];
    const phone = targetOrder.phone;

    // Action 1: Method B Payment Verification Trigger
    if (action === 'verify-payment') {
      targetOrder.paymentStatus = 'VERIFIED';
      targetOrder.orderStatus = 'PAYMENT_VERIFIED';
      targetOrder.verifiedAt = new Date().toISOString();

      orders[orderIndex] = targetOrder;
      writeJsonFile(ORDERS_FILE, orders);

      const confirmMsg = [
        `✅ Payment Verified for Order #${targetOrder.id}!`,
        ``,
        `• Medication: ${targetOrder.medication}`,
        `• Amount Paid: ₹${targetOrder.amount}`,
        `• Status: ASSIGNED TO PHARMACY TEAM`,
        ``,
        `Your GLP-1 prescription order has been confirmed by Dr. Kalyan's medical team and will be packed and dispatched within 24 hours. Tracking details will be sent directly to your WhatsApp! 🩺📦`,
      ].join('\n');

      const waRes = await sendWaTextMessage(phone, confirmMsg);

      return NextResponse.json({
        success: true,
        message: 'Payment verified and 24-hour dispatch promise notification sent to patient!',
        order: targetOrder,
        waRes,
      });
    }

    // Action 2: Courier Dispatch & Tracking Update Trigger
    if (action === 'mark-dispatched') {
      if (!courierName || !trackingAwb) {
        return NextResponse.json({ success: false, error: 'courierName and trackingAwb are required' }, { status: 400 });
      }

      targetOrder.orderStatus = 'DISPATCHED';
      targetOrder.courierName = courierName;
      targetOrder.trackingAwb = trackingAwb;
      targetOrder.dispatchedAt = new Date().toISOString();

      orders[orderIndex] = targetOrder;
      writeJsonFile(ORDERS_FILE, orders);

      const courierSlug = courierName.toLowerCase().replace(/\s+/g, '');
      const trackingUrl = `https://${courierSlug}.com/track/${trackingAwb}`;

      const dispatchMsg = [
        `📦 Order #${targetOrder.id} Dispatched!`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `Your GLP-1 medication shipment is on its way via *${courierName}*.`,
        ``,
        `• Courier Partner: *${courierName}*`,
        `• Tracking AWB: *${trackingAwb}*`,
        `• Est. Delivery: 2-3 Business Days`,
        `• Live Tracker: ${trackingUrl}`,
        ``,
        `Thank you for choosing DrGodly Weight Loss Clinic! 🩺`,
      ].join('\n');

      const waRes = await sendWaTextMessage(phone, dispatchMsg);

      return NextResponse.json({
        success: true,
        message: 'Order marked as dispatched and tracking link sent to patient WhatsApp!',
        order: targetOrder,
        waRes,
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Failed to update order status:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
