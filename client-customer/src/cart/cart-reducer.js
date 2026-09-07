export const cartTotal = (items) => items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
export function cartReducer(state, action) {
  if (action.type === 'uncertain') return { ...state, uncertain: action.value };
  if (action.type === 'success') return { ...state, items: [], uncertain: false, sessionMarker: action.sessionId };
  if (state.uncertain) return state;
  switch (action.type) {
    case 'add': {
      if (!action.item.is_available) return state;
      const item = state.items.find((row) => row.menu_item_id === action.item.id);
      return { ...state, items: item ? state.items.map((row) => row === item ? { ...row, quantity: Math.min(999, row.quantity + 1) } : row) : [...state.items, { menu_item_id: action.item.id, name: action.item.name, unit_price: action.item.price, quantity: 1 }] };
    }
    case 'quantity': return { ...state, items: state.items.map((row) => row.menu_item_id === action.id ? { ...row, quantity: Math.max(0, Math.min(999, action.quantity)) } : row).filter((row) => row.quantity > 0) };
    case 'remove': return { ...state, items: state.items.filter((row) => row.menu_item_id !== action.id) };
    case 'clear': return { ...state, items: [] };
    case 'prices': return { ...state, items: state.items.map((row) => { const menu = action.items.find((item) => item.id === row.menu_item_id); return menu ? { ...row, name: menu.name, unit_price: menu.price } : row; }) };
    default: return state;
  }
}
