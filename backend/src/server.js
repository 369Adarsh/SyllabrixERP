const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');
const { startAutomation } = require('./modules/automation/automation.service');
const { seedDefaultAdmin, seedDefaultPlans } = require('./modules/superadmin/superadmin.service');
const cron = require('node-cron');
const axios = require('axios');

// Ping own /health every 14 minutes to prevent Render free tier from sleeping
const startKeepAlive = (port) => {
  if (config.nodeEnv !== 'production') return;
  const url = process.env.RENDER_EXTERNAL_URL
    ? `${process.env.RENDER_EXTERNAL_URL}/health`
    : `http://localhost:${port}/health`;

  cron.schedule('*/14 * * * *', async () => {
    try {
      await axios.get(url, { timeout: 10000 });
      console.log('[keep-alive] pinged /health');
    } catch {
      console.warn('[keep-alive] ping failed — server may be waking up');
    }
  });
};

const start = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    await seedDefaultAdmin();
    await seedDefaultPlans();
    startAutomation();

    app.listen(config.port, () => {
      console.log(`Syllabrix API running on port ${config.port} [${config.nodeEnv}]`);
      startKeepAlive(config.port);
    });
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
