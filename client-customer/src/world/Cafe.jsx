import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';
import { myTable } from '../three/cafe-layout.js';
import CafeCanvas from '../three/CafeCanvas.jsx';
import OrderPanel from './OrderPanel.jsx';
import SuccessPanel from './SuccessPanel.jsx';

// 3D-first customer experience: walk the cafe, reach your table, order.
export default function Cafe() {
  const { session, reset } = useAuth();
  const cart = useCart();
  const myNumber = myTable(session.table.tableNumber).number;

  const [view, setView] = useState('world'); // 'world' | 'order' | 'success'
  const [focused, setFocused] = useState(null);
  const [locked, setLocked] = useState(false);
  const [order, setOrder] = useState(null);

  const onFocusChange = useCallback((n) => setFocused(n), []);
  const onLockChange = useCallback((l) => setLocked(l), []);

  const openOrder = useCallback(() => {
    document.exitPointerLock?.();
    setView('order');
  }, []);
  const backToWorld = useCallback(() => setView('world'), []);
  const onOrdered = useCallback((o) => { setOrder(o); setView('success'); }, []);

  // Press E at your table to open the ordering panel.
  useEffect(() => {
    if (view !== 'world') return undefined;
    const onKey = (e) => { if (e.code === 'KeyE' && focused) openOrder(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, focused, openOrder]);

  return (
    <div className="cafe-root">
      {/* While the ordering overlay is open the 3D layer (canvas + drei labels)
          must not receive pointer events, or it steals clicks from the overlay. */}
      <div className={`cafe-scene${view === 'world' ? '' : ' inert'}`}>
        <CafeCanvas
          myNumber={myNumber}
          focusedNumber={focused}
          active={view === 'world'}
          onFocusChange={onFocusChange}
          onLockChange={onLockChange}
        />
      </div>

      {view === 'world' && (
        <div className="hud">
          <div className="crosshair" aria-hidden="true" />
          <div className="hud-top">
            <span className="hud-table">내 자리 · TABLE {myNumber}</span>
            <button className="hud-reset" onClick={() => { if (!cart.uncertain) { cart.dispatch({ type: 'clear' }); reset(); } }} disabled={cart.uncertain} data-testid="table-reset-button">테이블 설정</button>
          </div>

          {!locked && (
            <div className="hud-enter" data-testid="enter-hint">
              <h2>카페에 오신 걸 환영해요 ☕</h2>
              <p>화면을 클릭해 입장하세요.</p>
              <p className="hud-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> 이동 · 마우스 시선 · <kbd>E</kbd> 주문 · <kbd>Esc</kbd> 마우스 해제</p>
            </div>
          )}

          {locked && focused && (
            <div className="hud-prompt" role="status" data-testid="interact-prompt">
              <kbd>E</kbd> 눌러 <strong>테이블 {focused}</strong> 주문하기
              {cart.count > 0 && <span className="hud-cart"> · 장바구니 {cart.count}개</span>}
            </div>
          )}

          {locked && !focused && (
            <p className="hud-hint">내 자리(TABLE {myNumber})로 걸어가 보세요</p>
          )}
        </div>
      )}

      {view === 'order' && (
        <OrderPanel tableNumber={focused ?? myNumber} onClose={backToWorld} onOrdered={onOrdered} />
      )}

      {view === 'success' && order && (
        <SuccessPanel order={order} onDone={() => { setOrder(null); backToWorld(); }} />
      )}
    </div>
  );
}
