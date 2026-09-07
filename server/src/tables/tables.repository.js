import { getDb } from '../db/connection.js';

/** Data access for tables (P1). */

export function listTables(storeId, db = getDb()) {
  return db
    .prepare('SELECT id, store_id, table_number, created_at FROM tables WHERE store_id = ? ORDER BY id')
    .all(storeId);
}

export function findTable(storeId, tableId, db = getDb()) {
  return db
    .prepare('SELECT id, store_id, table_number, created_at FROM tables WHERE store_id = ? AND id = ?')
    .get(storeId, tableId);
}

export function findByNumber(storeId, tableNumber, db = getDb()) {
  return db
    .prepare('SELECT id, store_id, table_number, created_at FROM tables WHERE store_id = ? AND table_number = ?')
    .get(storeId, tableNumber);
}

export function insertTable(storeId, tableNumber, passwordHash, db = getDb()) {
  const id = db
    .prepare('INSERT INTO tables (store_id, table_number, password_hash) VALUES (?, ?, ?)')
    .run(storeId, tableNumber, passwordHash ?? null).lastInsertRowid;
  return findTable(storeId, id, db);
}
