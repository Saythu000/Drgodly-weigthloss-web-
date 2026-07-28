import { NextResponse } from 'next/server';
import { initWaPairing } from '@/lib/wa-client';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const { qr, status } = await initWaPairing();

    if (qr) {
      // Convert Meta's live authentic Baileys QR token into a base64 PNG data URL
      const qrImageDataUrl = await QRCode.toDataURL(qr, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 250,
        color: {
          dark: '#001a3f',
          light: '#ffffff',
        },
      });

      return NextResponse.json({
        success: true,
        qrImage: qrImageDataUrl,
        status: 'awaitingPair',
        message: 'Live Meta WebSocket QR code generated. Ready for WhatsApp scan.',
      });
    }

    return NextResponse.json({
      success: true,
      qrImage: null,
      status: status,
      message: status === 'connected' ? 'WhatsApp is already connected!' : 'Initializing connection...',
    });
  } catch (error) {
    console.error('Failed to initialize Baileys pairing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to establish live Meta WebSocket pairing' },
      { status: 500 }
    );
  }
}
