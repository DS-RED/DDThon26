import { useEffect, useState } from 'react';
import { getMenu } from '../api/menu.js';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useCart } from '../cart/CartProvider.jsx';
import MenuCard from '../components/MenuCard.jsx';
import CategoryNav from '../components/CategoryNav.jsx';
import MenuDetailDialog from '../components/MenuDetailDialog.jsx';
export default function MenuPage() {
  const { session } = useAuth(); const cart = useCart();
  const [groups, setGroups] = useState(null); const [error, setError] = useState(''); const [retry, setRetry] = useState(0);
  const [active, setActive] = useState('all'); const [detail, setDetail] = useState(null); const [notice, setNotice] = useState('');
  useEffect(() => { const controller = new AbortController(); setError('');
    getMenu(session.table.storeId, controller.signal).then((data) => setGroups([...data.filter((g) => g.category), ...data.filter((g) => !g.category)])).catch((err) => { if (err.name !== 'AbortError') setError(err.message); });
    return () => controller.abort();
  }, [session.table.storeId, retry]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 2500); return () => clearTimeout(timer); }, [notice]);
  const add = (item) => { cart.dispatch({ type: 'add', item }); setNotice(`${item.name} 장바구니에 담았어요.`); };
  return <><section className="hero"><div><span className="eyebrow">FRESHLY MADE, JUST FOR YOU</span><h1>오늘은 어떤 메뉴가<br />끌리시나요?</h1><p>좋아하는 메뉴를 골라, 여유롭게 즐겨보세요.</p></div><div className="hero-art" aria-hidden="true"><div className="saucer"><div className="cup"><div className="coffee">✦</div></div></div><span>작은 쉼, 따뜻한 한 잔</span></div></section>{error ? <div className="empty" role="alert"><p>{error}</p><button onClick={() => setRetry((n) => n + 1)} data-testid="menu-retry-button">다시 불러오기</button></div> : !groups ? <p role="status" className="empty">메뉴를 준비하고 있어요…</p> : <><CategoryNav groups={groups} active={active} onSelect={setActive} /><div className="section-heading"><h2>{active === 'all' ? '전체 메뉴' : groups.find((g) => String(g.category?.id ?? 'other') === active)?.category?.name || '기타'}</h2><span className="muted">주문 후 정성껏 준비해 드려요</span></div>{groups.flatMap((g) => g.items).length === 0 && <p className="empty">아직 준비된 메뉴가 없어요.</p>}{groups.filter((g) => active === 'all' || String(g.category?.id ?? 'other') === active).map((group) => <section key={group.category?.id ?? 'other'} aria-label={group.category?.name || '기타'}>{active === 'all' && <h3 className="group-title">{group.category?.name || '기타'}</h3>}<div className="menu-grid">{group.items.map((item) => <MenuCard key={item.id} item={item} onDetail={setDetail} onAdd={add} locked={cart.uncertain} />)}</div></section>)}</>}{detail && <MenuDetailDialog item={detail} onClose={() => setDetail(null)} onAdd={add} locked={cart.uncertain} />}<div className={notice ? 'toast' : 'sr-only'} role="status">{notice}</div></>;
}
