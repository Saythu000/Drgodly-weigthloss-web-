import { NextResponse } from 'next/server';
import { resetWaSession } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('[WA DEBUG] 🌐 POST /api/bot/reset endpoint hit. Triggering session reset...');
    await resetWaSession();
    console.log('[WA DEBUG] 🌐 resetWaSession() completed successfully.');
    return NextResponse.json({
      success: true,
      status: 'awaitingPair',
      message: 'WhatsApp session credentials reset successfully.',
    });
  } catch (error) {
    console.error('[WA DEBUG] ❌ Failed to reset WhatsApp session:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset WhatsApp session' },
      { status: 500 }
    );
  }
}
