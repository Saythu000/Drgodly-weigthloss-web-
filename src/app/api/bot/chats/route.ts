import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sessionDir = path.join(process.cwd(), '.openclaw-local', 'sessions');
    const contactsFile = path.join(process.cwd(), '.openclaw-local', 'contacts.json');

    // Read saved custom contact names
    let contactsMap: Record<string, { name: string; phone: string }> = {};
    if (fs.existsSync(contactsFile)) {
      try {
        contactsMap = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
      } catch (e) {}
    }

    const jids: string[] = [];

    if (fs.existsSync(sessionDir)) {
      const files = fs.readdirSync(sessionDir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const safe = file.slice(0, -6);
          const jid = safe
            .replace(/_s.whatsapp.net$/, '@s.whatsapp.net')
            .replace(/_c.us$/, '@c.us')
            .replace(/_lid$/, '@lid');
          jids.push(jid);
        }
      }
    }

    // Fetch Intakes from Neon PostgreSQL
    const intakes = await prisma.intake.findMany().catch(() => []);
    const eligibilities = await prisma.eligibility.findMany().catch(() => []);

    const chats: any[] = [];
    const seenNumbers = new Set<string>();

    for (const jid of jids) {
      const rawNum = (jid.split('@')[0] || '').split(':')[0] || '';
      if (!rawNum) continue;

      // Skip internal LID IDs (digits length >= 14 starting with 1088) if we already have a real phone number
      const isLid = jid.endsWith('@lid') || (rawNum.length >= 14 && rawNum.startsWith('1088'));

      const intake = intakes.find((i) => {
        const dbPhone = i.phone.replace(/[^\d]/g, '');
        const waPhone = rawNum.replace(/[^\d]/g, '');
        return dbPhone.endsWith(waPhone) || waPhone.endsWith(dbPhone);
      });

      let status = 'Lead';
      if (intake) {
        const eligibility = eligibilities.find((e) => e.userId === intake.userId);
        if (eligibility) {
          status = eligibility.status === 'eligible' ? 'Healthy' : 'Doctor Review';
        }
      }

      // Read recent message from session JSONL file
      let lastMsg = 'Active WhatsApp session';
      let lastTime = Date.now();

      try {
        const safe = jid.replace(/[^a-zA-Z0-9._@-]/g, '_');
        const filePath = path.join(sessionDir, `${safe}.jsonl`);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          lastTime = stats.mtimeMs;

          const lines = fs.readFileSync(filePath, 'utf8').trim().split('\n');
          if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            if (lastLine) {
              const parsed = JSON.parse(lastLine);
              if (parsed.content) lastMsg = parsed.content;
            }
          }
        }
      } catch (err) {}

      // Priority 1: Admin Saved Custom Contact Name
      // Priority 2: Database Patient Intake Name
      // Priority 3: Formatted Real Phone Number (e.g. +91 9390834107)
      const savedContact = contactsMap[jid] || contactsMap[rawNum];
      let displayName = '';
      let displayPhone = `+${rawNum}`;

      if (savedContact && savedContact.name) {
        displayName = savedContact.name;
        if (savedContact.phone) displayPhone = savedContact.phone;
      } else if (intake) {
        displayName = `${intake.firstName} ${intake.lastName}`;
        displayPhone = intake.phone;
      } else {
        // Formatted Phone Number (digits only, e.g. +919390834107)
        displayName = `+${rawNum}`;
      }

      const initial = (displayName.replace('+', '')[0] || 'P').toUpperCase();

      chats.push({
        id: jid,
        jid,
        isLid,
        name: displayName,
        phone: displayPhone,
        state: intake ? intake.shippingState || '—' : '—',
        status,
        lastMsg,
        time: new Date(lastTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        timestamp: lastTime,
        aiActive: true,
        avatar: initial,
        bmi: intake && intake.height && intake.weight
          ? `${(intake.weight / Math.pow(intake.height / 100, 2)).toFixed(1)}`
          : '—',
        allergies: intake && intake.healthData ? (intake.healthData as any).allergies || 'None' : 'None',
        intake: intake || null,
      });
    }

    // Sort by latest message timestamp
    chats.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      chats,
    });
  } catch (error) {
    console.error('Failed to fetch WhatsApp chats:', error);
    return NextResponse.json({
      success: true,
      chats: [],
    });
  }
}
