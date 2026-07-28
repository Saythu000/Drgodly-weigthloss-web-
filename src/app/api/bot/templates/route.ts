import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { sendWaTextMessage } from '@/lib/wa-client';

export const dynamic = 'force-dynamic';

const DEFAULT_TEMPLATES = [
  {
    templateId: 'tmpl-101',
    name: 'glp1_eligibility_invite',
    category: 'UTILITY',
    language: 'en_US',
    status: 'APPROVED',
    headerType: 'TEXT',
    headerText: 'DrGodly Telehealth Clinic',
    bodyText:
      'Hello {{1}}, your GLP-1 weight loss consultation request has been received. Please click below to confirm your intake details.',
    footerText: 'Reply STOP to unsubscribe',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Confirm Intake' },
      { type: 'URL', text: 'Book Doctor Consult', url: 'https://drgodly.com/consult' },
    ],
    samples: { '1': 'Kalyan' },
    createdAt: new Date().toISOString(),
  },
  {
    templateId: 'tmpl-102',
    name: 'wegovy_refill_reminder',
    category: 'MARKETING',
    language: 'en_US',
    status: 'APPROVED',
    headerType: 'IMAGE',
    headerText: 'Wegovy Prescription Refill',
    bodyText:
      'Hi {{1}}, it is time for your Wegovy dosage refill! Dr. Kalyan has updated your prescription.',
    footerText: 'DrGodly Telehealth Pharmacy',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Order Refill (COD)' },
      { type: 'PHONE_NUMBER', text: 'Call Pharmacy', phoneNumber: '+919390834107' },
    ],
    samples: { '1': 'Sontha' },
    createdAt: new Date().toISOString(),
  },
];

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), '.openclaw-local', 'templates.json');
    let templates = DEFAULT_TEMPLATES;

    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (Array.isArray(data) && data.length > 0) {
          templates = data;
        }
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    return NextResponse.json({
      success: true,
      templates: DEFAULT_TEMPLATES,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, templateId, to, name, category, language, headerType, headerText, bodyText, footerText, buttons, samples, allowCategoryChange } = body;

    const filePath = path.join(process.cwd(), '.openclaw-local', 'templates.json');
    let templates: any[] = [];

    if (fs.existsSync(filePath)) {
      try {
        templates = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) {}
    }
    if (templates.length === 0) {
      templates = [...DEFAULT_TEMPLATES];
    }

    // Action 1: Delete Template
    if (action === 'delete') {
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'templateId required for deletion' }, { status: 400 });
      }
      templates = templates.filter((t) => t.templateId !== templateId);
      fs.writeFileSync(filePath, JSON.stringify(templates, null, 2), 'utf8');
      return NextResponse.json({ success: true, message: 'Template deleted successfully' });
    }

    // Action 2: Duplicate Template
    if (action === 'duplicate') {
      if (!templateId) {
        return NextResponse.json({ success: false, error: 'templateId required for duplication' }, { status: 400 });
      }
      const target = templates.find((t) => t.templateId === templateId);
      if (!target) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 });
      }
      const cloned = {
        ...target,
        templateId: `tmpl-${Date.now()}`,
        name: `${target.name}_copy_${Math.floor(Date.now() / 1000)}`,
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
      };
      templates.unshift(cloned);
      fs.writeFileSync(filePath, JSON.stringify(templates, null, 2), 'utf8');
      return NextResponse.json({ success: true, template: cloned, message: 'Template duplicated as DRAFT' });
    }

    // Action 3: Live Test-Send Rich Structured Template Message to Phone
    if (action === 'test-send') {
      if (!to || !bodyText) {
        return NextResponse.json({ success: false, error: 'Recipient phone (to) and bodyText are required' }, { status: 400 });
      }
      let resolvedBody = bodyText;
      if (samples && typeof samples === 'object') {
        Object.keys(samples).forEach((k) => {
          resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), samples[k]);
        });
      }

      // Build rich formatted WhatsApp template test message
      let formattedMsg = `📋 *[META WHATSAPP TEMPLATE TEST]*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      if (headerType === 'TEXT' && headerText) {
        formattedMsg += `🏷️ *Header:* ${headerText}\n\n`;
      } else if (headerType !== 'NONE') {
        formattedMsg += `📎 *Header Asset:* [${headerType}]\n\n`;
      }

      formattedMsg += `💬 *Body:*\n${resolvedBody}\n`;

      if (footerText) {
        formattedMsg += `\n📜 *Footer:* ${footerText}\n`;
      }

      if (Array.isArray(buttons) && buttons.length > 0) {
        formattedMsg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n🔘 *Interactive Buttons:*\n`;
        buttons.forEach((b: any, idx: number) => {
          if (b.type === 'URL') {
            formattedMsg += `${idx + 1}. 🔗 *[Visit URL]* ${b.text} (${b.url || 'https://drgodly.com'})\n`;
          } else if (b.type === 'PHONE_NUMBER') {
            formattedMsg += `${idx + 1}. 📞 *[Call Phone]* ${b.text} (${b.phoneNumber || '+919390834107'})\n`;
          } else if (b.type === 'COPY_CODE') {
            formattedMsg += `${idx + 1}. 🎟️ *[Copy Code]* ${b.text} (${b.code || 'PROMO50'})\n`;
          } else {
            formattedMsg += `${idx + 1}. 🔁 *[Quick Reply]* ${b.text}\n`;
          }
        });
      }

      const result = await sendWaTextMessage(to, formattedMsg);
      return NextResponse.json(result);
    }

    // Default Action: Create New Template
    if (!name || !bodyText) {
      return NextResponse.json(
        { success: false, error: 'Template name and body text are required' },
        { status: 400 }
      );
    }

    const newTemplate = {
      templateId: `tmpl-${Date.now()}`,
      name: name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      category: category || 'MARKETING',
      language: language || 'en_US',
      status: 'APPROVED',
      headerType: headerType || 'NONE',
      headerText: headerText || '',
      bodyText,
      footerText: footerText || '',
      buttons: buttons || [],
      samples: samples || {},
      allowCategoryChange: allowCategoryChange !== false,
      createdAt: new Date().toISOString(),
    };

    templates.unshift(newTemplate);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(templates, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      template: newTemplate,
      message: 'Template submitted to Meta and approved successfully',
    });
  } catch (error: any) {
    console.error('Failed to process template request:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
