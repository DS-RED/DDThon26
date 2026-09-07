import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';
import { getOrders } from '../api/orders.js';
import OrderCard from '../components/OrderCard.jsx';
export default function OrdersPage() {
  const { session, authenticatedRequest } = useAuth(); const cart = useCart();
  const [orders, setOrders] = useState(null); const [error, setError] = useState(''); const [reload, setReload] = useState(0); const [page, setPage] = useState(1); const [reviewed, setReviewed] = useState(false);
  useEffect(() => { const refresh = () => { setReviewed(false); setReload((n) => n + 1); }; window.addEventListener('focus', refresh); return () => window.removeEventListener('focus', refresh); }, []);
  useEffect(() => { const controller = new AbortController(); setOrders(null); setError('');
    getOrders(authenticatedRequest, session.table.storeId, controller.signal).then((data) => { setOrders([...data].sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id)); setPage(1); }).catch((err) => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [session.table.storeId, authenticatedRequest, reload]);
  const totalPages = Math.max(1, Math.ceil((orders?.length || 0) / 10));
  return <><div className="page-heading"><span className="eyebrow">MADE WITH CARE</span><h1>주문 내역</h1><p>지금 테이블에서 주문한 메뉴를 확인하세요.</p></div><div className="section-heading"><h2>현재 주문 {orders && <span className="muted">{orders.length}</span>}</h2><button onClick={() => { setReviewed(false); setReload((n) => n + 1); }} data-testid="orders-refresh-button">↻ 새로고침</button></div>{error ? <p role="alert" className="error">{error}</p> : !orders ? <p className="empty" role="status">주문 내역을 확인하고 있어요…</p> : <>{cart.uncertain && <section className="notice"><h2>이전 주문의 접수 여부를 확인해 주세요</h2><p>방금 보낸 주문이 목록에 있는지 확인해 주세요. 확인이 어려우면 직원에게 문의해 주세요.</p><label className="check-label"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} data-testid="orders-reviewed-checkbox" /> 주문 내역 또는 직원 안내로 접수 여부를 확인했어요.</label><button disabled={!reviewed} onClick={() => { cart.dispatch({ type: 'success', sessionId: cart.sessionMarker }); setReviewed(false); }} data-testid="orders-resolve-success-button">접수됨 · 장바구니 비우기</button><button disabled={!reviewed} onClick={() => { cart.dispatch({ type: 'uncertain', value: false }); setReviewed(false); }} data-testid="orders-resolve-retry-button">접수 안 됨 · 장바구니 유지</button></section>}{!orders.length ? <div className="empty"><h2>아직 주문한 메뉴가 없어요</h2><p>주문이 접수되면 여기에 표시됩니다.</p></div> : <div className="orders-grid">{orders.slice((page - 1) * 10, page * 10).map((order) => <OrderCard key={order.id} order={order} />)}</div>}{totalPages > 1 && <nav className="pagination" aria-label="주문 내역 페이지"><button disabled={page === 1} onClick={() => setPage((n) => n - 1)} data-testid="orders-previous-button">이전</button><span>{page} / {totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((n) => n + 1)} data-testid="orders-next-button">다음</button></nav>}</>}</>;
}
