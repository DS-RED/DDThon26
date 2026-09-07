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

  test('CORS: allows cross-origin requests and preflight', async () => {
    // Simple request reflects the origin
    const res = await request(app).get('/health').set('Origin', 'http://localhost:5173');
    assert.equal(res.status, 200);
    assert.equal(res.headers['access-control-allow-origin'], 'http://localhost:5173');

    // Preflight for an authenticated mutation
    const pre = await request(app)
      .options('/api/stores/1/menu')
      .set('Origin', 'http://localhost:5173')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'authorization,content-type');
    assert.ok([200, 204].includes(pre.status));
    assert.equal(pre.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.match(pre.headers['access-control-allow-headers'] || '', /authorization/i);
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
