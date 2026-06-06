const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');
const { startAutomation } = require('./modules/automation/automation.service');
const { seedDefaultAdmin, seedDefaultPlans } = require('./modules/superadmin/superadmin.service');
const start = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected');

    await seedDefaultAdmin();
    await seedDefaultPlans();
    startAutomation();

    app.listen(config.port, () => {
      console.log(`Syllabrix API running on port ${config.port} [${config.nodeEnv}]`);
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
