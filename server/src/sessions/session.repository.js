import { getDb } from '../db/connection.js';

/** Data access for table_sessions (P1). */

export function getActiveByTable(tableId, db = getDb()) {
  return db
    .prepare("SELECT * FROM table_sessions WHERE table_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1")
    .get(tableId);
}

export function getById(sessionId, db = getDb()) {
  return db.prepare('SELECT * FROM table_sessions WHERE id = ?').get(sessionId);
}

export function createSession(tableId, db = getDb()) {
  const id = db
    .prepare("INSERT INTO table_sessions (table_id, status) VALUES (?, 'active')")
    .run(tableId).lastInsertRowid;
  return getById(id, db);
}

export function closeSession(sessionId, db = getDb()) {
  db.prepare("UPDATE table_sessions SET status = 'closed', closed_at = datetime('now') WHERE id = ?").run(sessionId);
  return getById(sessionId, db);
}
