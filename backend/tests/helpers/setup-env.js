// Runs in the test worker process BEFORE any module loads (including app/prisma).
// Must load the .env file here so DATABASE_URL is available to patch — dotenv
// hasn't been called yet at this point in the Jest lifecycle.
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.development') });

// Switch from Supabase SESSION pooler (port 5432) to TRANSACTION pooler (port 6543).
// Session mode holds one physical connection per client connection — with multiple
// parallel test queries the 15-connection pool exhausts quickly.
// Transaction mode multiplexes: connections are returned after each statement, so
// a pool of 3 clients can safely share 15 physical connections.
// pgbouncer=true disables Prisma's prepared statements (incompatible with tx mode).
let url = process.env.DATABASE_URL || '';
if (url) {
  url = url.replace(':5432/', ':6543/');
  const sep = url.includes('?') ? '&' : '?';
  if (!url.includes('pgbouncer')) url += `${sep}pgbouncer=true`;
  if (!url.includes('connection_limit')) url += `&connection_limit=3&pool_timeout=20`;
  process.env.DATABASE_URL = url;
}
