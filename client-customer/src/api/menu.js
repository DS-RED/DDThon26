import { request } from './client.js';
export const getMenu = (storeId, signal) => request(`/api/stores/${storeId}/menu`, { signal });
export const getStore = (storeId, signal) => request(`/api/stores/${storeId}`, { signal });
