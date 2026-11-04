import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '.openclaw-local', 'capi-events.json');
    let events: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        events = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {}
    }

    // Default sample events if fresh install
    if (events.length === 0) {
      events = [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000) - 3600,
          event_id: 'evt-sample-101',
          action_source: 'website',
          channel: 'meta',
          createdAt: new Date(Date.now() - 3600000).toLocaleString(),
          custom_data: { content_category: 'medical_weight_loss', currency: 'INR', value: 1999 },
          user_data: { em: ['e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'] },
        },
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000) - 7200,
          event_id: 'evt-sample-102',
          action_source: 'website',
          channel: 'google',
          createdAt: new Date(Date.now() - 7200000).toLocaleString(),
          custom_data: { content_category: 'telehealth_tier_1_subscription', currency: 'INR', value: 3999 },
          user_data: { em: ['5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8'] },
        },
      ];
    }

    return NextResponse.json({
      success: true,
      events,
    });
  } catch (error) {
    console.error('Failed to fetch CAPI events:', error);
    return NextResponse.json({
      success: true,
      events: [],
    });
  }
}
