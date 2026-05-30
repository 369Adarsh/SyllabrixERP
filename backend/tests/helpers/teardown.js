module.exports = async () => {
  // Graceful shutdown — close the shared Prisma pool after all tests finish
  const prisma = require('../../src/config/prisma');
  await prisma.$disconnect();
};
