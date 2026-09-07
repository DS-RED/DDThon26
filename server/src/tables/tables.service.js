import { notFound, conflict } from '../utils/http-error.js';
import { assertStoreExists } from '../store/store.service.js';
import { hashPassword } from '../auth/password.js';
import * as repo from './tables.repository.js';
import * as ordersService from '../orders/orders.service.js';
import { getActiveSession } from '../sessions/session.service.js';

/** Creates a table (FR-A3 initial setup). Password optional; hashed if provided. */
export function createTable(storeId, { tableNumber, password }) {
  assertStoreExists(storeId);
  if (repo.findByNumber(storeId, tableNumber)) {
    throw conflict(`Table ${tableNumber} already exists in store ${storeId}`);
  }
  const passwordHash = password ? hashPassword(password) : null;
  return repo.insertTable(storeId, tableNumber, passwordHash);
}

export function getTable(storeId, tableId) {
  assertStoreExists(storeId);
  const table = repo.findTable(storeId, tableId);
  if (!table) throw notFound(`Table ${tableId} not found`);
  return table;
}

/**
 * Dashboard summary (FR-A2): each table with its active session, current order
 * count, running total, and a small preview of the latest orders.
 */
export function listTablesWithSummary(storeId, previewCount = 3) {
  assertStoreExists(storeId);
  const tables = repo.listTables(storeId);
  return tables.map((table) => {
    const orders = ordersService.listCurrentOrders(storeId, table.id); // newest first
    const session = getActiveSession(table.id);
    const totalAmount = orders.reduce((sum, o) => sum + o.total_amount, 0);
    return {
      ...table,
      session_id: session ? session.id : null,
      order_count: orders.length,
      total_amount: totalAmount,
      latest_orders: orders.slice(0, previewCount),
    };
  });
}
