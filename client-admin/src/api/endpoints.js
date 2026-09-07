// 도메인별 API 래퍼 (P4). storeId는 로그인 응답의 admin.storeId 사용.
import { apiFetch } from './client.js';

// --- 인증 ---
export function adminLogin({ storeCode, username, password }) {
  return apiFetch('/api/auth/admin/login', {
    method: 'POST',
    auth: false,
    body: { storeCode, username, password },
  });
}

const s = (storeId) => `/api/stores/${storeId}`;

// --- 모니터링 대시보드 / 테이블 ---
export const listTables = (storeId) => apiFetch(`${s(storeId)}/tables`);
export const createTable = (storeId, body) =>
  apiFetch(`${s(storeId)}/tables`, { method: 'POST', body });
export const closeSession = (storeId, tableId) =>
  apiFetch(`${s(storeId)}/tables/${tableId}/close`, { method: 'POST' });

// --- 주문 ---
export const listCurrentOrders = (storeId, tableId) =>
  apiFetch(`${s(storeId)}/orders${tableId != null ? `?tableId=${tableId}` : ''}`);
export const getOrder = (storeId, orderId) => apiFetch(`${s(storeId)}/orders/${orderId}`);
export const updateOrderStatus = (storeId, orderId, status) =>
  apiFetch(`${s(storeId)}/orders/${orderId}/status`, { method: 'PATCH', body: { status } });
export const deleteOrder = (storeId, orderId) =>
  apiFetch(`${s(storeId)}/orders/${orderId}`, { method: 'DELETE' });

// --- 이력 ---
export const listHistory = (storeId, { tableId, date } = {}) => {
  const qs = new URLSearchParams();
  if (tableId != null) qs.set('tableId', tableId);
  if (date) qs.set('date', date);
  const q = qs.toString();
  return apiFetch(`${s(storeId)}/history${q ? `?${q}` : ''}`);
};

// --- 메뉴 / 분류 ---
export const listMenu = (storeId) => apiFetch(`${s(storeId)}/menu`);
export const createMenuItem = (storeId, body) =>
  apiFetch(`${s(storeId)}/menu`, { method: 'POST', body });
export const updateMenuItem = (storeId, itemId, body) =>
  apiFetch(`${s(storeId)}/menu/${itemId}`, { method: 'PUT', body });
export const deleteMenuItem = (storeId, itemId) =>
  apiFetch(`${s(storeId)}/menu/${itemId}`, { method: 'DELETE' });

export const listCategories = (storeId) => apiFetch(`${s(storeId)}/categories`);
export const createCategory = (storeId, body) =>
  apiFetch(`${s(storeId)}/categories`, { method: 'POST', body });
export const updateCategory = (storeId, categoryId, body) =>
  apiFetch(`${s(storeId)}/categories/${categoryId}`, { method: 'PUT', body });
export const deleteCategory = (storeId, categoryId) =>
  apiFetch(`${s(storeId)}/categories/${categoryId}`, { method: 'DELETE' });
