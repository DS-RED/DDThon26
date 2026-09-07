export const SETUP_KEY = 'table-order:customer:setup:v1';
export const cartKey = (storeId, tableId) => `cart:${storeId}:${tableId}`;
export function readStorage(key, fallback = null) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
export function writeStorage(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function readSetup() {
  const value = readStorage(SETUP_KEY);
  if (!value || typeof value.credentials?.storeCode !== 'string' || typeof value.credentials?.tableNumber !== 'string' || typeof value.credentials?.password !== 'string') return null;
  if (typeof value.token !== 'string' || !Number.isInteger(value.table?.id) || value.table.id < 1 || !Number.isInteger(value.table?.storeId) || value.table.storeId < 1 || typeof value.table?.tableNumber !== 'string') return null;
  return value;
}
export const emptyCart = () => ({ version: 1, items: [], sessionMarker: null, uncertain: false });
export function readCart(key) {
  const value = readStorage(key);
  const items = Array.isArray(value) ? value : value?.version === 1 ? value.items : [];
  if (!Array.isArray(items)) return emptyCart();
  const unique = new Map();
  for (const item of items) {
    if (!Number.isInteger(item?.menu_item_id) || item.menu_item_id < 1 || typeof item.name !== 'string' || !Number.isInteger(item.unit_price) || item.unit_price < 0 || item.unit_price > 100000000 || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 999) continue;
    const previous = unique.get(item.menu_item_id);
    unique.set(item.menu_item_id, { menu_item_id: item.menu_item_id, name: item.name, unit_price: item.unit_price, quantity: Math.min(999, item.quantity + (previous?.quantity || 0)) });
  }
  return { version: 1, items: [...unique.values()], sessionMarker: Number.isInteger(value?.sessionMarker) ? value.sessionMarker : null, uncertain: value?.uncertain === true };
}
