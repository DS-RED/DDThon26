import { notFound, badRequest } from '../utils/http-error.js';
import { assertStoreExists } from '../store/store.service.js';
import * as repo from './menu.repository.js';

/** Serializes a raw DB row to the API shape (is_available as boolean). */
function toMenuItem(row) {
  return { ...row, is_available: row.is_available === 1 };
}

// ----- Categories -----

export function listCategories(storeId) {
  assertStoreExists(storeId);
  return repo.listCategories(storeId);
}

export function createCategory(storeId, data) {
  assertStoreExists(storeId);
  return repo.insertCategory(storeId, data);
}

export function updateCategory(storeId, categoryId, data) {
  assertStoreExists(storeId);
  const updated = repo.updateCategory(storeId, categoryId, data);
  if (!updated) throw notFound(`Category ${categoryId} not found`);
  return updated;
}

export function deleteCategory(storeId, categoryId) {
  assertStoreExists(storeId);
  if (!repo.deleteCategory(storeId, categoryId)) {
    throw notFound(`Category ${categoryId} not found`);
  }
}

// ----- Menu items -----

/** Returns menu items grouped by category (with an "uncategorized" bucket). */
export function listMenu(storeId) {
  assertStoreExists(storeId);
  const categories = repo.listCategories(storeId);
  const items = repo.listMenuItems(storeId).map(toMenuItem);

  const groups = categories.map((cat) => ({
    category: cat,
    items: items.filter((it) => it.category_id === cat.id),
  }));

  const uncategorized = items.filter((it) => it.category_id == null);
  if (uncategorized.length > 0) {
    groups.push({ category: null, items: uncategorized });
  }
  return groups;
}

export function getMenuItem(storeId, itemId) {
  assertStoreExists(storeId);
  const item = repo.findMenuItem(storeId, itemId);
  if (!item) throw notFound(`Menu item ${itemId} not found`);
  return toMenuItem(item);
}

export function createMenuItem(storeId, data) {
  assertStoreExists(storeId);
  if (data.category_id != null && !repo.findCategory(storeId, data.category_id)) {
    throw badRequest(`Category ${data.category_id} does not belong to store ${storeId}`);
  }
  return toMenuItem(repo.insertMenuItem(storeId, data));
}

export function updateMenuItem(storeId, itemId, data) {
  assertStoreExists(storeId);
  if (data.category_id != null && !repo.findCategory(storeId, data.category_id)) {
    throw badRequest(`Category ${data.category_id} does not belong to store ${storeId}`);
  }
  const updated = repo.updateMenuItem(storeId, itemId, data);
  if (!updated) throw notFound(`Menu item ${itemId} not found`);
  return toMenuItem(updated);
}

export function deleteMenuItem(storeId, itemId) {
  assertStoreExists(storeId);
  if (!repo.deleteMenuItem(storeId, itemId)) {
    throw notFound(`Menu item ${itemId} not found`);
  }
}

export function reorderMenu(storeId, items) {
  assertStoreExists(storeId);
  const known = new Set(repo.listMenuItems(storeId).map((it) => it.id));
  for (const { id } of items) {
    if (!known.has(id)) throw badRequest(`Menu item ${id} not found in store ${storeId}`);
  }
  return repo.reorderMenuItems(storeId, items).map(toMenuItem);
}
