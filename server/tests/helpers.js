// Shared test setup: force an in-memory DB + test env BEFORE importing app modules,
// so config reads the right values and the singleton opens :memory:.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

/**
 * Dynamically imports the app modules (after env is set), applies schema + seed,
 * and returns { app, seed, db, closeDb }.
 */
export async function bootstrap() {
  const { createApp } = await import('../src/app.js');
  const { getDb, closeDb } = await import('../src/db/connection.js');
  const { applySchema } = await import('../src/db/migrate.js');
  const { seedDatabase } = await import('../src/db/seed.js');

  const db = getDb();
  applySchema(db);
  const seed = seedDatabase(db);
  return { app: createApp(), seed, db, closeDb };
}
