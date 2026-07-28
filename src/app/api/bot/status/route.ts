import { NextResponse } from 'next/server';
import { getWaClientState } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = await getWaClientState();
    return NextResponse.json({
      success: true,
      status: state.status,
      phoneNumber: state.phoneNumber,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve connection status' },
      { status: 500 }
    );
  }
}
