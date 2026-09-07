import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config/index.js';

let _db = null;

/**
 * Returns a lazily-created singleton better-sqlite3 Database instance.
 * The path is resolved from config.dbPath (env DB_PATH), defaulting to
 * server/data/table-order.sqlite. Use ':memory:' for an ephemeral DB.
 */
export function getDb() {
  if (_db) return _db;

  const dbPath = config.dbPath;
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  _db = new Database(dbPath);
  _db.pragma('foreign_keys = ON');
  if (dbPath !== ':memory:') {
    _db.pragma('journal_mode = WAL');
  }
  return _db;
}

/** Closes and resets the singleton (used by tests and graceful shutdown). */
export function closeDb() {
  if (_db) {
    _db.close();
    _db = null;
  }
}
