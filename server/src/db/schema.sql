-- Table Order Service — Database Schema
-- Owner note (AI-DLC / 4-person team):
--   P2 OWNS: stores, categories, menu_items (implementation + this schema draft).
--   CONTRACT-ONLY (implemented by P1): admin_users, tables, table_sessions,
--   orders, order_items, order_history. They are defined here as the shared
--   schema draft so all slices agree on structure; P1 owns their logic.
-- Prices are stored as INTEGER (KRW, no decimals).

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- P2-owned tables
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS stores (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  store_code  TEXT    NOT NULL UNIQUE,
  name        TEXT    NOT NULL,
  created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS categories (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS menu_items (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id   INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name          TEXT    NOT NULL,
  price         INTEGER NOT NULL CHECK (price >= 0),
  description   TEXT,
  image_url     TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_available  INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_categories_store ON categories(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_store       ON menu_items(store_id);
CREATE INDEX IF NOT EXISTS idx_menu_category    ON menu_items(category_id);

-- ---------------------------------------------------------------------------
-- Contract-only tables (owned by P1 — orders/sessions/auth)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS admin_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  username      TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,           -- bcrypt hash (P1 sets real hash)
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (store_id, username)
);

CREATE TABLE IF NOT EXISTS tables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id      INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_number  TEXT    NOT NULL,
  password_hash TEXT,                        -- table password (bcrypt), P1 owns
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (store_id, table_number)
);

CREATE TABLE IF NOT EXISTS table_sessions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  table_id   INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  status     TEXT    NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  started_at TEXT    NOT NULL DEFAULT (datetime('now')),
  closed_at  TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id     INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  table_id     INTEGER NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  session_id   INTEGER NOT NULL REFERENCES table_sessions(id) ON DELETE CASCADE,
  status       TEXT    NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'completed')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id     INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE SET NULL,
  menu_name    TEXT    NOT NULL,             -- snapshot of name at order time
  unit_price   INTEGER NOT NULL,             -- snapshot of price at order time
  quantity     INTEGER NOT NULL CHECK (quantity > 0)
);

CREATE TABLE IF NOT EXISTS order_history (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id       INTEGER NOT NULL,
  table_id       INTEGER NOT NULL,
  session_id     INTEGER NOT NULL,
  order_snapshot TEXT    NOT NULL,           -- JSON snapshot of the order
  total_amount   INTEGER NOT NULL,
  completed_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
