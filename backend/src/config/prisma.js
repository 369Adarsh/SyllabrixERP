const { PrismaClient } = require('@prisma/client');

// Cap the connection pool so we never exhaust Supabase's session-mode limit (15).
// Render runs 1 instance (WEB_CONCURRENCY=1), so 3 connections is more than enough.
function buildUrl(base) {
  if (!base || base.includes('connection_limit')) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}connection_limit=3&pool_timeout=10`;
}

const prisma = new PrismaClient({
  datasources: { db: { url: buildUrl(process.env.DATABASE_URL) } },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

module.exports = prisma;
