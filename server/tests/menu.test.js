import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { bootstrap, loginAdmin } from './helpers.js';

let app;
let storeId;
let close;
let token; // admin JWT — mutations now require auth (P1 replaced the placeholder)

before(async () => {
  const ctx = await bootstrap();
  app = ctx.app;
  storeId = ctx.seed.storeId;
  close = ctx.closeDb;
  token = await loginAdmin(app);
});

after(() => close && close());

const base = () => `/api/stores/${storeId}`;
const auth = (req) => req.set('Authorization', `Bearer ${token}`);

describe('menu routes', () => {
  test('GET /menu returns grouped categories from seed', async () => {
    const res = await request(app).get(`${base()}/menu`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body));
    assert.ok(res.body.length >= 3);
    const coffee = res.body.find((g) => g.category && g.category.name === '커피');
    assert.ok(coffee);
    assert.ok(coffee.items.length >= 1);
    // is_available serialized as boolean
    assert.equal(typeof coffee.items[0].is_available, 'boolean');
  });

  test('GET /menu?available=true hides sold-out items (customer view)', async () => {
    const full = await request(app).get(`${base()}/menu`);
    const fullItems = full.body.flatMap((g) => g.items);
    // seed includes one unavailable item (초코 브라우니)
    const soldOut = fullItems.find((it) => it.is_available === false);
    assert.ok(soldOut, 'seed should contain at least one unavailable item');

    const res = await request(app).get(`${base()}/menu`).query({ available: 'true' });
    assert.equal(res.status, 200);
    const items = res.body.flatMap((g) => g.items);
    assert.ok(items.length >= 1);
    assert.ok(items.every((it) => it.is_available === true));
    assert.ok(!items.some((it) => it.id === soldOut.id));
    // no empty category groups in the customer view
    assert.ok(res.body.every((g) => g.items.length > 0));
  });

  test('GET /categories lists seeded categories', async () => {
    const res = await request(app).get(`${base()}/categories`);
    assert.equal(res.status, 200);
    assert.equal(res.body.length, 3);
  });

  test('POST /menu without token is rejected (401)', async () => {
    const res = await request(app).post(`${base()}/menu`).send({ name: 'X', price: 1000 });
    assert.equal(res.status, 401);
  });

  test('admin token cannot mutate another store (403 store scope)', async () => {
    const otherStore = storeId + 99999; // not the token's store
    const res = await auth(request(app).post(`/api/stores/${otherStore}/menu`)).send({
      name: '침입',
      price: 1000,
    });
    assert.equal(res.status, 403);
    // scope is checked before existence/validation
    const cat = await auth(request(app).post(`/api/stores/${otherStore}/categories`)).send({ name: 'x' });
    assert.equal(cat.status, 403);
  });

  test('full CRUD lifecycle for a menu item', async () => {
    // Create
    const created = await auth(request(app).post(`${base()}/menu`)).send({
      name: '테스트 음료',
      price: 3000,
      image_url: 'https://example.com/a.jpg',
    });
    assert.equal(created.status, 201);
    assert.equal(created.body.name, '테스트 음료');
    assert.equal(created.body.is_available, true);
    const id = created.body.id;

    // Read (public)
    const read = await request(app).get(`${base()}/menu/${id}`);
    assert.equal(read.status, 200);
    assert.equal(read.body.price, 3000);

    // Update
    const updated = await auth(request(app).put(`${base()}/menu/${id}`)).send({
      price: 3500,
      is_available: false,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.price, 3500);
    assert.equal(updated.body.is_available, false);

    // Delete
    const deleted = await auth(request(app).delete(`${base()}/menu/${id}`));
    assert.equal(deleted.status, 204);

    const gone = await request(app).get(`${base()}/menu/${id}`);
    assert.equal(gone.status, 404);
  });

  test('POST /menu rejects invalid body (validation)', async () => {
    const res = await auth(request(app).post(`${base()}/menu`)).send({ name: '', price: -1 });
    assert.equal(res.status, 400);
    assert.ok(res.body.error.details);
  });

  test('PATCH /menu/reorder updates display order', async () => {
    const list = await request(app).get(`${base()}/menu`);
    const items = list.body.flatMap((g) => g.items);
    assert.ok(items.length >= 2);
    const payload = {
      items: [
        { id: items[0].id, display_order: 50 },
        { id: items[1].id, display_order: 10 },
      ],
    };
    const res = await auth(request(app).patch(`${base()}/menu/reorder`)).send(payload);
    assert.equal(res.status, 200);
    const map = new Map(res.body.map((it) => [it.id, it.display_order]));
    assert.equal(map.get(items[0].id), 50);
    assert.equal(map.get(items[1].id), 10);
  });

  test('reorder rejects unknown item id', async () => {
    const res = await auth(request(app).patch(`${base()}/menu/reorder`)).send({
      items: [{ id: 999999, display_order: 1 }],
    });
    assert.equal(res.status, 400);
  });

  test('category CRUD lifecycle', async () => {
    const created = await auth(request(app).post(`${base()}/categories`)).send({ name: '신규분류' });
    assert.equal(created.status, 201);
    const id = created.body.id;

    const updated = await auth(request(app).put(`${base()}/categories/${id}`)).send({
      name: '수정분류',
      display_order: 9,
    });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.name, '수정분류');

    const deleted = await auth(request(app).delete(`${base()}/categories/${id}`));
    assert.equal(deleted.status, 204);
  });

  test('PATCH /categories/reorder updates category display order', async () => {
    const list = await request(app).get(`${base()}/categories`);
    assert.ok(list.body.length >= 2);
    // Reorder every category so the resulting global order is deterministic:
    // reverse the current order via descending display_order values.
    const ids = list.body.map((c) => c.id);
    const payload = { items: ids.map((id, i) => ({ id, display_order: (ids.length - i) * 10 })) };
    const res = await auth(request(app).patch(`${base()}/categories/reorder`)).send(payload);
    assert.equal(res.status, 200);
    const map = new Map(res.body.map((c) => [c.id, c.display_order]));
    assert.equal(map.get(ids[0]), ids.length * 10); // first got the highest order
    assert.equal(map.get(ids[ids.length - 1]), 10); // last got the lowest
    // response is ordered by display_order → original order reversed
    assert.deepEqual(res.body.map((c) => c.id), [...ids].reverse());
  });

  test('category reorder rejects unknown id', async () => {
    const res = await auth(request(app).patch(`${base()}/categories/reorder`)).send({
      items: [{ id: 999999, display_order: 1 }],
    });
    assert.equal(res.status, 400);
  });

  test('category reorder requires admin token (401)', async () => {
    const res = await request(app)
      .patch(`${base()}/categories/reorder`)
      .send({ items: [{ id: 1, display_order: 1 }] });
    assert.equal(res.status, 401);
  });

  test('creating menu item with foreign category id is rejected', async () => {
    const res = await auth(request(app).post(`${base()}/menu`)).send({
      name: 'X',
      price: 1000,
      category_id: 999999,
    });
    assert.equal(res.status, 400);
  });
});
