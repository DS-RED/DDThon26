import { getDb } from '../db/connection.js';
import { notFound } from '../utils/http-error.js';
import * as sessionRepo from './session.repository.js';
import * as ordersRepo from '../orders/orders.repository.js';
import { publish } from '../sse/sse.js';

/** Returns the active session for a table, creating one on first order (FR-A3). */
export function ensureActiveSession(tableId, db = getDb()) {
  return sessionRepo.getActiveByTable(tableId, db) || sessionRepo.createSession(tableId, db);
}

export function getActiveSession(tableId, db = getDb()) {
  return sessionRepo.getActiveByTable(tableId, db);
}

/**
 * Closes a table's active session (이용 완료): snapshots its orders into
 * order_history, marks the session closed. Current orders then drop out of the
 * "active" queries, resetting the table to 0 for the next customer.
 */
export function closeTableSession(storeId, tableId) {
  const db = getDb();
  const session = sessionRepo.getActiveByTable(tableId, db);
  if (!session) throw notFound('No active session for this table');

  const tx = db.transaction(() => {
    const orders = ordersRepo.listOrdersBySession(session.id, db);
    for (const order of orders) {
      const items = ordersRepo.getItems(order.id, db);
      ordersRepo.insertHistory(
        {
          store_id: storeId,
          table_id: tableId,
          session_id: session.id,
          order_snapshot: JSON.stringify({
            order_id: order.id,
            status: order.status,
            created_at: order.created_at,
            items,
          }),
          total_amount: order.total_amount,
        },
        db,
      );
    }
    sessionRepo.closeSession(session.id, db);
    return orders.length;
  });

  const movedOrders = tx();
  publish(storeId, 'session.closed', { tableId, sessionId: session.id, movedOrders });
  return { sessionId: session.id, movedOrders };
}
