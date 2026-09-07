import { createContext, useContext, useReducer, useRef, useState } from 'react';
import { cartKey, readCart, writeStorage } from '../storage/customer-storage.js';
import { cartReducer, cartTotal } from './cart-reducer.js';
const CartContext = createContext(null);
export function CartProvider({ table, children }) {
  const key = cartKey(table.storeId, table.id);
  const [state, dispatch] = useReducer(cartReducer, key, readCart);
  const latest = useRef(state);
  const [storageError, setStorageError] = useState(false);
  // Persist inside the explicit action, before navigation or the next render.
  function send(action) {
    const next = cartReducer(latest.current, action);
    latest.current = next;
    setStorageError(!writeStorage(key, next)); dispatch(action);
  }
  return <CartContext.Provider value={{ ...state, dispatch: send, total: cartTotal(state.items), count: state.items.reduce((sum, row) => sum + row.quantity, 0), storageError }}>{children}</CartContext.Provider>;
}
export const useCart = () => useContext(CartContext);
