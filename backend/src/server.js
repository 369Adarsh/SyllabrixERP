const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');
const { startAutomation } = require('./modules/automation/automation.service');
const { seedDefaultAdmin, seedDefaultPlans } = require('./modules/superadmin/superadmin.service');

const start = async () => {
  try {
    // Start listening immediately — Prisma lazy-connects on first query.
    // Explicit $connect() at boot was causing EMAXCONNSESSION crashes when
    // the previous deployment still held all pool slots during the handover.
    app.listen(config.port, () => {
      console.log(`Syllabrix API running on port ${config.port} [${config.nodeEnv}]`);
    });

    // Run post-start tasks without crashing the server if they fail.
    seedDefaultAdmin().catch(e => console.error('seedDefaultAdmin error:', e.message));
    seedDefaultPlans().catch(e => console.error('seedDefaultPlans error:', e.message));
    startAutomation();
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

start();
