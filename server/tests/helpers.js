// Shared test setup: force an in-memory DB + test env BEFORE importing app modules,
// so config reads the right values and the singleton opens :memory:.
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

import request from 'supertest';

// Demo credentials from the seed (server/src/db/seed.js).
export const DEMO = {
  storeCode: 'demo-001',
  adminUsername: 'admin',
  adminPassword: 'admin1234',
  tableNumber: '1',
  tablePassword: '0000',
};

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

/** Logs in as the seeded admin and returns the JWT. */
export async function loginAdmin(app) {
  const res = await request(app)
    .post('/api/auth/admin/login')
    .send({ storeCode: DEMO.storeCode, username: DEMO.adminUsername, password: DEMO.adminPassword });
  if (res.status !== 200) throw new Error(`admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.token;
}

/** Logs in as a seeded table and returns { token, tableId }. */
export async function loginTable(app, tableNumber = DEMO.tableNumber) {
  const res = await request(app)
    .post('/api/auth/table/login')
    .send({ storeCode: DEMO.storeCode, tableNumber, password: DEMO.tablePassword });
  if (res.status !== 200) throw new Error(`table login failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.token, tableId: res.body.table.id };
}
