import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import request from 'supertest';
import { bootstrap, loginAdmin, loginTable, DEMO } from './helpers.js';

/**
 * End-to-end cross-slice integration test (P1 + P2 together).
 *
 * Unlike the per-slice suites (auth/orders/menu/store/sse) this test drives a
 * full real-world flow over a LIVE HTTP server and asserts the admin dashboard
 * receives Server-Sent Events on the wire when a customer acts:
 *
 *   table login (P1 auth)
 *   → customer menu ?available=true (P2 menu)
 *   → admin subscribes to SSE stream (P1 sse)
 *   → customer places order (P1 orders, prices snapshotted from P2 menu)
 *   → admin receives order.created live
 *   → admin advances status → order.updated live
 *   → admin closes session → session.closed live + orders moved to history
 *
 * supertest requests and the live SSE connection share the same app module
 * instance (and thus the same in-memory DB + SSE subscriber registry), so a
 * publish triggered by a supertest-driven order reaches the streamed listener.
 */

let app;
let server;
let baseUrl;
let storeId;
let closeDb;
let adminToken;
let tableToken;
let tableId;

const api = () => `/api/stores/${storeId}`;
const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asTable = (req) => req.set('Authorization', `Bearer ${tableToken}`);

/**
 * Opens a live SSE connection and collects events. Returns a controller with:
 *  - waitFor(eventName, timeoutMs): resolves with the parsed data of the next
 *    matching event (or an already-buffered one), rejects on timeout.
 *  - close(): tears the connection down.
 */
async function openEventStream(token) {
  const received = []; // { event, data }
  const waiters = []; // { event, resolve, reject, timer }

  const req = http.request(
    `${baseUrl}${api()}/events`,
    { method: 'GET', headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' } },
    () => {},
  );

  const ready = new Promise((resolve, reject) => {
    req.on('response', (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`SSE connect failed: ${res.statusCode}`));
        res.resume();
        return;
      }
      res.setEncoding('utf8');
      let buffer = '';
      res.on('data', (chunk) => {
        buffer += chunk;
        let sep;
        // SSE frames are separated by a blank line.
        while ((sep = buffer.indexOf('\n\n')) !== -1) {
          const frame = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          const evtMatch = frame.match(/^event: (.+)$/m);
          const dataMatch = frame.match(/^data: (.+)$/m);
          if (!evtMatch) continue; // comments/heartbeats/retry lines
          const event = evtMatch[1].trim();
          const data = dataMatch ? JSON.parse(dataMatch[1]) : null;
          const idx = waiters.findIndex((w) => w.event === event);
          if (idx !== -1) {
            const [w] = waiters.splice(idx, 1);
            clearTimeout(w.timer);
            w.resolve(data);
          } else {
            received.push({ event, data });
          }
        }
      });
      resolve();
    });
    req.on('error', reject);
  });

  req.end();
  await ready;

  return {
    waitFor(event, timeoutMs = 2000) {
      const idx = received.findIndex((r) => r.event === event);
      if (idx !== -1) return Promise.resolve(received.splice(idx, 1)[0].data);
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          const i = waiters.findIndex((w) => w.timer === timer);
          if (i !== -1) waiters.splice(i, 1);
          reject(new Error(`timed out waiting for SSE event "${event}"`));
        }, timeoutMs);
        waiters.push({ event, resolve, reject, timer });
      });
    },
    close() {
      req.destroy();
    },
  };
}

before(async () => {
  const ctx = await bootstrap();
  app = ctx.app;
  storeId = ctx.seed.storeId;
  closeDb = ctx.closeDb;
  adminToken = await loginAdmin(app);
  const t = await loginTable(app);
  tableToken = t.token;
  tableId = t.tableId;

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  const { _reset } = await import('../src/sse/sse.js');
  _reset();
  await new Promise((resolve) => server.close(resolve));
  closeDb && closeDb();
});

describe('E2E: customer order → admin live dashboard (P1 + P2)', () => {
  test('full lifecycle propagates over SSE and lands in history', async () => {
    // 1) Customer loads the menu the way the customer app does (available-only).
    const menuRes = await asTable(request(app).get(`${api()}/menu?available=true`));
    assert.equal(menuRes.status, 200);
    const availableItems = menuRes.body.flatMap((g) => g.items);
    assert.ok(availableItems.length >= 2, 'seed should expose at least two available items');
    assert.ok(availableItems.every((it) => it.is_available), 'available=true must hide sold-out items');
    const [item0, item1] = availableItems;

    // 2) Admin dashboard subscribes to the live event stream.
    const stream = await openEventStream(adminToken);
    const connected = await stream.waitFor('connected');
    assert.equal(connected.storeId, storeId);

    try {
      // 3) Customer places an order → admin should see it live.
      const created = asTable(request(app).post(`${api()}/orders`)).send({
        items: [
          { menu_item_id: item0.id, quantity: 2 },
          { menu_item_id: item1.id, quantity: 1 },
        ],
      });
      const [orderRes, createdEvent] = await Promise.all([created, stream.waitFor('order.created')]);
      assert.equal(orderRes.status, 201);
      const orderId = orderRes.body.id;
      assert.equal(createdEvent.id, orderId);
      // Price snapshot: P2 menu prices flowed into the P1 order total.
      const expectedTotal = item0.price * 2 + item1.price * 1;
      assert.equal(orderRes.body.total_amount, expectedTotal);

      // 4) Admin advances the order status → order.updated live.
      const updated = asAdmin(request(app).patch(`${api()}/orders/${orderId}/status`)).send({ status: 'preparing' });
      const [updRes, updatedEvent] = await Promise.all([updated, stream.waitFor('order.updated')]);
      assert.equal(updRes.status, 200);
      assert.equal(updatedEvent.id, orderId);
      assert.equal(updatedEvent.status, 'preparing');

      // 5) Admin closes the table session → session.closed live + moved to history.
      const closing = asAdmin(request(app).post(`${api()}/tables/${tableId}/close`));
      const [closeRes, closedEvent] = await Promise.all([closing, stream.waitFor('session.closed')]);
      assert.equal(closeRes.status, 200);
      assert.ok(closeRes.body.movedOrders >= 1);
      assert.equal(Number(closedEvent.tableId ?? closedEvent.table_id), tableId);

      // 6) Current orders cleared; history holds the closed order.
      const current = await asAdmin(request(app).get(`${api()}/orders?tableId=${tableId}`));
      assert.equal(current.body.length, 0);
      const history = await asAdmin(request(app).get(`${api()}/history?tableId=${tableId}`));
      assert.equal(history.status, 200);
      assert.ok(history.body.length >= 1);
    } finally {
      stream.close();
    }
  });

  test('SSE stream rejects a table token (admin-only dashboard)', async () => {
    await assert.rejects(() => openEventStream(tableToken), /SSE connect failed: 401/);
  });

  test('cross-store guard: admin of this store cannot mutate another store', async () => {
    // A second store with its own admin; this store's admin token must not reach it.
    const res = await asAdmin(request(app).post(`/api/stores/${storeId + 9999}/menu/categories`)).send({
      name: 'X',
      display_order: 1,
    });
    assert.ok(res.status === 403 || res.status === 404, `expected 403/404, got ${res.status}`);
  });
});
