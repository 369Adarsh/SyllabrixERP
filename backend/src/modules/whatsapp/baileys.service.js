const prisma     = require('../../config/prisma');
const { useDBAuthState } = require('./baileys.session');

// One session per tenant: tenantId → { sock, status, qr, retries }
const sessions = new Map();

// Track intentional disconnects so the close-event handler does not auto-reconnect
const disconnecting = new Set();

function normJid(phone) {
  let p = String(phone).replace(/\D/g, '');
  if (p.startsWith('0')) p = p.slice(1);
  if (p.length === 10)   p = '91' + p;
  return p + '@s.whatsapp.net';
}

async function connectTenant(tenantId) {
  const {
    default: makeWASocket,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = require('@whiskeysockets/baileys');
  const pino = require('pino');

  // Initialise session slot
  const slot = sessions.get(tenantId) || { status: 'disconnected', qr: null, retries: 0, sock: null };

  // Clean up old socket's listeners before replacing to prevent duplicate message handlers
  if (slot.sock) {
    try { slot.sock.ev.removeAllListeners(); } catch {}
  }

  slot.status = 'connecting';
  sessions.set(tenantId, slot);

  console.log(`[Baileys:${tenantId.slice(-6)}] Connecting…`);

  let version;
  try { ({ version } = await fetchLatestBaileysVersion()); }
  catch { version = [2, 3000, 1015901307]; }

  const { state, saveCreds } = await useDBAuthState(tenantId);

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: ['Syllabrix', 'Chrome', '120.0.0'],
    connectTimeoutMs: 60_000,
    keepAliveIntervalMs: 25_000,
  });

  slot.sock = sock;
  sessions.set(tenantId, slot);

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    // Ignore close events triggered by an intentional disconnectTenant() call
    if (disconnecting.has(tenantId)) return;

    const s = sessions.get(tenantId) || slot;

    if (qr) {
      s.qr     = qr;
      s.status = 'qr_pending';
      console.log(`[Baileys:${tenantId.slice(-6)}] QR ready`);
    }

    if (connection === 'open') {
      s.qr      = null;
      s.status  = 'connected';
      s.retries = 0;
      console.log(`[Baileys:${tenantId.slice(-6)}] ✓ Connected`);
    }

    if (connection === 'close') {
      const code      = lastDisconnect?.error?.output?.statusCode;
      const loggedOut = code === DisconnectReason.loggedOut;
      s.status = 'disconnected';
      s.sock   = null;

      if (loggedOut) {
        // User removed the device from their phone — clear creds and stop.
        // Do NOT auto-reconnect; user must re-scan QR manually.
        console.log(`[Baileys:${tenantId.slice(-6)}] Logged out — clearing session`);
        prisma.waSession.delete({ where: { id: tenantId } }).catch(() => {});
        s.status = 'logged_out';
        sessions.set(tenantId, s);
        return;
      } else if (s.retries < 8) {
        s.retries++;
        const delay = Math.min(5000 * s.retries, 60_000);
        console.log(`[Baileys:${tenantId.slice(-6)}] Retry ${s.retries}/8 in ${delay / 1000}s`);
        setTimeout(() => connectTenant(tenantId), delay);
      }
    }

    sessions.set(tenantId, s);
  });

  // Handle inbound messages for this tenant
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    const waSvc = require('./whatsapp.service');
    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      const jid = msg.key.remoteJid || '';
      if (!jid.endsWith('@s.whatsapp.net')) continue;
      const phone       = jid.replace('@s.whatsapp.net', '');
      const contactName = msg.pushName || null;
      const body        = msg.message?.conversation
                       || msg.message?.extendedTextMessage?.text
                       || '';
      if (!body.trim()) continue;
      await waSvc._processInbound(tenantId, phone, contactName, body, msg.key.id);
    }
  });
}

// Called on server start — reconnect all tenants that have saved sessions
async function reconnectAll() {
  const savedSessions = await prisma.waSession.findMany({ select: { id: true } });
  for (const { id } of savedSessions) {
    connectTenant(id).catch(e => console.error(`[Baileys] reconnect failed for ${id}:`, e.message));
  }
  console.log(`[Baileys] Reconnecting ${savedSessions.length} saved session(s)`);
}

async function sendWA(tenantId, phone, text) {
  const slot = sessions.get(tenantId);
  if (!slot || slot.status !== 'connected' || !slot.sock) {
    throw new Error('WhatsApp not connected for this account. Please link your WhatsApp in Settings.');
  }
  await slot.sock.sendMessage(normJid(phone), { text });
}

function getStatus(tenantId) {
  const slot = sessions.get(tenantId);
  if (!slot) return { status: 'disconnected', hasQR: false, qr: null };
  return { status: slot.status, hasQR: slot.status === 'qr_pending', qr: slot.qr };
}

async function disconnectTenant(tenantId) {
  const slot = sessions.get(tenantId);
  // Mark as intentional BEFORE calling end() so the close-event handler ignores this disconnect
  disconnecting.add(tenantId);
  if (slot?.sock) {
    try { slot.sock.end(undefined); } catch {}
    // Do NOT call logout() after end() — the socket is already closed and logout would fail silently
  }
  sessions.delete(tenantId);
  await prisma.waSession.delete({ where: { id: tenantId } }).catch(() => {});
  disconnecting.delete(tenantId);
}

module.exports = { connectTenant, reconnectAll, sendWA, getStatus, disconnectTenant };
