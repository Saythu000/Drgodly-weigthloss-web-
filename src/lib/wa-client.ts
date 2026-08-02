import fs from 'node:fs';
import path from 'node:path';
import pino from 'pino';
import makeWASocket, {
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  jidNormalizedUser,
  Browsers,
} from '@whiskeysockets/baileys';
import type { WASocket, ConnectionState } from '@whiskeysockets/baileys';

interface WaState {
  status: 'idle' | 'starting' | 'awaitingPair' | 'connected' | 'disconnected';
  qr: string | null;
  phoneNumber: string | null;
}

class WebBaileysEngine {
  private sock: WASocket | null = null;
  private state: WaState = {
    status: 'idle',
    qr: null,
    phoneNumber: null,
  };
  private authDir: string;
  private sessionDir: string;
  private connectingPromise: Promise<void> | null = null;

  constructor() {
    const dataDir = process.env.OPENCLAW_DATA_DIR || 
      (fs.existsSync('/app/.openclaw-local') ? '/app/.openclaw-local' : path.resolve(process.cwd(), '.openclaw-local'));
    this.authDir = dataDir;
    this.sessionDir = path.join(dataDir, 'sessions');

    if (!fs.existsSync(this.authDir)) {
      fs.mkdirSync(this.authDir, { recursive: true });
    }
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }
  }

  getState(): WaState {
    return this.state;
  }

  async start(): Promise<void> {
    if (this.connectingPromise) return this.connectingPromise;
    this.connectingPromise = this.connect().catch((err) => {
      this.connectingPromise = null;
      console.error('WebBaileysEngine start error:', err);
    });
    return this.connectingPromise;
  }

  async forceReset(): Promise<void> {
    console.log('[WA DEBUG] 🛠️ forceReset() called. Cleaning active socket and credentials directory...');
    if (this.sock) {
      try {
        // Prevent creds.update listener from re-writing creds.json during logout
        this.sock.ev.removeAllListeners('creds.update');
        this.sock.ev.removeAllListeners('connection.update');
        this.sock.ev.removeAllListeners('messages.upsert');
      } catch {}
      try {
        await this.sock.logout();
      } catch {}
      try {
        this.sock.ws?.close();
        this.sock.end(undefined);
      } catch {}
      this.sock = null;
    }
    this.connectingPromise = null;
    if (fs.existsSync(this.authDir)) {
      try {
        const entries = fs.readdirSync(this.authDir);
        for (const entry of entries) {
          const entryPath = path.join(this.authDir, entry);
          try {
            fs.rmSync(entryPath, { recursive: true, force: true });
            console.log(`[WA DEBUG] 🗑️ Deleted auth file: ${entry}`);
          } catch (e) {
            console.error(`Failed to remove auth entry ${entryPath}:`, e);
          }
        }
      } catch (err) {
        console.error('Error clearing auth directory contents:', err);
      }
      try {
        if (!fs.existsSync(this.sessionDir)) {
          fs.mkdirSync(this.sessionDir, { recursive: true });
        }
      } catch {}
    }
    this.state = {
      status: 'idle',
      qr: null,
      phoneNumber: null,
    };
    console.log('[WA DEBUG] 🛠️ forceReset() complete. Engine state is now idle.');
  }

  // Standalone Outbound WhatsApp Text Dispatcher
  async sendTextMessage(to: string, text: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.sock || this.state.status !== 'connected') {
        await this.start();
      }

      if (!this.sock) {
        return { success: false, error: 'WhatsApp WebSocket client is not connected' };
      }

      const cleaned = to.replace(/[^\d]/g, '');
      const targetJid = to.includes('@') ? to : `${cleaned}@s.whatsapp.net`;

      const sent = await this.sock.sendMessage(targetJid, { text });

      // Save sent text to local session history
      const safeJid = targetJid.replace(/[^a-zA-Z0-9._@-]/g, '_');
      const filePath = path.join(this.sessionDir, `${safeJid}.jsonl`);
      const msgObj = {
        role: 'user',
        content: text,
        ts: Date.now(),
      };
      fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');

      return {
        success: true,
        messageId: sent?.key?.id || `msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('Failed to send text message via WebBaileysEngine:', err);
      return { success: false, error: err?.message || 'Failed to dispatch message' };
    }
  }

  // Standalone Outbound Audio Voice Note Dispatcher (PTT = Push to Talk)
  async sendAudioMessage(
    to: string,
    audioBuffer: Buffer,
    mimetype = 'audio/mp4',
    transcription?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.sock || this.state.status !== 'connected') {
        await this.start();
      }

      if (!this.sock) {
        return { success: false, error: 'WhatsApp WebSocket client is not connected' };
      }

      const cleaned = to.replace(/[^\d]/g, '');
      const targetJid = to.includes('@') ? to : `${cleaned}@s.whatsapp.net`;

      const sent = await this.sock.sendMessage(targetJid, {
        audio: audioBuffer,
        mimetype,
        ptt: true,
      });

      // Save voice note entry to local session history
      const safeJid = targetJid.replace(/[^a-zA-Z0-9._@-]/g, '_');
      const filePath = path.join(this.sessionDir, `${safeJid}.jsonl`);
      const msgObj = {
        role: 'user',
        content: `🎤 Voice Note • AI Transcription: "${transcription || 'Voice Note Audio'}"`,
        isAudio: true,
        ts: Date.now(),
      };
      fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');

      return {
        success: true,
        messageId: sent?.key?.id || `msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('Failed to send audio message via WebBaileysEngine:', err);
      return { success: false, error: err?.message || 'Failed to dispatch audio voice note' };
    }
  }

  // Standalone Outbound Media Dispatcher (Images, Videos, PDF Documents)
  async sendMediaMessage(
    to: string,
    fileBuffer: Buffer,
    mimetype: string,
    fileName?: string,
    caption?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.sock || this.state.status !== 'connected') {
        await this.start();
      }

      if (!this.sock) {
        return { success: false, error: 'WhatsApp WebSocket client is not connected' };
      }

      const cleaned = to.replace(/[^\d]/g, '');
      const targetJid = to.includes('@') ? to : `${cleaned}@s.whatsapp.net`;

      let mediaContent: any = {};
      if (mimetype.startsWith('image/')) {
        mediaContent = { image: fileBuffer, caption: caption || '' };
      } else if (mimetype.startsWith('video/')) {
        mediaContent = { video: fileBuffer, caption: caption || '' };
      } else if (mimetype.startsWith('audio/')) {
        mediaContent = { audio: fileBuffer, mimetype, ptt: true };
      } else {
        mediaContent = {
          document: fileBuffer,
          mimetype,
          fileName: fileName || 'Attachment.pdf',
          caption: caption || '',
        };
      }

      const sent = await this.sock.sendMessage(targetJid, mediaContent);

      // Save media entry to local session history
      const safeJid = targetJid.replace(/[^a-zA-Z0-9._@-]/g, '_');
      const filePath = path.join(this.sessionDir, `${safeJid}.jsonl`);
      const msgObj = {
        role: 'user',
        content: `📎 [Media Attachment: ${fileName || mimetype}] ${caption || ''}`,
        ts: Date.now(),
      };
      fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');

      return {
        success: true,
        messageId: sent?.key?.id || `msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('Failed to send media message via WebBaileysEngine:', err);
      return { success: false, error: err?.message || 'Failed to dispatch media attachment' };
    }
  }

  // Standalone Native Baileys Interactive Template Dispatcher
  async sendTemplateMessage(
    to: string,
    template: {
      headerType?: string;
      headerText?: string;
      bodyText: string;
      footerText?: string;
      buttons?: Array<{ type: string; text: string; url?: string; phoneNumber?: string; code?: string }>;
      samples?: Record<string, string>;
    }
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!this.sock || this.state.status !== 'connected') {
        await this.start();
      }

      if (!this.sock) {
        return { success: false, error: 'WhatsApp WebSocket client is not connected' };
      }

      const cleaned = to.replace(/[^\d]/g, '');
      const targetJid = to.includes('@') ? to : `${cleaned}@s.whatsapp.net`;

      // Resolve sample variables in bodyText
      let resolvedBody = template.bodyText || '';
      if (template.samples && typeof template.samples === 'object') {
        Object.keys(template.samples).forEach((v) => {
          resolvedBody = resolvedBody.replace(new RegExp(`\\{\\{${v}\\}\\}`, 'g'), template.samples![v] || `{{${v}}}`);
        });
      }

      let fullText = resolvedBody;
      if (template.headerType === 'TEXT' && template.headerText) {
        fullText = `*${template.headerText}*\n\n${resolvedBody}`;
      }

      // Build Baileys templateButtons
      const rawButtons = template.buttons || [];
      const templateButtons = rawButtons.map((b, idx) => {
        const btnIndex = idx + 1;
        if (b.type === 'URL') {
          return {
            index: btnIndex,
            urlButton: { displayText: b.text || 'Visit Website', url: b.url || 'https://drgodly.com' },
          };
        } else if (b.type === 'PHONE_NUMBER') {
          return {
            index: btnIndex,
            callButton: { displayText: b.text || 'Call Support', phoneNumber: b.phoneNumber || '+919390834107' },
          };
        } else if (b.type === 'COPY_CODE') {
          return {
            index: btnIndex,
            quickReplyButton: { displayText: `🎟️ ${b.text}: ${b.code || 'PROMO50'}`, id: `code_${b.code || 'PROMO50'}` },
          };
        } else {
          return {
            index: btnIndex,
            quickReplyButton: { displayText: b.text || 'Quick Reply', id: `btn_${btnIndex}` },
          };
        }
      });

      let sent: any;
      if (templateButtons.length > 0) {
        try {
          sent = await this.sock.sendMessage(targetJid, {
            text: fullText,
            footer: template.footerText || 'DrGodly Telehealth',
            templateButtons,
          } as any);
        } catch (bErr) {
          // Fallback to text message with formatted interactive buttons if templateButtons throws
          let buttonDetailsText = fullText;
          if (template.footerText) {
            buttonDetailsText += `\n\n_${template.footerText}_`;
          }
          buttonDetailsText += `\n\n━━━━━━━━━━━━━━━━━━━━\n🔘 *Interactive Buttons:*\n`;
          rawButtons.forEach((b, i) => {
            if (b.type === 'URL') buttonDetailsText += `${i + 1}. 🔗 *${b.text}* (${b.url || 'https://drgodly.com'})\n`;
            else if (b.type === 'PHONE_NUMBER') buttonDetailsText += `${i + 1}. 📞 *${b.text}* (${b.phoneNumber || '+919390834107'})\n`;
            else if (b.type === 'COPY_CODE') buttonDetailsText += `${i + 1}. 🎟️ *${b.text}* (${b.code || 'PROMO50'})\n`;
            else buttonDetailsText += `${i + 1}. 🔁 *${b.text}*\n`;
          });
          sent = await this.sock.sendMessage(targetJid, { text: buttonDetailsText });
        }
      } else {
        sent = await this.sock.sendMessage(targetJid, {
          text: fullText,
          footer: template.footerText || undefined,
        });
      }

      // Save sent template entry to local session history
      const safeJid = targetJid.replace(/[^a-zA-Z0-9._@-]/g, '_');
      const filePath = path.join(this.sessionDir, `${safeJid}.jsonl`);
      const msgObj = {
        role: 'user',
        content: `📋 [Template Message]: ${fullText}`,
        ts: Date.now(),
      };
      fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');

      return {
        success: true,
        messageId: sent?.key?.id || `msg-${Date.now()}`,
      };
    } catch (err: any) {
      console.error('Failed to send template message via WebBaileysEngine:', err);
      return { success: false, error: err?.message || 'Failed to dispatch template message' };
    }
  }

  private async connect(): Promise<void> {
    console.log('[WA DEBUG] 🔌 connect() initiated. Auth Dir:', this.authDir);
    const { state, saveCreds } = await useMultiFileAuthState(this.authDir);
    let version: [number, number, number] = [2, 3000, 1020000000];
    try {
      const latest = await fetchLatestBaileysVersion();
      version = latest.version;
      console.log(`[WA DEBUG] 🌐 Fetched latest Baileys version: ${version.join('.')}`);
    } catch (vErr) {
      console.log('[WA DEBUG] ⚠️ Could not fetch latest version, using default:', version.join('.'));
    }

    this.state.status = 'starting';

    const logger = pino({ level: 'silent' });

    console.log('[WA DEBUG] 🔌 Creating Baileys WASocket...');
    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Chrome'),
      logger: logger as any,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      defaultQueryTimeoutMs: 60000,
    });

    this.sock = sock;

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update: Partial<ConnectionState>) => {
      const { connection, lastDisconnect, qr } = update;
      console.log('[WA DEBUG] 📡 connection.update ->', JSON.stringify({
        connection: connection || null,
        hasQr: !!qr,
        qrPreview: qr ? `${qr.slice(0, 15)}... (len: ${qr.length})` : null,
        lastDisconnect: lastDisconnect?.error ? (lastDisconnect.error as any)?.message || String(lastDisconnect.error) : null,
      }));

      if (qr) {
        this.state.status = 'awaitingPair';
        this.state.qr = qr;
        console.log('✅ Baileys generated authentic QR code payload');
      }

      if (connection === 'open') {
        this.state.status = 'connected';
        this.state.qr = null;
        this.state.phoneNumber = sock.user?.id ? jidNormalizedUser(sock.user.id).split('@')[0] : 'Connected';
        console.log(`✅ WebBaileysEngine connected to WhatsApp as ${this.state.phoneNumber}`);
      }

      if (connection === 'close') {
        const code = (lastDisconnect?.error as any)?.output?.statusCode;
        const shouldReconnect = code !== DisconnectReason.loggedOut;
        console.log(`[WA DEBUG] 🛑 Connection closed. Disconnect code: ${code}, shouldReconnect: ${shouldReconnect}`);
        if (this.state.status !== 'awaitingPair') {
          this.state.status = 'disconnected';
        }

        if (shouldReconnect) {
          this.connectingPromise = null;
          setTimeout(() => this.start().catch(() => {}), 3000);
        } else {
          this.connectingPromise = null;
          setTimeout(() => {
            void this.forceReset();
          }, 1000);
        }
      }
    });

    // Standalone Inbound WhatsApp Message Listener with LID-to-Phone JID Resolver
    sock.ev.on('messages.upsert', async (m) => {
      if (m.type !== 'notify') return;

      for (const msg of m.messages) {
        if (msg.key.fromMe) continue;
        let remoteJid = msg.key.remoteJid;
        if (!remoteJid || remoteJid.endsWith('@g.us')) continue;

        // Resolve LID (e.g. 121281454309615@lid or 108886128345223@lid) to real phone JID (@s.whatsapp.net)
        if (remoteJid.endsWith('@lid') || (remoteJid.includes('1088') || remoteJid.includes('1212'))) {
          const participant = msg.key.participant || (msg as any).participant;
          if (participant && participant.endsWith('@s.whatsapp.net')) {
            remoteJid = participant;
          }
        }

        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          msg.message?.videoMessage?.caption ||
          '';

        if (!text.trim() && !msg.message?.audioMessage && !msg.message?.imageMessage) continue;
        if (!remoteJid) continue;

        const safeJid = remoteJid.replace(/[^a-zA-Z0-9._@-]/g, '_');
        const filePath = path.join(this.sessionDir, `${safeJid}.jsonl`);

        const msgObj = {
          role: 'model', // patient / inbound message
          content: text || '📎 [Incoming Media Attachment]',
          ts: Date.now(),
        };

        fs.appendFileSync(filePath, JSON.stringify(msgObj) + '\n', 'utf8');
        console.log(`📩 WebBaileysEngine received inbound message from ${remoteJid}: "${text.slice(0, 30)}..."`);

        // Real-Time Inbound AI Intent Classifier & Gating System (Phase 1)
        try {
          const { classifyIntent } = await import('@/lib/intent-classifier');
          const intentResult = await classifyIntent(text);

          console.log(`🤖 Intent Classifier for ${remoteJid}: category="${intentResult.category}", confidence=${intentResult.confidence}, reasoning="${intentResult.reasoning}"`);

          // ⛔ SILENT SAFEGUARD FOR PERSONAL / PRIVATE CHATS
          if (intentResult.category === 'PERSONAL_PRIVATE_CHAT') {
            console.log(`🤐 [SILENT SAFEGUARD ACTIVATED] Contact ${remoteJid} classified as PERSONAL_PRIVATE_CHAT. Bot is SILENT.`);
            continue;
          }

          // ℹ️ GENERAL CLINIC QUERY HANDLER
          if (intentResult.category === 'GENERAL_CLINIC_QUERY') {
            const clinicReply = "Hello! Thank you for reaching out to DrGodly Telehealth. 🩺\n\n📍 Center: DrGodly Telehealth Center\n⏰ Working Hours: Monday - Saturday (9:00 AM - 8:00 PM IST)\n🩺 Specialization: GLP-1 Weight Loss Telehealth Consultation & Assessment\n\nIf you would like to book a doctor appointment for weight loss, please reply '1' or 'Weight Loss' to begin!";
            if (this.sock) {
              await this.sock.sendMessage(remoteJid, { text: clinicReply });
              const replyObj = { role: 'user', content: clinicReply, ts: Date.now() };
              fs.appendFileSync(filePath, JSON.stringify(replyObj) + '\n', 'utf8');
            }
            continue;
          }

          // 🩺 CUSTOMER WEIGHT LOSS / INTAKE / CATEGORY HANDLER
          const { IntakeWizard } = await import('@/lib/intake-wizard');
          const wizard = new IntakeWizard();
          const autoReply = await wizard.handleInbound(remoteJid, text);
          if (autoReply && this.sock) {
            await this.sock.sendMessage(remoteJid, { text: autoReply });

            const replyObj = {
              role: 'user', // assistant response to patient
              content: autoReply,
              ts: Date.now(),
            };
            fs.appendFileSync(filePath, JSON.stringify(replyObj) + '\n', 'utf8');
            console.log(`🤖 WebBaileysEngine auto-replied to ${remoteJid}: "${autoReply.slice(0, 30)}..."`);
          }
        } catch (aiErr) {
          console.error('Error processing auto-reply via Intent Classifier:', aiErr);
        }
      }
    });
  }
}

// ponytail: global singleton engine preserved across all Next.js API requests in dev & prod
const globalForWa = globalThis as unknown as { waEngine?: WebBaileysEngine };
export const waEngine = globalForWa.waEngine ?? new WebBaileysEngine();
globalForWa.waEngine = waEngine;

export async function getWaClientState(): Promise<WaState> {
  return waEngine.getState();
}

export async function initWaPairing(): Promise<{ qr: string | null; status: string }> {
  const state = waEngine.getState();
  console.log('[WA DEBUG] 📲 initWaPairing() invoked. Current State:', JSON.stringify(state));

  if (state.status === 'connected') {
    console.log('[WA DEBUG] 📲 Engine is already connected. Returning status: connected');
    return { qr: null, status: 'connected' };
  }
  if (state.qr && state.status === 'awaitingPair') {
    console.log('[WA DEBUG] 📲 Cached QR code exists. Returning cached QR payload.');
    return { qr: state.qr, status: 'awaitingPair' };
  }
  if (state.status === 'idle' || state.status === 'disconnected' || !state.qr) {
    console.log('[WA DEBUG] 📲 Starting engine from initWaPairing...');
    await waEngine.start();
  }
  for (let i = 0; i < 150; i++) {
    const currentState = waEngine.getState();
    if (i % 20 === 0) {
      console.log(`[WA DEBUG] ⏳ Polling iteration ${i}/150 -> State:`, JSON.stringify(currentState));
    }
    if (currentState.qr || currentState.status === 'connected') {
      console.log(`[WA DEBUG] ✅ Pairing poll succeeded on iteration ${i}! hasQR: ${!!currentState.qr}, status: ${currentState.status}`);
      return { qr: currentState.qr, status: currentState.status };
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  const finalState = waEngine.getState();
  console.log('[WA DEBUG] ⚠️ Pairing poll timed out after 15s. Final State:', JSON.stringify(finalState));
  return { qr: finalState.qr, status: finalState.status };
}

export async function resetWaSession(): Promise<void> {
  await waEngine.forceReset();
}

export async function sendWaTextMessage(to: string, text: string) {
  return waEngine.sendTextMessage(to, text);
}

export async function sendWaAudioMessage(to: string, audioBuffer: Buffer, mimetype?: string, transcription?: string) {
  return waEngine.sendAudioMessage(to, audioBuffer, mimetype, transcription);
}

export async function sendWaMediaMessage(to: string, fileBuffer: Buffer, mimetype: string, fileName?: string, caption?: string) {
  return waEngine.sendMediaMessage(to, fileBuffer, mimetype, fileName, caption);
}
