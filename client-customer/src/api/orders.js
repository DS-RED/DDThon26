export const getOrders = (authenticatedRequest, storeId, signal) => authenticatedRequest(`/api/stores/${storeId}/orders/mine`, { signal });
export const createOrder = (authenticatedRequest, storeId, items, signal) => authenticatedRequest(`/api/stores/${storeId}/orders`, {
  method: 'POST', expectedStatus: 201, body: { items: items.map(({ menu_item_id, quantity }) => ({ menu_item_id, quantity })) }, signal,
});
