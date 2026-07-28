import { NextResponse } from 'next/server';
import { sendWaTextMessage } from '@/lib/wa-client';
import { IntakeWizard } from '@/lib/intake-wizard';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const wizard = new IntakeWizard();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jid, text, isIncoming } = body;

    if (!jid || !text) {
      return NextResponse.json(
        { success: false, error: 'JID and text parameters are required' },
        { status: 400 }
      );
    }

    // 1. Dispatch message directly via drgodly-web's native Baileys WhatsApp Engine
    const dispatchResult = await sendWaTextMessage(jid, text);

    // 2. Ensure message is logged to local session JSONL file for UI history display
    const sessionDir = path.join(process.cwd(), '.openclaw-local', 'sessions');
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const safeJid = jid.replace(/[^a-zA-Z0-9._@-]/g, '_');
    const filePath = path.join(sessionDir, `${safeJid}.jsonl`);

    const msgObj = {
      role: 'user',
      content: text,
      ts: Date.now(),
    };

    try {
      if (!dispatchResult.success) {
        fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');
      }
    } catch (e) {}

    // 3. Process message through GLP-1 IntakeWizard State Machine if incoming or testing intake
    let autoReply: string | null = null;
    if (isIncoming || text.toLowerCase().includes('intake') || text.toLowerCase().includes('hi') || text.toLowerCase().includes('cm')) {
      autoReply = await wizard.handleInbound(jid, text);
      if (autoReply) {
        await sendWaTextMessage(jid, autoReply);
        const replyObj = { role: 'assistant', content: autoReply, ts: Date.now() };
        fs.appendFileSync(filePath, JSON.stringify(replyObj) + '\n', 'utf8');
      }
    }

    return NextResponse.json({
      success: true,
      sentToWhatsapp: dispatchResult.success,
      messageId: dispatchResult.messageId,
      error: dispatchResult.error,
      autoReply,
      message: dispatchResult.success
        ? 'Message dispatched natively to recipient phone via WhatsApp'
        : 'Saved to local chat thread (Scan QR Code in Settings to connect live WhatsApp)',
      messageObj: msgObj,
    });
  } catch (error) {
    console.error('Failed to send WhatsApp message:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
