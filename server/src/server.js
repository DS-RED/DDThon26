import { createApp } from './app.js';
import { config } from './config/index.js';
import { getDb, closeDb } from './db/connection.js';
import { applySchema } from './db/migrate.js';

// Ensure the schema exists before serving traffic.
applySchema(getDb());

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`Table-order server listening on http://localhost:${config.port} (${config.nodeEnv})`);
});

function shutdown() {
  console.log('\nShutting down...');
  server.close(() => {
    closeDb();
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
