import { getDb } from '../db/connection.js';
import { badRequest, notFound } from '../utils/http-error.js';
import * as repo from './orders.repository.js';
import { ensureActiveSession } from '../sessions/session.service.js';
import { publish } from '../sse/sse.js';

const VALID_STATUSES = ['pending', 'preparing', 'completed'];

/** Assembles an order DTO (order row + its items). */
function toOrderDto(order, items) {
  return {
    id: order.id,
    store_id: order.store_id,
    table_id: order.table_id,
    session_id: order.session_id,
    status: order.status,
    total_amount: order.total_amount,
    created_at: order.created_at,
    items: items.map((it) => ({
      id: it.id,
      menu_item_id: it.menu_item_id,
      menu_name: it.menu_name,
      unit_price: it.unit_price,
      quantity: it.quantity,
    })),
  };
}

function loadDto(storeId, orderId, db) {
  const order = repo.getOrder(storeId, orderId, db);
  if (!order) return null;
  return toOrderDto(order, repo.getItems(orderId, db));
}

/**
 * Creates an order for a table. Snapshots menu name/price at order time and
 * starts a session if the table has none active (FR-C4).
 * @param {number} storeId
 * @param {number} tableId
 * @param {{ menu_item_id: number, quantity: number }[]} items
 */
export function createOrder(storeId, tableId, items) {
  const db = getDb();

  const table = db.prepare('SELECT id FROM tables WHERE store_id = ? AND id = ?').get(storeId, tableId);
  if (!table) throw notFound(`Table ${tableId} not found in store ${storeId}`);

  const getMenu = db.prepare('SELECT id, name, price, is_available FROM menu_items WHERE store_id = ? AND id = ?');

  const tx = db.transaction(() => {
    const session = ensureActiveSession(tableId, db);

    let total = 0;
    const lines = [];
    for (const { menu_item_id, quantity } of items) {
      const menu = getMenu.get(storeId, menu_item_id);
      if (!menu) throw badRequest(`Menu item ${menu_item_id} not found in store ${storeId}`);
      if (menu.is_available !== 1) throw badRequest(`Menu item ${menu.name} is not available`);
      total += menu.price * quantity;
      lines.push({ menu_item_id: menu.id, menu_name: menu.name, unit_price: menu.price, quantity });
    }

    const orderId = repo.insertOrder({ storeId, tableId, sessionId: session.id, totalAmount: total }, db);
    for (const line of lines) repo.insertOrderItem(orderId, line, db);
    return orderId;
  });

  const orderId = tx();
  const dto = loadDto(storeId, orderId, db);
  publish(storeId, 'order.created', dto);
  return dto;
}

/** Current orders across active sessions (admin dashboard), optionally filtered by table. */
export function listCurrentOrders(storeId, tableId) {
  const db = getDb();
  return repo.listActiveOrders(storeId, tableId ?? null, db).map((o) => toOrderDto(o, repo.getItems(o.id, db)));
}

export function getOrder(storeId, orderId) {
  const dto = loadDto(storeId, orderId, getDb());
  if (!dto) throw notFound(`Order ${orderId} not found`);
  return dto;
}

export function updateStatus(storeId, orderId, status) {
  if (!VALID_STATUSES.includes(status)) throw badRequest(`Invalid status: ${status}`);
  const db = getDb();
  if (!repo.updateStatus(storeId, orderId, status, db)) throw notFound(`Order ${orderId} not found`);
  const dto = loadDto(storeId, orderId, db);
  publish(storeId, 'order.updated', dto);
  return dto;
}

/** Admin override deletion (FR-A3). Publishes so dashboards recompute table totals. */
export function deleteOrder(storeId, orderId) {
  const db = getDb();
  const order = repo.getOrder(storeId, orderId, db);
  if (!order) throw notFound(`Order ${orderId} not found`);
  repo.deleteOrder(storeId, orderId, db);
  publish(storeId, 'order.deleted', { id: orderId, table_id: order.table_id, session_id: order.session_id });
  return { id: orderId };
}

export function listHistory(storeId, filters) {
  const db = getDb();
  return repo.listHistory(storeId, filters, db).map((h) => ({
    ...h,
    order_snapshot: safeParse(h.order_snapshot),
  }));
}

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return json;
  }
}
