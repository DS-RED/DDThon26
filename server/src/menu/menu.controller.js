import * as service from './menu.service.js';
import { badRequest, forbidden } from '../utils/http-error.js';

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label}`);
  return id;
}

const storeId = (req) => parseId(req.params.storeId, 'storeId');

/**
 * Guards admin mutations against cross-store access: the JWT's storeId must
 * match the :storeId in the path. `requireAdmin` runs first and attaches
 * `req.admin`; if it's missing the mutation route wasn't guarded (bug), so fail closed.
 */
function assertStoreScope(req) {
  if (!req.admin || Number(req.admin.storeId) !== storeId(req)) {
    throw forbidden('Token store does not match requested store');
  }
}

// ----- Menu items -----

export function listMenu(req, res, next) {
  try {
    // ?available=true → customer view: only in-stock items, empty categories hidden.
    const availableOnly = String(req.query.available).toLowerCase() === 'true';
    res.json(service.listMenu(storeId(req), { availableOnly }));
  } catch (err) {
    next(err);
  }
}

export function getMenuItem(req, res, next) {
  try {
    res.json(service.getMenuItem(storeId(req), parseId(req.params.itemId, 'itemId')));
  } catch (err) {
    next(err);
  }
}

export function createMenuItem(req, res, next) {
  try {
    assertStoreScope(req);
    res.status(201).json(service.createMenuItem(storeId(req), req.validated));
  } catch (err) {
    next(err);
  }
}

export function updateMenuItem(req, res, next) {
  try {
    assertStoreScope(req);
    res.json(service.updateMenuItem(storeId(req), parseId(req.params.itemId, 'itemId'), req.validated));
  } catch (err) {
    next(err);
  }
}

export function deleteMenuItem(req, res, next) {
  try {
    assertStoreScope(req);
    service.deleteMenuItem(storeId(req), parseId(req.params.itemId, 'itemId'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export function reorderMenu(req, res, next) {
  try {
    assertStoreScope(req);
    res.json(service.reorderMenu(storeId(req), req.validated.items));
  } catch (err) {
    next(err);
  }
}

// ----- Categories -----

export function listCategories(req, res, next) {
  try {
    res.json(service.listCategories(storeId(req)));
  } catch (err) {
    next(err);
  }
}

export function createCategory(req, res, next) {
  try {
    assertStoreScope(req);
    res.status(201).json(service.createCategory(storeId(req), req.validated));
  } catch (err) {
    next(err);
  }
}

export function updateCategory(req, res, next) {
  try {
    assertStoreScope(req);
    res.json(service.updateCategory(storeId(req), parseId(req.params.categoryId, 'categoryId'), req.validated));
  } catch (err) {
    next(err);
  }
}

export function deleteCategory(req, res, next) {
  try {
    assertStoreScope(req);
    service.deleteCategory(storeId(req), parseId(req.params.categoryId, 'categoryId'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
