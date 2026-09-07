import { useEffect, useRef, useState } from 'react';
import { getMenu } from '../api/menu.js';
import { createOrder } from '../api/orders.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';

export function useCheckout(onSuccess) {
  const { session, authenticatedRequest } = useAuth(); const cart = useCart();
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const lock = useRef(false); const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit() {
    if (lock.current || cart.uncertain || !cart.items.length) return;
    lock.current = true; setBusy(true); setError(''); controller.current = new AbortController();
    let posted = false;
    try {
      const groups = await getMenu(session.table.storeId, controller.current.signal);
      const menu = groups.flatMap((g) => g.items);
      const missing = cart.items.filter((item) => !menu.some((m) => m.id === item.menu_item_id && m.is_available));
      if (missing.length) { setError(`${missing.map((m) => m.name).join(', ')} 메뉴는 현재 주문할 수 없어요. 장바구니에서 수정해 주세요.`); return; }
      if (cart.items.some((item) => menu.find((m) => m.id === item.menu_item_id).price !== item.unit_price)) {
        cart.dispatch({ type: 'prices', items: menu }); setError('메뉴 가격이 변경되었어요. 새 금액을 확인한 후 다시 주문해 주세요.'); return;
      }
      // Persist uncertainty before sending: reload/closed tab must not silently retry.
      cart.dispatch({ type: 'uncertain', value: true }); posted = true;
      const order = await createOrder(authenticatedRequest, session.table.storeId, cart.items, controller.current.signal);
      if (!Number.isInteger(order.id) || !Number.isInteger(order.total_amount) || !Number.isInteger(order.session_id)) throw new Error('invalid order response');
      cart.dispatch({ type: 'success', sessionId: order.session_id }); onSuccess(order);
    } catch (err) {
      if (err.name === 'AbortError') return;
      const uncertain = posted && (!err.status || err.status >= 500);
      if (posted && !uncertain) cart.dispatch({ type: 'uncertain', value: false });
      setError(uncertain ? '주문이 접수되었을 수 있어요. 다시 주문하기 전에 주문 내역을 확인해 주세요.' : err.message);
    } finally { lock.current = false; setBusy(false); }
  }
  return { submit, busy, error };
}
