import { NextResponse } from 'next/server';
import { resetWaSession } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    await resetWaSession();
    return NextResponse.json({
      success: true,
      status: 'awaitingPair',
      message: 'WhatsApp session credentials reset successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to reset WhatsApp session' },
      { status: 500 }
    );
  }
}
