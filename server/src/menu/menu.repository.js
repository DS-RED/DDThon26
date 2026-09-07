import { getDb } from '../db/connection.js';

/** Data access for menu items and categories. */

// ----- Categories -----

export function listCategories(storeId, db = getDb()) {
  return db
    .prepare(
      'SELECT id, store_id, name, display_order, created_at FROM categories WHERE store_id = ? ORDER BY display_order, id',
    )
    .all(storeId);
}

export function findCategory(storeId, categoryId, db = getDb()) {
  return db
    .prepare('SELECT id, store_id, name, display_order, created_at FROM categories WHERE store_id = ? AND id = ?')
    .get(storeId, categoryId);
}

export function insertCategory(storeId, data, db = getDb()) {
  const info = db
    .prepare('INSERT INTO categories (store_id, name, display_order) VALUES (?, ?, ?)')
    .run(storeId, data.name, data.display_order);
  return findCategory(storeId, info.lastInsertRowid, db);
}

export function updateCategory(storeId, categoryId, data, db = getDb()) {
  const current = findCategory(storeId, categoryId, db);
  if (!current) return null;
  const next = { name: data.name ?? current.name, display_order: data.display_order ?? current.display_order };
  db.prepare('UPDATE categories SET name = ?, display_order = ? WHERE store_id = ? AND id = ?').run(
    next.name,
    next.display_order,
    storeId,
    categoryId,
  );
  return findCategory(storeId, categoryId, db);
}

export function deleteCategory(storeId, categoryId, db = getDb()) {
  const info = db.prepare('DELETE FROM categories WHERE store_id = ? AND id = ?').run(storeId, categoryId);
  return info.changes > 0;
}

// ----- Menu items -----

export function listMenuItems(storeId, db = getDb()) {
  return db
    .prepare(
      `SELECT id, store_id, category_id, name, price, description, image_url,
              display_order, is_available, created_at, updated_at
         FROM menu_items WHERE store_id = ?
        ORDER BY display_order, id`,
    )
    .all(storeId);
}

export function findMenuItem(storeId, itemId, db = getDb()) {
  return db
    .prepare(
      `SELECT id, store_id, category_id, name, price, description, image_url,
              display_order, is_available, created_at, updated_at
         FROM menu_items WHERE store_id = ? AND id = ?`,
    )
    .get(storeId, itemId);
}

export function insertMenuItem(storeId, data, db = getDb()) {
  const info = db
    .prepare(
      `INSERT INTO menu_items
        (store_id, category_id, name, price, description, image_url, display_order, is_available)
       VALUES (@store_id, @category_id, @name, @price, @description, @image_url, @display_order, @is_available)`,
    )
    .run({
      store_id: storeId,
      category_id: data.category_id ?? null,
      name: data.name,
      price: data.price,
      description: data.description ?? null,
      image_url: data.image_url ?? null,
      display_order: data.display_order ?? 0,
      is_available: data.is_available === false ? 0 : 1,
    });
  return findMenuItem(storeId, info.lastInsertRowid, db);
}

export function updateMenuItem(storeId, itemId, data, db = getDb()) {
  const current = findMenuItem(storeId, itemId, db);
  if (!current) return null;

  const next = {
    category_id: data.category_id !== undefined ? data.category_id : current.category_id,
    name: data.name ?? current.name,
    price: data.price ?? current.price,
    description: data.description !== undefined ? data.description : current.description,
    image_url: data.image_url !== undefined ? data.image_url : current.image_url,
    display_order: data.display_order ?? current.display_order,
    is_available:
      data.is_available !== undefined ? (data.is_available ? 1 : 0) : current.is_available,
  };

  db.prepare(
    `UPDATE menu_items SET
        category_id = @category_id, name = @name, price = @price,
        description = @description, image_url = @image_url,
        display_order = @display_order, is_available = @is_available,
        updated_at = datetime('now')
      WHERE store_id = @store_id AND id = @id`,
  ).run({ ...next, store_id: storeId, id: itemId });

  return findMenuItem(storeId, itemId, db);
}

export function deleteMenuItem(storeId, itemId, db = getDb()) {
  const info = db.prepare('DELETE FROM menu_items WHERE store_id = ? AND id = ?').run(storeId, itemId);
  return info.changes > 0;
}

/** Applies new display_order values in a single transaction. Returns updated list. */
export function reorderMenuItems(storeId, items, db = getDb()) {
  const update = db.prepare(
    "UPDATE menu_items SET display_order = ?, updated_at = datetime('now') WHERE store_id = ? AND id = ?",
  );
  const tx = db.transaction((rows) => {
    for (const { id, display_order } of rows) {
      update.run(display_order, storeId, id);
    }
  });
  tx(items);
  return listMenuItems(storeId, db);
}
