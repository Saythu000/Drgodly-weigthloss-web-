import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { sendWaTextMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

const BROADCASTS_FILE = path.join(process.cwd(), '.openclaw-local', 'broadcasts.json');
const LOGS_FILE = path.join(process.cwd(), '.openclaw-local', 'broadcast_logs.json');

const DEFAULT_BROADCASTS = [
  {
    id: 'bcast-101',
    name: 'GLP-1 Refill Reminder - April',
    from_number: '919390834107',
    recipient_numbers: [
      { contact_number: '+91 93908 34107', name: 'Kalyan Sontha' },
      { contact_number: '+91 98765 43210', name: 'Priya Sharma' },
    ],
    template_id: 'tmpl-102',
    template_name: 'wegovy_refill_reminder',
    status: 'SENT',
    message_type: 'template',
    body: 'Hi {{1}}, it is time for your Wegovy dosage refill! Dr. Kalyan has updated your prescription.',
    variable_mapping: { '1': 'name' },
    last_activity: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'bcast-102',
    name: 'Doctor Consultation Followup',
    from_number: '919390834107',
    recipient_numbers: [{ contact_number: '+91 91234 56789', name: 'Rahul Verma' }],
    template_id: 'tmpl-101',
    template_name: 'glp1_eligibility_invite',
    status: 'DRAFT',
    message_type: 'template',
    body: 'Hello {{1}}, your GLP-1 weight loss consultation request has been received.',
    variable_mapping: { '1': 'name' },
    last_activity: new Date().toISOString(),
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const DEFAULT_LOGS = [
  {
    id: 'log-1',
    broadcast_id: 'bcast-101',
    action: 'BROADCAST',
    sent_to: '2 contacts',
    status: 'SENT',
    sent_at: new Date().toISOString(),
  },
];

function readJsonFile(filePath: string, defaultVal: any) {
  if (fs.existsSync(filePath)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return defaultVal;
}

function writeJsonFile(filePath: string, data: any) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const statusFilter = searchParams.get('status');

    let broadcasts = readJsonFile(BROADCASTS_FILE, DEFAULT_BROADCASTS);
    let logs = readJsonFile(LOGS_FILE, DEFAULT_LOGS);

    // GET single broadcast details with status rollup
    if (id) {
      const broadcast = broadcasts.find((b: any) => b.id === id);
      if (!broadcast) {
        return NextResponse.json({ success: false, error: 'Broadcast not found' }, { status: 404 });
      }

      const bLogs = logs.filter((l: any) => l.broadcast_id === id);
      const recipientCount = Array.isArray(broadcast.recipient_numbers) ? broadcast.recipient_numbers.length : 0;

      const statusRollup = {
        total: recipientCount,
        pending: broadcast.status === 'SENDING' ? recipientCount : 0,
        sent: broadcast.status === 'SENT' ? recipientCount : 0,
        delivered: broadcast.status === 'SENT' ? recipientCount : 0,
        read: broadcast.status === 'SENT' ? Math.floor(recipientCount * 0.8) : 0,
        failed: 0,
      };

      return NextResponse.json({
        success: true,
        ...broadcast,
        logs: bLogs,
        statusRollup,
      });
    }

    // Filter broadcasts by status
    if (statusFilter && statusFilter !== 'all') {
      broadcasts = broadcasts.filter((b: any) => b.status === statusFilter);
    }

    return NextResponse.json(broadcasts);
  } catch (error: any) {
    console.error('Failed to GET broadcasts:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch broadcasts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      action,
      broadcastId,
      from_number,
      recipient_numbers,
      template_id,
      status,
      test_number,
      name,
      variable_mapping,
      message_type,
      body: msgBody,
      url,
      media_library_id,
      caption,
      recipients,
      message,
    } = body;

    let broadcasts = readJsonFile(BROADCASTS_FILE, DEFAULT_BROADCASTS);
    let logs = readJsonFile(LOGS_FILE, DEFAULT_LOGS);

    // Action 1: Single Test Broadcast
    if (action === 'test-broadcast' || (body.test_number && !action)) {
      const targetPhone = test_number || body.test_number;
      if (!targetPhone) {
        return NextResponse.json({ success: false, error: 'test_number required' }, { status: 400 });
      }

      let rawBody = msgBody || message || 'Test broadcast message content';
      // Resolve sample variables {{1}}, {{2}} to sample patient name
      rawBody = rawBody.replace(/\{\{1\}\}/g, 'Kalyan Sontha').replace(/\{\{name\}\}/g, 'Kalyan Sontha');

      let testContent = `📋 *[META WHATSAPP BROADCAST TEST]*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (body.headerText) {
        testContent += `🏷️ *Header:* ${body.headerText}\n\n`;
      }
      testContent += `💬 *Body:*\n${rawBody}\n`;
      if (body.footerText) {
        testContent += `\n📜 *Footer:* ${body.footerText}\n`;
      }
      if (Array.isArray(body.buttons) && body.buttons.length > 0) {
        testContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔘 *Interactive Buttons:*\n`;
        body.buttons.forEach((b: any, idx: number) => {
          if (b.type === 'URL') testContent += `${idx + 1}. 🔗 *[Visit URL]* ${b.text} (${b.url || 'https://drgodly.com'})\n`;
          else if (b.type === 'PHONE_NUMBER') testContent += `${idx + 1}. 📞 *[Call Phone]* ${b.text} (${b.phoneNumber || '+919390834107'})\n`;
          else if (b.type === 'COPY_CODE') testContent += `${idx + 1}. 🎟️ *[Copy Code]* ${b.text} (${b.code || 'PROMO50'})\n`;
          else testContent += `${idx + 1}. 🔁 *[Quick Reply]* ${b.text}\n`;
        });
      }

      const result = await sendWaTextMessage(targetPhone, testContent);

      const newLog = {
        id: `log-${Date.now()}`,
        broadcast_id: broadcastId || `bcast-${Date.now()}`,
        action: 'TEST',
        sent_to: targetPhone,
        status: result.success ? 'SENT' : 'FAILED',
        sent_at: new Date().toISOString(),
        error_message: result.error || null,
      };
      logs.unshift(newLog);
      writeJsonFile(LOGS_FILE, logs);

      return NextResponse.json({
        success: result.success,
        message: result.success ? `Test message dispatched to ${targetPhone}` : result.error || 'Failed to dispatch test message',
        error: result.error,
        result,
      });
    }

    // Action 2: Delete Broadcast Campaign
    if (action === 'delete-broadcast' || body.deleteId) {
      const targetId = broadcastId || body.deleteId;
      broadcasts = broadcasts.filter((b: any) => b.id !== targetId);
      logs = logs.filter((l: any) => l.broadcast_id !== targetId);
      writeJsonFile(BROADCASTS_FILE, broadcasts);
      writeJsonFile(LOGS_FILE, logs);
      return NextResponse.json({ success: true, message: 'Broadcast deleted' });
    }

    // Action 3: Send Broadcast Campaign with OpenWA Sanitized Queue & Anti-Ban Throttling
    if (action === 'send-broadcast' || status === 'SENT' || (recipients && Array.isArray(recipients))) {
      const targetRecipients = recipient_numbers || recipients || [];
      const dispatchMessage = msgBody || message || 'Medical broadcast update from DrGodly Telehealth.';
      const minD = Math.max(1, Number(body.minDelay) || 2);
      const maxD = Math.max(minD, Number(body.maxDelay) || 4);

      let delivered = 0;
      let failed = 0;
      const dispatchLogs: string[] = [];

      for (let i = 0; i < targetRecipients.length; i++) {
        const r = targetRecipients[i];
        const rawPhone = typeof r === 'string' ? r : r.contact_number || r.phone || '';
        const recipientName = typeof r === 'string' ? 'Patient' : r.name || r.firstName || 'Patient';

        // Step 1: OpenWA Strict Digit Sanitizer (Strips +, spaces, dashes, parentheses)
        const cleanDigits = String(rawPhone).replace(/\D/g, '');
        if (!cleanDigits || cleanDigits.length < 10) {
          failed++;
          dispatchLogs.push(`[${new Date().toLocaleTimeString()}] ❌ Invalid recipient phone number: ${rawPhone}`);
          continue;
        }

        const targetJid = `${cleanDigits}@s.whatsapp.net`;

        let personalized = dispatchMessage.replace(/\{\{1\}\}/g, recipientName).replace(/\{\{name\}\}/g, recipientName);
        if (r.firstName) personalized = personalized.replace(/\{\{firstName\}\}/g, r.firstName);
        if (r.shippingState || r.state) personalized = personalized.replace(/\{\{shippingState\}\}/g, r.shippingState || r.state);

        // Step 2: OpenWA Anti-Ban Throttling Delay between recipient dispatches
        if (i > 0) {
          const delayMs = Math.floor(Math.random() * (maxD - minD + 1) + minD) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }

        // Step 3: Dispatch over Baileys WebSocket with clean JID
        const res = await sendWaTextMessage(targetJid, personalized);
        if (res.success) {
          delivered++;
          dispatchLogs.push(`[${new Date().toLocaleTimeString()}] ✅ Sent to ${recipientName} (+${cleanDigits}) [ID: ${res.messageId}]`);
        } else {
          failed++;
          dispatchLogs.push(`[${new Date().toLocaleTimeString()}] ❌ Failed to send to ${recipientName} (+${cleanDigits}): ${res.error}`);
        }
      }

      const newBroadcast = {
        id: broadcastId || `bcast-${Date.now()}`,
        name: name || 'GLP-1 Patient Campaign',
        from_number: from_number || '919390834107',
        recipient_numbers: targetRecipients,
        template_id: template_id || null,
        status: 'SENT',
        message_type: message_type || 'text',
        body: dispatchMessage,
        variable_mapping: variable_mapping || {},
        last_activity: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };

      const existingIndex = broadcasts.findIndex((b: any) => b.id === newBroadcast.id);
      if (existingIndex >= 0) broadcasts[existingIndex] = newBroadcast;
      else broadcasts.unshift(newBroadcast);

      const bLog = {
        id: `log-${Date.now()}`,
        broadcast_id: newBroadcast.id,
        action: 'BROADCAST',
        sent_to: `${delivered} contacts`,
        status: failed === 0 ? 'SENT' : 'PARTIAL',
        sent_at: new Date().toISOString(),
      };
      logs.unshift(bLog);

      writeJsonFile(BROADCASTS_FILE, broadcasts);
      writeJsonFile(LOGS_FILE, logs);

      return NextResponse.json({
        success: true,
        broadcast: newBroadcast,
        delivered,
        failed,
        total: targetRecipients.length,
        logs: dispatchLogs,
      });
    }

    // Default Action: Create Draft Broadcast
    const newDraft = {
      id: `bcast-${Date.now()}`,
      name: name || 'Untitled Campaign',
      from_number: from_number || '919390834107',
      recipient_numbers: recipient_numbers || [],
      template_id: template_id || null,
      status: status || 'DRAFT',
      test_number: test_number || null,
      message_type: message_type || 'template',
      body: msgBody || null,
      url: url || null,
      media_library_id: media_library_id || null,
      caption: caption || null,
      variable_mapping: variable_mapping || {},
      last_activity: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    broadcasts.unshift(newDraft);
    writeJsonFile(BROADCASTS_FILE, broadcasts);

    return NextResponse.json(newDraft, { status: 201 });
  } catch (error: any) {
    console.error('Failed to POST broadcast:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Broadcast id required' }, { status: 400 });

    let broadcasts = readJsonFile(BROADCASTS_FILE, DEFAULT_BROADCASTS);
    let logs = readJsonFile(LOGS_FILE, DEFAULT_LOGS);

    broadcasts = broadcasts.filter((b: any) => b.id !== id);
    logs = logs.filter((l: any) => l.broadcast_id !== id);

    writeJsonFile(BROADCASTS_FILE, broadcasts);
    writeJsonFile(LOGS_FILE, logs);

    return NextResponse.json({ success: true, message: 'Broadcast deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Delete failed' }, { status: 500 });
  }
}
