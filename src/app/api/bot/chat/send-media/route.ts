import { NextResponse } from 'next/server';
import { sendWaAudioMessage, sendWaMediaMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const jid = formData.get('jid') as string;
    const isPtt = formData.get('isPtt') === 'true';
    const transcription = (formData.get('transcription') as string) || '';
    const caption = (formData.get('caption') as string) || '';
    const file = formData.get('file') as File | null;

    if (!jid || !file) {
      return NextResponse.json(
        { success: false, error: 'JID and file parameters are required' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimetype = file.type || 'application/octet-stream';
    const fileName = file.name || 'attachment';

    let result;
    if (isPtt || mimetype.startsWith('audio/')) {
      result = await sendWaAudioMessage(jid, buffer, mimetype, transcription);
    } else {
      result = await sendWaMediaMessage(jid, buffer, mimetype, fileName, caption);
    }

    return NextResponse.json({
      success: result.success,
      messageId: result.messageId,
      error: result.error,
      message: result.success
        ? 'Media file dispatched natively over WhatsApp'
        : 'Saved to local chat thread',
    });
  } catch (error: any) {
    console.error('Failed to send media via /api/bot/chat/send-media:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
