import { expect, it } from 'vitest';
import { cartReducer, cartTotal } from '../src/cart/cart-reducer.js';
import { emptyCart } from '../src/storage/customer-storage.js';
const item = { id: 1, name: '커피', price: 4000, is_available: true };
it('merges identical menu items and computes totals', () => { const state = cartReducer(cartReducer(emptyCart(), { type: 'add', item }), { type: 'add', item }); expect(state.items).toHaveLength(1); expect(cartTotal(state.items)).toBe(8000); });
it('caps quantities and removes at zero', () => { const state = cartReducer(emptyCart(), { type: 'add', item }); expect(cartReducer(state, { type: 'quantity', id: 1, quantity: 1000 }).items[0].quantity).toBe(999); expect(cartReducer(state, { type: 'quantity', id: 1, quantity: 0 }).items).toHaveLength(0); });
it('does not add unavailable items', () => expect(cartReducer(emptyCart(), { type: 'add', item: { ...item, is_available: false } }).items).toHaveLength(0));
it('locks an uncertain order until explicitly resolved', () => { const state = { ...emptyCart(), uncertain: true }; expect(cartReducer(state, { type: 'add', item })).toEqual(state); });
it('clears only on success while retaining the returned session id', () => { const state = cartReducer(emptyCart(), { type: 'add', item }); expect(cartReducer(state, { type: 'success', sessionId: 5 })).toEqual({ version: 1, items: [], uncertain: false, sessionMarker: 5 }); });
