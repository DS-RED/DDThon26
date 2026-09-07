import { test, before, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js'; // sets NODE_ENV/DB_PATH/JWT_SECRET before app modules load

let sse;
let signAdminToken;

function mockReq(storeId, token) {
  const handlers = {};
  return {
    params: { storeId: String(storeId) },
    // 인증은 Authorization: Bearer 헤더로만 (쿼리 토큰 미지원).
    get: (name) => (name && name.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : ''),
    query: {},
    on: (event, cb) => {
      handlers[event] = cb;
    },
    _fire: (event) => handlers[event] && handlers[event](),
  };
}

function mockRes() {
  return {
    chunks: [],
    statusCode: 200,
    writeHead(code, headers) {
      this.statusCode = code;
      this.headers = headers;
      return this;
    },
    write(s) {
      this.chunks.push(s);
      return true;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.body = obj;
      return this;
    },
    text() {
      return this.chunks.join('');
    },
  };
}

before(async () => {
  sse = await import('../src/sse/sse.js');
  ({ signAdminToken } = await import('../src/auth/auth.tokens.js'));
});

after(() => sse._reset());

describe('sse publisher', () => {
  test('rejects a subscriber without a valid admin token', () => {
    sse._reset();
    const req = mockReq(1, undefined);
    const res = mockRes();
    sse.eventsHandler(req, res);
    assert.equal(res.statusCode, 401);
    assert.equal(sse.subscriberCount(1), 0);
  });

  test('registers an admin subscriber and delivers published events', () => {
    sse._reset();
    const token = signAdminToken({ id: 1, store_id: 1, username: 'admin' });
    const req = mockReq(1, token);
    const res = mockRes();

    sse.eventsHandler(req, res);
    assert.equal(sse.subscriberCount(1), 1);
    assert.match(res.text(), /event: connected/);

    sse.publish(1, 'order.created', { id: 42 });
    const out = res.text();
    assert.match(out, /event: order\.created/);
    assert.match(out, /"id":42/);

    // Client disconnect removes the subscriber.
    req._fire('close');
    assert.equal(sse.subscriberCount(1), 0);
  });

  test('does not deliver cross-store events', () => {
    sse._reset();
    const token = signAdminToken({ id: 1, store_id: 1, username: 'admin' });
    const res = mockRes();
    sse.eventsHandler(mockReq(1, token), res);
    sse.publish(2, 'order.created', { id: 99 }); // different store
    assert.doesNotMatch(res.text(), /"id":99/);
  });
});
