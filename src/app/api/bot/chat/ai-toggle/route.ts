import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jid, active } = body;

    if (!jid) {
      return NextResponse.json(
        { success: false, error: 'JID parameter is required' },
        { status: 400 }
      );
    }

    const settingsPath = path.join(process.cwd(), '.openclaw-local', 'ai-settings.json');
    let aiSettings: Record<string, boolean> = {};

    if (fs.existsSync(settingsPath)) {
      try {
        aiSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      } catch (e) {}
    }

    aiSettings[jid] = Boolean(active);

    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(aiSettings, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      jid,
      aiActive: aiSettings[jid],
    });
  } catch (error) {
    console.error('Failed to toggle AI chat state:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
