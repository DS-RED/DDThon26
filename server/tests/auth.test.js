import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { bootstrap, DEMO } from './helpers.js';

let app;
let close;

before(async () => {
  const ctx = await bootstrap();
  app = ctx.app;
  close = ctx.closeDb;
});

after(() => close && close());

describe('auth routes', () => {
  test('admin login succeeds with seeded credentials', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ storeCode: DEMO.storeCode, username: DEMO.adminUsername, password: DEMO.adminPassword });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.admin.username, 'admin');
  });

  test('admin login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/admin/login')
      .send({ storeCode: DEMO.storeCode, username: DEMO.adminUsername, password: 'wrong' });
    assert.equal(res.status, 401);
  });

  test('admin login validation error on missing fields', async () => {
    const res = await request(app).post('/api/auth/admin/login').send({ username: 'admin' });
    assert.equal(res.status, 400);
  });

  test('table login succeeds and returns a table token', async () => {
    const res = await request(app)
      .post('/api/auth/table/login')
      .send({ storeCode: DEMO.storeCode, tableNumber: DEMO.tableNumber, password: DEMO.tablePassword });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.table.tableNumber, '1');
  });

  test('table login fails with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/table/login')
      .send({ storeCode: DEMO.storeCode, tableNumber: DEMO.tableNumber, password: 'nope' });
    assert.equal(res.status, 401);
  });

  test('admin endpoint rejects a table token (403)', async () => {
    const table = await request(app)
      .post('/api/auth/table/login')
      .send({ storeCode: DEMO.storeCode, tableNumber: DEMO.tableNumber, password: DEMO.tablePassword });
    const res = await request(app)
      .get('/api/stores/1/tables')
      .set('Authorization', `Bearer ${table.body.token}`);
    assert.equal(res.status, 403);
  });
});
