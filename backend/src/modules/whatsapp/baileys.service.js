const prisma     = require('../../config/prisma');
const { useDBAuthState } = require('./baileys.session');

let sock       = null;
let qrCode     = null;
let connStatus = 'disconnected'; // disconnected | connecting | qr_pending | connected
let retries    = 0;
const MAX_RETRIES = 8;

function normJid(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10)   p = '91' + p;
  return p + '@s.whatsapp.net';
}

async function connect() {
  const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = require('@whiskeysockets/baileys');
  const pino = require('pino');

  connStatus = 'connecting';
  console.log('[Baileys] Connecting to WhatsApp…');

  let version;
  try {
    ({ version } = await fetchLatestBaileysVersion());
  } catch {
    version = [2, 3000, 1015901307]; // fallback version
  }

  const { state, saveCreds } = await useDBAuthState();

  sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    browser: ['Syllabrix', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
    retryRequestDelayMs: 2000,
    maxMsgRetryCount: 3,
    generateHighQualityLinkPreview: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      qrCode     = qr;
      connStatus = 'qr_pending';
      console.log('[Baileys] QR ready — go to /api/v1/whatsapp/qr-status to get QR string');
    }

    if (connection === 'open') {
      qrCode     = null;
      connStatus = 'connected';
      retries    = 0;
      console.log('[Baileys] ✓ WhatsApp connected');
    }

    if (connection === 'close') {
      const code      = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      connStatus = 'disconnected';

      if (loggedOut) {
        console.log('[Baileys] Logged out — clearing session. Re-scan QR to reconnect.');
        prisma.waSession.deleteMany({}).catch(() => {});
        retries = 0;
        setTimeout(connect, 3000); // reconnect will show fresh QR
      } else if (retries < MAX_RETRIES) {
        retries++;
        const delay = Math.min(5000 * retries, 60_000);
        console.log(`[Baileys] Disconnected (code ${code}), retry ${retries}/${MAX_RETRIES} in ${delay / 1000}s`);
        setTimeout(connect, delay);
      } else {
        console.error('[Baileys] Max retries reached. Restart server to reconnect.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;

    const tenant = await prisma.tenant.findFirst({
      where: { isActive: true },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });
    if (!tenant) return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const jid  = msg.key.remoteJid || '';
      if (!jid.endsWith('@s.whatsapp.net')) continue; // skip groups
      const phone       = jid.replace('@s.whatsapp.net', '');
      const contactName = msg.pushName || null;
      const body        = msg.message?.conversation
                       || msg.message?.extendedTextMessage?.text
                       || '';
      if (!body.trim()) continue;

      // Delegate to whatsapp.service for DB save + auto-inquiry
      const waSvc = require('./whatsapp.service');
      await waSvc._processInbound(tenant.id, phone, contactName, body, msg.key.id);
    }
  });
}

async function sendWA(phone, text) {
  if (!sock || connStatus !== 'connected') {
    throw new Error(`WhatsApp not connected (status: ${connStatus}). Scan QR first.`);
  }
  await sock.sendMessage(normJid(phone), { text });
}

function getStatus() {
  return { status: connStatus, hasQR: connStatus === 'qr_pending', qr: qrCode };
}

module.exports = { connect, sendWA, getStatus };
