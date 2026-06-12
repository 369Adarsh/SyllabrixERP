// Regenerate Prisma client before loading any modules.
// Render caches node_modules between deploys, so the generated client
// can be stale when new models are added. Running generate here guarantees
// the client always matches the committed schema, regardless of how Render
// invokes this file (npm start, node src/server.js, etc.).
const { execSync } = require('child_process');
const path = require('path');
try {
  execSync('npx prisma generate', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'), // backend root — where prisma/schema.prisma lives
  });
} catch (e) {
  console.error('[startup] prisma generate failed:', e.message);
}

const app = require('./app');
const config = require('./config/env');
const prisma = require('./config/prisma');
const { startAutomation } = require('./modules/automation/automation.service');
const { seedDefaultAdmin, seedDefaultPlans } = require('./modules/superadmin/superadmin.service');

const start = async () => {
  try {
    app.listen(config.port, () => {
      console.log(`Syllabrix API running on port ${config.port} [${config.nodeEnv}]`);
    });

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
