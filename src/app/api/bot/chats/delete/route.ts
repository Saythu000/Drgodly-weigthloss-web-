import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jid } = body;

    if (!jid) {
      return NextResponse.json(
        { success: false, error: 'JID parameter is required' },
        { status: 400 }
      );
    }

    const sessionDir = path.join(process.cwd(), '.openclaw-local', 'sessions');
    const contactsFile = path.join(process.cwd(), '.openclaw-local', 'contacts.json');
    const rawNum = (jid.split('@')[0] || '').split(':')[0].replace(/[^\d]/g, '');

    // 1. LAYER 1: Chat Session Files Purge
    if (fs.existsSync(sessionDir)) {
      const files = fs.readdirSync(sessionDir);
      for (const file of files) {
        if (file.endsWith('.jsonl')) {
          const safeJid = jid.replace(/[^a-zA-Z0-9._@-]/g, '_');
          if (
            file === `${safeJid}.jsonl` ||
            (rawNum && file.startsWith(rawNum))
          ) {
            try {
              fs.unlinkSync(path.join(sessionDir, file));
            } catch (e) {}
          }
        }
      }
    }

    // 2. LAYER 2: Contact Name Map Purge
    if (fs.existsSync(contactsFile)) {
      try {
        const contactsMap = JSON.parse(fs.readFileSync(contactsFile, 'utf8'));
        delete contactsMap[jid];
        if (rawNum) {
          delete contactsMap[rawNum];
          delete contactsMap[`+${rawNum}`];
        }
        fs.writeFileSync(contactsFile, JSON.stringify(contactsMap, null, 2), 'utf8');
      } catch (e) {}
    }

    // 3. LAYER 3: Database CRM Intake & Eligibility Records Purge (Neon PostgreSQL)
    let deletedIntakesCount = 0;
    if (rawNum) {
      try {
        const matchingIntakes = await prisma.intake.findMany();
        const intakeIdsToDelete = matchingIntakes
          .filter((i) => {
            const dbPhone = i.phone.replace(/[^\d]/g, '');
            return dbPhone.endsWith(rawNum) || rawNum.endsWith(dbPhone);
          })
          .map((i) => i.id);

        if (intakeIdsToDelete.length > 0) {
          const userIdsToDelete = matchingIntakes
            .filter((i) => intakeIdsToDelete.includes(i.id))
            .map((i) => i.userId);

          await prisma.eligibility.deleteMany({
            where: { userId: { in: userIdsToDelete } },
          });

          const delRes = await prisma.intake.deleteMany({
            where: { id: { in: intakeIdsToDelete } },
          });

          deletedIntakesCount = delRes.count;
        }
      } catch (dbErr) {
        console.error('Failed to purge database intake records:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully purged contact session, contact mapping, and ${deletedIntakesCount} CRM intake records for ${jid}`,
    });
  } catch (error: any) {
    console.error('Failed to delete contact and chat:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
