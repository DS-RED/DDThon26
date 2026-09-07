import { getDb } from '../db/connection.js';

/** Data access for orders and order_items (P1). */

export function insertOrder({ storeId, tableId, sessionId, totalAmount }, db = getDb()) {
  return db
    .prepare(
      "INSERT INTO orders (store_id, table_id, session_id, status, total_amount) VALUES (?, ?, ?, 'pending', ?)",
    )
    .run(storeId, tableId, sessionId, totalAmount).lastInsertRowid;
}

export function insertOrderItem(orderId, item, db = getDb()) {
  db.prepare(
    'INSERT INTO order_items (order_id, menu_item_id, menu_name, unit_price, quantity) VALUES (?, ?, ?, ?, ?)',
  ).run(orderId, item.menu_item_id ?? null, item.menu_name, item.unit_price, item.quantity);
}

export function getOrder(storeId, orderId, db = getDb()) {
  return db.prepare('SELECT * FROM orders WHERE store_id = ? AND id = ?').get(storeId, orderId);
}

export function getItems(orderId, db = getDb()) {
  return db
    .prepare('SELECT id, menu_item_id, menu_name, unit_price, quantity FROM order_items WHERE order_id = ? ORDER BY id')
    .all(orderId);
}

/** Orders belonging to currently-active sessions (i.e. "current" orders). */
export function listActiveOrders(storeId, tableId, db = getDb()) {
  const params = [storeId];
  let sql =
    `SELECT o.* FROM orders o
       JOIN table_sessions s ON s.id = o.session_id
      WHERE o.store_id = ? AND s.status = 'active'`;
  if (tableId != null) {
    sql += ' AND o.table_id = ?';
    params.push(tableId);
  }
  sql += ' ORDER BY o.created_at DESC, o.id DESC';
  return db.prepare(sql).all(...params);
}

export function listOrdersBySession(sessionId, db = getDb()) {
  return db.prepare('SELECT * FROM orders WHERE session_id = ? ORDER BY created_at, id').all(sessionId);
}

export function updateStatus(storeId, orderId, status, db = getDb()) {
  const info = db
    .prepare('UPDATE orders SET status = ? WHERE store_id = ? AND id = ?')
    .run(status, storeId, orderId);
  return info.changes > 0;
}

export function deleteOrder(storeId, orderId, db = getDb()) {
  // order_items cascade via FK ON DELETE CASCADE.
  const info = db.prepare('DELETE FROM orders WHERE store_id = ? AND id = ?').run(storeId, orderId);
  return info.changes > 0;
}

export function insertHistory(row, db = getDb()) {
  db.prepare(
    `INSERT INTO order_history (store_id, table_id, session_id, order_snapshot, total_amount, completed_at)
     VALUES (@store_id, @table_id, @session_id, @order_snapshot, @total_amount, datetime('now'))`,
  ).run(row);
}

export function listHistory(storeId, { tableId, date } = {}, db = getDb()) {
  const params = [storeId];
  let sql = 'SELECT * FROM order_history WHERE store_id = ?';
  if (tableId != null) {
    sql += ' AND table_id = ?';
    params.push(tableId);
  }
  if (date) {
    sql += " AND date(completed_at) = date(?)";
    params.push(date);
  }
  sql += ' ORDER BY completed_at DESC, id DESC';
  return db.prepare(sql).all(...params);
}
