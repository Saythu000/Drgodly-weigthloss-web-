import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jid = searchParams.get('jid');

    if (!jid) {
      return NextResponse.json({
        success: false,
        error: 'JID parameter is required',
        messages: [],
      });
    }

    const sessionDir = path.join(process.cwd(), '.openclaw-local', 'sessions');
    const safeJid = jid.replace(/[^a-zA-Z0-9._@-]/g, '_');
    const filePath = path.join(sessionDir, `${safeJid}.jsonl`);

    const messages: any[] = [];

    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').trim();
      const lines = content ? content.split('\n') : [];

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line);
          const role = parsed.role === 'user' ? 'patient' : parsed.role === 'agent' ? 'bot' : 'user';
          const text = parsed.content || parsed.text || '';
          const time = parsed.ts
            ? new Date(parsed.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          messages.push({
            sender: role,
            text,
            time,
            timestamp: parsed.ts || Date.now(),
          });
        } catch (e) {}
      }
    }

    // Default sample conversation if session file is empty or new
    if (messages.length === 0) {
      messages.push(
        { sender: 'patient', text: 'Hi, I am interested in starting GLP-1 treatment.', time: '10:14 AM', timestamp: Date.now() - 600000 },
        { sender: 'bot', text: 'Hello! Welcome to DrGodly Telehealth CRM. Please complete your medical intake.', time: '10:14 AM', timestamp: Date.now() - 500000 },
        { sender: 'patient', text: 'I completed my form. When will Doctor Kalyan review my intake?', time: '10:15 AM', timestamp: Date.now() - 300000 }
      );
    }

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Failed to fetch chat messages:', error);
    return NextResponse.json({
      success: true,
      messages: [],
    });
  }
}
