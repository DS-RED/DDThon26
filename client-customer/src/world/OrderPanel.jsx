import { useEffect, useState } from 'react';
import { useCart } from '../cart/CartProvider.jsx';
import { useCheckout } from '../checkout/useCheckout.js';
import { money } from '../utils/format.js';
import MenuPage from '../pages/MenuPage.jsx';
import OrdersPage from '../pages/OrdersPage.jsx';
import OrderConfirmDialog from '../components/OrderConfirmDialog.jsx';

// Router-free cart view (adapted from CartPage) — success/navigation are callbacks.
function CartView({ onOrdered, onBrowse }) {
  const cart = useCart();
  const [confirm, setConfirm] = useState(false);
  const checkout = useCheckout(onOrdered);
  const busy = checkout.busy || cart.uncertain;
  if (!cart.items.length) {
    return (
      <div className="empty">
        <span className="empty-icon" aria-hidden="true">＋</span>
        <h2>장바구니가 비어 있어요</h2>
        <p>테이블에서 마음에 드는 메뉴를 담아보세요.</p>
        <button className="primary" onClick={onBrowse} data-testid="cart-menu-link">메뉴 고르기</button>
      </div>
    );
  }
  return (
    <div className="cart-layout">
      <section className="cart-items">
        <div className="section-heading">
          <h2>담은 메뉴 <span className="muted">{cart.count}</span></h2>
          <button disabled={busy} onClick={() => cart.dispatch({ type: 'clear' })} data-testid="cart-clear-button">전체 비우기</button>
        </div>
        {cart.items.map((item) => (
          <article className="cart-row" key={item.menu_item_id}>
            <div><h3>{item.name}</h3><p className="muted">{money(item.unit_price)}</p></div>
            <div className="quantity">
              <button disabled={busy} onClick={() => cart.dispatch({ type: 'quantity', id: item.menu_item_id, quantity: item.quantity - 1 })} aria-label={`${item.name} 수량 줄이기`} data-testid={`cart-decrease-${item.menu_item_id}`}>−</button>
              <span aria-label={`${item.name} 수량`}>{item.quantity}</span>
              <button disabled={busy || item.quantity >= 999} onClick={() => cart.dispatch({ type: 'quantity', id: item.menu_item_id, quantity: item.quantity + 1 })} aria-label={`${item.name} 수량 늘리기`} data-testid={`cart-increase-${item.menu_item_id}`}>+</button>
            </div>
            <strong>{money(item.unit_price * item.quantity)}</strong>
            <button disabled={busy} aria-label={`${item.name} 삭제`} onClick={() => cart.dispatch({ type: 'remove', id: item.menu_item_id })} data-testid={`cart-remove-${item.menu_item_id}`}>×</button>
          </article>
        ))}
      </section>
      <aside className="order-summary">
        <h2>주문 금액</h2>
        <div className="total-line"><span>총 {cart.count}개</span><strong>{money(cart.total)}</strong></div>
        <p className="muted small">주문을 확정하면 메뉴를 준비해 드려요.</p>
        <button className="primary full" disabled={busy} onClick={() => setConfirm(true)} data-testid="cart-checkout-button">주문하기 →</button>
        <button className="secondary-link" onClick={onBrowse} data-testid="cart-more-link">메뉴 더 고르기</button>
      </aside>
      {confirm && <OrderConfirmDialog cart={cart} {...checkout} onClose={() => setConfirm(false)} onSubmit={checkout.submit} />}
    </div>
  );
}

// Full-screen ordering overlay shown when the player interacts with their table.
export default function OrderPanel({ tableNumber, onClose, onOrdered }) {
  const cart = useCart();
  const [tab, setTab] = useState('menu');
  useEffect(() => {
    // Let a nested modal (menu detail / order confirm) handle Escape first;
    // only close the whole overlay when no <dialog> is open on top of it.
    const onKey = (e) => { if (e.code === 'Escape' && !document.querySelector('dialog[open]')) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="overlay-screen" role="dialog" aria-label={`테이블 ${tableNumber} 주문`}>
      <div className="overlay-panel">
        <header className="overlay-head">
          <div><span className="eyebrow">TABLE {tableNumber}</span><h1>테이블 주문</h1></div>
          <button className="overlay-close" aria-label="닫고 카페로 돌아가기" onClick={onClose} data-testid="overlay-close-button">✕ 카페로</button>
        </header>
        <nav className="overlay-tabs" aria-label="주문 메뉴">
          <button className={tab === 'menu' ? 'active' : ''} onClick={() => setTab('menu')} data-testid="tab-menu">메뉴</button>
          <button className={tab === 'cart' ? 'active' : ''} onClick={() => setTab('cart')} data-testid="tab-cart">장바구니 <span className="badge">{cart.count}</span></button>
          <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')} data-testid="tab-orders">주문 내역</button>
        </nav>
        <div className="overlay-body">
          {tab === 'menu' && <MenuPage />}
          {tab === 'cart' && <CartView onOrdered={onOrdered} onBrowse={() => setTab('menu')} />}
          {tab === 'orders' && <OrdersPage />}
        </div>
      </div>
    </div>
  );
}
