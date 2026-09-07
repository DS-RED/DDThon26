import { getDb } from '../db/connection.js';

/** Data access for stores. All methods accept an optional db (defaults to singleton). */

export function findStoreById(id, db = getDb()) {
  return db.prepare('SELECT id, store_code, name, created_at FROM stores WHERE id = ?').get(id);
}

export function findStoreByCode(storeCode, db = getDb()) {
  return db
    .prepare('SELECT id, store_code, name, created_at FROM stores WHERE store_code = ?')
    .get(storeCode);
}

export function listStores(db = getDb()) {
  return db.prepare('SELECT id, store_code, name, created_at FROM stores ORDER BY id').all();
}
