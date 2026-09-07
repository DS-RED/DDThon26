import { verifyToken } from '../auth/auth.tokens.js';

/**
 * SSE publisher (P1). Single-process in-memory fan-out, one subscriber set per store.
 * Admin dashboards (P4) subscribe; order/session services publish.
 *
 * Event names (shared contract): order.created, order.updated, order.deleted, session.closed.
 */

/** @type {Map<number, Set<import('express').Response>>} */
const subscribers = new Map();
let heartbeatTimer = null;

function setFor(storeId) {
  let set = subscribers.get(storeId);
  if (!set) {
    set = new Set();
    subscribers.set(storeId, set);
  }
  return set;
}

function writeEvent(res, event, data) {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

/** Publishes an event to all subscribers of a store. */
export function publish(storeId, event, data) {
  const set = subscribers.get(Number(storeId));
  if (!set) return;
  for (const res of set) {
    try {
      writeEvent(res, event, data);
    } catch {
      set.delete(res);
    }
  }
}

/** Number of active subscribers for a store (used by tests). */
export function subscriberCount(storeId) {
  return subscribers.get(Number(storeId))?.size ?? 0;
}

function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const set of subscribers.values()) {
      for (const res of set) {
        try {
          res.write(': ping\n\n'); // SSE comment keeps the connection alive
        } catch {
          set.delete(res);
        }
      }
    }
  }, 25_000);
  // Do not keep the process alive solely for heartbeats.
  if (typeof heartbeatTimer.unref === 'function') heartbeatTimer.unref();
}

/**
 * Express handler for GET /api/stores/:storeId/events.
 * Admin-only. EventSource cannot set headers, so the JWT may be passed either as
 * `Authorization: Bearer` or as a `?token=` query param.
 */
export function eventsHandler(req, res) {
  const storeId = Number(req.params.storeId);
  const header = req.get('authorization') || '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearer || req.query.token;

  let payload;
  try {
    payload = token ? verifyToken(token) : null;
  } catch {
    payload = null;
  }
  if (!payload || payload.role !== 'admin' || Number(payload.storeId) !== storeId) {
    res.status(401).json({ error: { message: 'Admin authentication required for event stream' } });
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 3000\n\n'); // hint client reconnect delay
  writeEvent(res, 'connected', { storeId, at: new Date().toISOString() });

  const set = setFor(storeId);
  set.add(res);
  startHeartbeat();

  req.on('close', () => {
    set.delete(res);
  });
}

/** Clears all subscribers/timers (used by tests). */
export function _reset() {
  subscribers.clear();
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
