import { useEffect, useState } from 'react';
import { Link, Navigate, NavLink, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthProvider.jsx';
import { CartProvider, useCart } from './cart/CartProvider.jsx';
import { getStore } from './api/menu.js';
import { money } from './utils/format.js';
import SetupPage from './pages/SetupPage.jsx';
import MenuPage from './pages/MenuPage.jsx';
import CartPage from './pages/CartPage.jsx';
import OrdersPage from './pages/OrdersPage.jsx';
import OrderSuccessPage from './pages/OrderSuccessPage.jsx';
import Dialog from './components/Dialog.jsx';

function AppShell() {
  const { session, reset, storageError } = useAuth(); const cart = useCart();
  const [store, setStore] = useState(null); const [settings, setSettings] = useState(false);
  useEffect(() => { const controller = new AbortController(); getStore(session.table.storeId, controller.signal).then(setStore).catch(() => {}); return () => controller.abort(); }, [session.table.storeId]);
  return <><a className="skip-link" href="#main">본문으로 이동</a><header className="app-header"><Link className="brand" to="/" data-testid="brand-home-link"><span className="brand-mark" aria-hidden="true">t.</span><span>{store?.name || '테이블오더'}<small>TABLE ORDER</small></span></Link><nav className="main-nav" aria-label="주요 메뉴"><NavLink to="/" end data-testid="nav-menu-link">메뉴</NavLink><NavLink to="/orders" data-testid="nav-orders-link">주문 내역</NavLink><NavLink to="/cart" data-testid="nav-cart-link">장바구니 <span className="badge">{cart.count}</span></NavLink></nav><button className="table-tag" onClick={() => setSettings(true)} disabled={cart.uncertain} data-testid="table-settings-button"><span>TABLE</span><strong>{session.table.tableNumber}</strong></button></header>{(storageError || cart.storageError) && <p className="storage-warning" role="alert">이 기기에 정보를 저장할 수 없어 새로고침하면 선택이 사라질 수 있어요.</p>}<main id="main" className="main-content"><Routes><Route path="/" element={<MenuPage />} /><Route path="/cart" element={<CartPage />} /><Route path="/orders" element={<OrdersPage />} /><Route path="/order-success" element={<OrderSuccessPage />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></main><footer className="app-footer"><span>맛있는 시간, 편안한 주문.</span><Link to="/cart" className="footer-cart" data-testid="footer-cart-link">장바구니 {cart.count}개 <strong>{money(cart.total)} →</strong></Link></footer>{settings && <Dialog title="테이블 설정 변경" onClose={() => setSettings(false)}><p>현재 장바구니를 비우고 테이블 연결 화면으로 돌아갑니다.</p><button className="primary full" onClick={() => { cart.dispatch({ type: 'clear' }); reset(); }} data-testid="table-reset-button">설정 변경하기</button></Dialog>}</>;
}
function CustomerApp() {
  const { session } = useAuth();
  return session ? <CartProvider key={`${session.table.storeId}:${session.table.id}`} table={session.table}><AppShell /></CartProvider> : <SetupPage />;
}
export default function App() { return <AuthProvider><CustomerApp /></AuthProvider>; }
