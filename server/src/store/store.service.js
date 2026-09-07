import { notFound } from '../utils/http-error.js';
import * as repo from './store.repository.js';

/** Returns a store by id or throws 404. */
export function getStore(storeId) {
  const store = repo.findStoreById(storeId);
  if (!store) throw notFound(`Store ${storeId} not found`);
  return store;
}

/** Verifies a store exists, throwing 404 otherwise. Used by menu/category layers. */
export function assertStoreExists(storeId) {
  if (!repo.findStoreById(storeId)) {
    throw notFound(`Store ${storeId} not found`);
  }
}

export function listStores() {
  return repo.listStores();
}
