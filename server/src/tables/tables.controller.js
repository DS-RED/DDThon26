import * as service from './tables.service.js';
import { closeTableSession } from '../sessions/session.service.js';
import { badRequest } from '../utils/http-error.js';

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw badRequest(`Invalid ${label}`);
  return id;
}

const storeId = (req) => parseId(req.params.storeId, 'storeId');

export function createTable(req, res, next) {
  try {
    res.status(201).json(service.createTable(storeId(req), req.validated));
  } catch (err) {
    next(err);
  }
}

export function listTables(req, res, next) {
  try {
    res.json(service.listTablesWithSummary(storeId(req)));
  } catch (err) {
    next(err);
  }
}

export function closeSession(req, res, next) {
  try {
    const tableId = parseId(req.params.tableId, 'tableId');
    // Ensure the table exists / belongs to the store before closing.
    service.getTable(storeId(req), tableId);
    res.json(closeTableSession(storeId(req), tableId));
  } catch (err) {
    next(err);
  }
}
