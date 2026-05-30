// Reuse the app's own PrismaClient singleton — no extra connections opened.
// With --runInBand, Node module cache ensures this is the exact same instance
// the app already created, keeping total connections to 1 pool.
module.exports = require('../../src/config/prisma');
