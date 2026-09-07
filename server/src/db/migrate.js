import '../env.js'; // must run before connection.js reads config (DB_PATH)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Applies schema.sql to the given database (idempotent — uses IF NOT EXISTS).
 * @param {import('better-sqlite3').Database} [db] defaults to the singleton.
 */
export function applySchema(db = getDb()) {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(sql);
  return db;
}

// Run as CLI: `npm run migrate`
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  applySchema();
  console.log('Schema applied successfully.');
}
