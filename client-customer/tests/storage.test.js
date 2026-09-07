import { describe, expect, it } from 'vitest';
import { cartKey, readCart, readSetup, SETUP_KEY, writeStorage } from '../src/storage/customer-storage.js';
describe('persistent customer state', () => {
  it('recovers invalid JSON and missing setup fields', () => { localStorage.setItem(SETUP_KEY, '{'); expect(readSetup()).toBeNull(); writeStorage(SETUP_KEY, { token: 'x' }); expect(readSetup()).toBeNull(); });
  it('isolates tables and rejects corrupt cart rows', () => { writeStorage(cartKey(1, 1), { version: 1, items: [{ menu_item_id: 1, name: '커피', unit_price: 4000, quantity: 2 }, { menu_item_id: 2, name: 'X', unit_price: -1, quantity: 0 }] }); expect(readCart(cartKey(1, 1)).items).toHaveLength(1); expect(readCart(cartKey(1, 2)).items).toHaveLength(0); });
  it('migrates the proposed legacy array and combines duplicates', () => { const row = { menu_item_id: 1, name: '커피', unit_price: 4000, quantity: 600 }; writeStorage('cart', [row, row]); expect(readCart('cart').items[0].quantity).toBe(999); });
  it('preserves uncertain submissions across reload', () => { writeStorage('cart', { version: 1, items: [], uncertain: true }); expect(readCart('cart').uncertain).toBe(true); });
});
