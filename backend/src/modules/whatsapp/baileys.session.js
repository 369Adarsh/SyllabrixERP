const prisma = require('../../config/prisma');

async function useDBAuthState(tenantId) {
  const { initAuthCreds, BufferJSON } = require('@whiskeysockets/baileys');

  const stored = await prisma.waSession.findUnique({ where: { id: tenantId } });

  const revive  = (obj) => obj ? JSON.parse(JSON.stringify(obj), BufferJSON.reviver)    : null;
  const replace = (obj) =>       JSON.parse(JSON.stringify(obj,  BufferJSON.replacer));

  let creds = revive(stored?.creds) || initAuthCreds();
  let keys  = revive(stored?.keys)  || {};

  const flush = async () => {
    await prisma.waSession.upsert({
      where:  { id: tenantId },
      create: { id: tenantId, creds: replace(creds), keys: replace(keys) },
      update: {               creds: replace(creds), keys: replace(keys) },
    });
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
              else           keys[cat][id] = v;
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
