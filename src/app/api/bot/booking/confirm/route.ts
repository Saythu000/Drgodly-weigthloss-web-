import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { sendWaTextMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

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
    const body = await request.json();
    const { phone, date, timeSlot, patientName } = body;

    if (!phone) {
      return NextResponse.json({ success: false, error: 'Phone number is required' }, { status: 400 });
    }

    const cleanPhone = String(phone).replace(/\D/g, '');
    const targetJid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;

    const apptDate = date || 'Tomorrow';
    const apptSlot = timeSlot || '10:30 AM IST';
    const name = patientName || 'Patient';

    // 1. Update local booking record
    const BOOKINGS_FILE = path.join(process.cwd(), '.openclaw-local', 'bookings.json');
    const bookings = readJson<any[]>(BOOKINGS_FILE, []);
    bookings.unshift({
      phone: `+${cleanPhone}`,
      patientName: name,
      doctor: 'Dr. Kalyan Chakravarthy Kalwa',
      date: apptDate,
      timeSlot: apptSlot,
      createdAt: new Date().toISOString(),
    });
    writeJson(BOOKINGS_FILE, bookings);

    // 2. Dispatch WhatsApp Confirmation Card
    const confirmationMessage = [
      `🎉 *DOCTOR CONSULTATION CONFIRMED!*`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `👤 *Patient:* ${name}`,
      `👨‍⚕️ *Doctor:* Dr. Kalyan Chakravarthy Kalwa`,
      `📅 *Date:* ${apptDate}`,
      `⏰ *Time Slot:* ${apptSlot}`,
      `📍 *Location:* DrGodly Telehealth Video Consultation`,
      ``,
      `📋 *Pre-Consultation Guidelines:*`,
      `1. Please be ready with a stable internet connection 5 minutes before your scheduled slot.`,
      `2. Dr. Kalyan will review your GLP-1 intake answers & BMI profile during your video call.`,
      ``,
      `If you need to reschedule, please notify us here on WhatsApp at least 2 hours in advance. See you soon! 🩺✨`,
    ].join('\n');

    try {
      await sendWaTextMessage(targetJid, confirmationMessage);
      console.log(`📱 WhatsApp Booking Confirmation Card dispatched to +${cleanPhone}`);
    } catch (waErr) {
      console.error('Failed to send WhatsApp booking confirmation:', waErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Booking confirmed and WhatsApp confirmation card sent',
    });
  } catch (error: any) {
    console.error('Booking confirmation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
