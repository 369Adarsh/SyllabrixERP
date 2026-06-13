const prisma = require('../../config/prisma');

async function useDBAuthState(tenantId) {
  const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

  const stored = await prisma.waSession.findUnique({ where: { id: tenantId } });

  const revive  = (obj) => obj ? JSON.parse(JSON.stringify(obj), BufferJSON.reviver)    : null;
  const replace = (obj) =>       JSON.parse(JSON.stringify(obj,  BufferJSON.replacer));

  let creds = revive(stored?.creds) || initAuthCreds();
  let keys  = revive(stored?.keys)  || {};

  const flush = async () => {
    try {
      await prisma.waSession.upsert({
        where:  { id: tenantId },
        create: { id: tenantId, creds: replace(creds), keys: replace(keys) },
        update: {               creds: replace(creds), keys: replace(keys) },
      });
    } catch (e) {
      console.error(`[Baileys:session] Failed to persist session for ${tenantId.slice(-6)}:`, e.message);
    }
  };

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const out = {};
          for (const id of ids) {
            const v = keys[type]?.[id];
            if (v != null) out[id] = revive(v) ?? v;
          }
          return out;
        },
        set: async (data) => {
          for (const [cat, vals] of Object.entries(data)) {
            keys[cat] ??= {};
            for (const [id, v] of Object.entries(vals ?? {})) {
              if (v == null) delete keys[cat][id];
              // Store in serialized form so revive() in keys.get works correctly for in-memory values
              else           keys[cat][id] = replace(v);
            }
          }
          await flush();
        },
      },
    },
    saveCreds: flush,
  };
}

module.exports = { useDBAuthState };
