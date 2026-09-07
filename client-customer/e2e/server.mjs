// P3 test fixture only: reuse P1/P2 modules without modifying server source/data.
process.env.DB_PATH = ':memory:';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'p3-test-fixture-only';
process.env.BCRYPT_ROUNDS = '4';
const { getDb, closeDb } = await import('../../server/src/db/connection.js');
const { applySchema } = await import('../../server/src/db/migrate.js');
const { seedDatabase } = await import('../../server/src/db/seed.js');
const { createApp } = await import('../../server/src/app.js');
applySchema(getDb()); seedDatabase(getDb());
const server = createApp().listen(3101, '127.0.0.1');
const close = () => server.close(() => { closeDb(); process.exit(0); });
process.on('SIGTERM', close); process.on('SIGINT', close);
