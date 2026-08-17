const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 5001;

async function startServer() {
  try {
    // Verify database connection
    await prisma.$connect();
    console.log('[DATABASE]: Successfully connected to SQLite/Prisma database.');

    app.listen(PORT, () => {
      console.log(`[SERVER]: Server listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[SERVER CRITICAL ERROR]: Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
