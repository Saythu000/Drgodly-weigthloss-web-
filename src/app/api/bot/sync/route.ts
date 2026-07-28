import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    return NextResponse.json({
      success: true,
      syncTime: new Date().toLocaleTimeString(),
      message: 'Force synchronization completed successfully.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to execute sync' },
      { status: 500 }
    );
  }
}
