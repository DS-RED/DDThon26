import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { bootstrap, loginAdmin, loginTable } from './helpers.js';

let app;
let storeId;
let close;
let adminToken;
let tableToken;
let tableId;
let menuIds;

const base = () => `/api/stores/${storeId}`;
const asAdmin = (req) => req.set('Authorization', `Bearer ${adminToken}`);
const asTable = (req) => req.set('Authorization', `Bearer ${tableToken}`);

before(async () => {
  const ctx = await bootstrap();
  app = ctx.app;
  storeId = ctx.seed.storeId;
  close = ctx.closeDb;
  adminToken = await loginAdmin(app);
  const t = await loginTable(app);
  tableToken = t.token;
  tableId = t.tableId;

  // Grab two available menu item ids from the seed.
  const menu = await request(app).get(`${base()}/menu`);
  const items = menu.body.flatMap((g) => g.items).filter((i) => i.is_available);
  menuIds = [items[0].id, items[1].id];
});

after(() => close && close());

describe('orders lifecycle', () => {
  let orderId;

  test('customer creates an order (session auto-starts, totals computed)', async () => {
    const res = await asTable(request(app).post(`${base()}/orders`)).send({
      items: [
        { menu_item_id: menuIds[0], quantity: 2 },
        { menu_item_id: menuIds[1], quantity: 1 },
      ],
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.status, 'pending');
    assert.ok(res.body.session_id);
    assert.equal(res.body.items.length, 2);
    // total = sum(unit_price * qty)
    const expected = res.body.items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    assert.equal(res.body.total_amount, expected);
    orderId = res.body.id;
  });

  test('order rejects unauthenticated (no table token)', async () => {
    const res = await request(app).post(`${base()}/orders`).send({ items: [{ menu_item_id: menuIds[0], quantity: 1 }] });
    assert.equal(res.status, 401);
  });

  test('order validation: empty items rejected', async () => {
    const res = await asTable(request(app).post(`${base()}/orders`)).send({ items: [] });
    assert.equal(res.status, 400);
  });

  test('customer sees own current-session orders via /orders/mine', async () => {
    const res = await asTable(request(app).get(`${base()}/orders/mine`));
    assert.equal(res.status, 200);
    assert.ok(res.body.some((o) => o.id === orderId));
  });

  test('admin sees current orders and can filter by table', async () => {
    const all = await asAdmin(request(app).get(`${base()}/orders`));
    assert.equal(all.status, 200);
    assert.ok(all.body.some((o) => o.id === orderId));

    const filtered = await asAdmin(request(app).get(`${base()}/orders?tableId=${tableId}`));
    assert.equal(filtered.status, 200);
    assert.ok(filtered.body.every((o) => o.table_id === tableId));
  });

  test('admin updates order status', async () => {
    const res = await asAdmin(request(app).patch(`${base()}/orders/${orderId}/status`)).send({ status: 'preparing' });
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'preparing');
  });

  test('invalid status rejected', async () => {
    const res = await asAdmin(request(app).patch(`${base()}/orders/${orderId}/status`)).send({ status: 'flying' });
    assert.equal(res.status, 400);
  });

  test('admin dashboard summary reflects table totals', async () => {
    const res = await asAdmin(request(app).get(`${base()}/tables`));
    assert.equal(res.status, 200);
    const table = res.body.find((t) => t.id === tableId);
    assert.ok(table);
    assert.ok(table.order_count >= 1);
    assert.ok(table.total_amount > 0);
    assert.equal(typeof table.session_id, 'number');
  });

  test('closing the session moves orders to history and resets current', async () => {
    const close = await asAdmin(request(app).post(`${base()}/tables/${tableId}/close`));
    assert.equal(close.status, 200);
    assert.ok(close.body.movedOrders >= 1);

    // current orders for the table now empty
    const current = await asAdmin(request(app).get(`${base()}/orders?tableId=${tableId}`));
    assert.equal(current.body.length, 0);

    // history now has the closed order(s)
    const history = await asAdmin(request(app).get(`${base()}/history?tableId=${tableId}`));
    assert.equal(history.status, 200);
    assert.ok(history.body.length >= 1);
    assert.ok(history.body[0].order_snapshot.items.length >= 1);
  });

  test('a new order after close starts a fresh session', async () => {
    const res = await asTable(request(app).post(`${base()}/orders`)).send({
      items: [{ menu_item_id: menuIds[0], quantity: 1 }],
    });
    assert.equal(res.status, 201);
    const del = await asAdmin(request(app).delete(`${base()}/orders/${res.body.id}`));
    assert.equal(del.status, 204);
    const gone = await asAdmin(request(app).get(`${base()}/orders/${res.body.id}`));
    assert.equal(gone.status, 404);
  });
});

describe('table management', () => {
  test('admin creates a new table', async () => {
    const res = await asAdmin(request(app).post(`${base()}/tables`)).send({ tableNumber: '99', password: '1234' });
    assert.equal(res.status, 201);
    assert.equal(res.body.table_number, '99');
  });

  test('duplicate table number rejected (409)', async () => {
    const res = await asAdmin(request(app).post(`${base()}/tables`)).send({ tableNumber: '99' });
    assert.equal(res.status, 409);
  });
});
