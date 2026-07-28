import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jid, phone, name } = body;

    if (!jid || !name) {
      return NextResponse.json(
        { success: false, error: 'JID and contact name are required' },
        { status: 400 }
      );
    }

    const contactsFile = path.join(process.cwd(), '.openclaw-local', 'contacts.json');
    const dir = path.dirname(contactsFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let contactsMap: Record<string, { name: string; phone: string; updatedAt: string }> = {};

    if (fs.existsSync(contactsFile)) {
      try {
        contactsMap = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
      } catch (e) {}
    }

    const cleanedJid = jid.trim();
    const cleanedPhone = phone ? phone.trim() : `+${cleanedJid.split('@')[0]}`;
    const cleanName = name.trim();

    contactsMap[cleanedJid] = {
      name: cleanName,
      phone: cleanedPhone,
      updatedAt: new Date().toISOString(),
    };

    // Also index by raw digits for fast lookup
    const digits = cleanedJid.split('@')[0].replace(/[^\d]/g, '');
    if (digits) {
      contactsMap[digits] = {
        name: cleanName,
        phone: cleanedPhone,
        updatedAt: new Date().toISOString(),
      };
    }

    fs.writeFileSync(contactsFile, JSON.stringify(contactsMap, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      message: `Saved contact name "${cleanName}" for ${cleanedPhone}`,
      contact: contactsMap[cleanedJid],
    });
  } catch (error: any) {
    console.error('Failed to save contact name:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
