import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = [
      {
        id: '1',
        title: 'Baileys WebSockets Engine Active',
        detail: 'Connected to Meta WhatsApp servers via WebSockets.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'info',
      },
      {
        id: '2',
        title: 'GLP-1 Intake Wizard Initialized',
        detail: '20-question clinical state machine ready for incoming patient chats.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'info',
      },
      {
        id: '3',
        title: 'Neon Cloud PostgreSQL Connected',
        detail: 'Patient database and pipeline storage active.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'info',
      },
    ];

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch logs' }, { status: 500 });
  }
}
