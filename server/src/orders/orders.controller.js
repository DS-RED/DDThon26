import * as service from './orders.service.js';
import { badRequest } from '../utils/http-error.js';

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label}`);
  return id;
}

const storeId = (req) => parseId(req.params.storeId, 'storeId');

/** Ensures the authenticated principal belongs to the store in the URL. */
function assertStoreScope(req, principal) {
  if (principal && Number(principal.storeId) !== storeId(req)) {
    throw badRequest('Token store does not match requested store');
  }
}

export function createOrder(req, res, next) {
  try {
    assertStoreScope(req, req.table);
    const dto = service.createOrder(storeId(req), req.table.id, req.validated.items);
    res.status(201).json(dto);
  } catch (err) {
    next(err);
  }
}

export function listMine(req, res, next) {
  try {
    assertStoreScope(req, req.table);
    res.json(service.listCurrentOrders(storeId(req), req.table.id));
  } catch (err) {
    next(err);
  }
}

export function listCurrent(req, res, next) {
  try {
    const tableId = req.query.tableId != null ? parseId(req.query.tableId, 'tableId') : null;
    res.json(service.listCurrentOrders(storeId(req), tableId));
  } catch (err) {
    next(err);
  }
}

export function getOrder(req, res, next) {
  try {
    res.json(service.getOrder(storeId(req), parseId(req.params.orderId, 'orderId')));
  } catch (err) {
    next(err);
  }
}

export function updateStatus(req, res, next) {
  try {
    res.json(service.updateStatus(storeId(req), parseId(req.params.orderId, 'orderId'), req.validated.status));
  } catch (err) {
    next(err);
  }
}

export function deleteOrder(req, res, next) {
  try {
    service.deleteOrder(storeId(req), parseId(req.params.orderId, 'orderId'));
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export function listHistory(req, res, next) {
  try {
    const tableId = req.query.tableId != null ? parseId(req.query.tableId, 'tableId') : null;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;
    res.json(service.listHistory(storeId(req), { tableId, date }));
  } catch (err) {
    next(err);
  }
}
