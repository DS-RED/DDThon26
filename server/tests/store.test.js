import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { bootstrap } from './helpers.js';

let app;
let storeId;
let close;

before(async () => {
  const ctx = await bootstrap();
  app = ctx.app;
  storeId = ctx.seed.storeId;
  close = ctx.closeDb;
});

after(() => close && close());

describe('store routes', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  test('GET /api/stores lists seeded store', async () => {
    const res = await request(app).get('/api/stores');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.some((s) => s.id === storeId));
  });

  test('GET /api/stores/:storeId returns the store', async () => {
    const res = await request(app).get(`/api/stores/${storeId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.id, storeId);
    assert.equal(res.body.store_code, 'demo-001');
  });

  test('GET /api/stores/:storeId 404 for unknown store', async () => {
    const res = await request(app).get('/api/stores/99999');
    assert.equal(res.status, 404);
    assert.ok(res.body.error);
  });

  test('GET /api/stores/:storeId 400 for invalid id', async () => {
    const res = await request(app).get('/api/stores/abc');
    assert.equal(res.status, 400);
  });
});
