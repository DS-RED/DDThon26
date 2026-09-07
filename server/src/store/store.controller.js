import * as service from './store.service.js';
import { badRequest } from '../utils/http-error.js';

function parseStoreId(req) {
  const id = Number(req.params.storeId);
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Invalid storeId');
  return id;
}

export function getStore(req, res, next) {
  try {
    res.json(service.getStore(parseStoreId(req)));
  } catch (err) {
    next(err);
  }
}

export function listStores(_req, res, next) {
  try {
    res.json(service.listStores());
  } catch (err) {
    next(err);
  }
}
