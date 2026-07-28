import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

const DEFAULT_SETTINGS = {
  openaiKey: '',
  geminiKey: '',
  syncInterval: '30',
  concurrency: '4',
  launchOnBoot: true,
  checkUpdates: true,
  systemPrompt:
    'You are an empathetic, professional intake assistant for DrGodly Weight Loss Telehealth Clinic. You evaluate patient eligibility for GLP-1 medications (Ozempic, Wegovy, Rybelsus, Mounjaro) based on BMI and medical risk factors.',
};

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '.openclaw-local', 'settings.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...data } });
    }
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  } catch (error) {
    console.error('Failed to read settings:', error);
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filePath = path.join(process.cwd(), '.openclaw-local', 'settings.json');

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    let existing = DEFAULT_SETTINGS;
    if (fs.existsSync(filePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {}
    }

    const updated = { ...existing, ...body };
    fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      settings: updated,
      message: 'System preferences saved successfully',
    });
  } catch (error) {
    console.error('Failed to save settings:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
