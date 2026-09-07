import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { useOrderStream } from '../hooks/useOrderStream.js';
import {
  listTables,
  listCurrentOrders,
  updateOrderStatus,
  deleteOrder,
  closeSession,
} from '../api/endpoints.js';
import { won, timeAgoOrClock, STATUS_LABEL } from '../lib/format.js';

const NEXT_STATUS = { pending: 'preparing', preparing: 'completed' };

export default function DashboardPage() {
  const { profile } = useAuth();
  const storeId = profile?.storeId;
  const toast = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null); // { orders: [...] }
  const [detailLoading, setDetailLoading] = useState(false);

  const loadTables = useCallback(async () => {
    if (!storeId) return;
    try {
      const data = await listTables(storeId);
      setTables(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  const loadDetail = useCallback(
    async (tableId) => {
      if (!storeId || tableId == null) return;
      setDetailLoading(true);
      try {
        const orders = await listCurrentOrders(storeId, tableId);
        setDetail({ orders: Array.isArray(orders) ? orders : [] });
      } catch (err) {
        toast.error(err.message);
      } finally {
        setDetailLoading(false);
      }
    },
    [storeId, toast],
  );

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  useEffect(() => {
    if (selectedId != null) loadDetail(selectedId);
    else setDetail(null);
  }, [selectedId, loadDetail]);

  // 실시간 이벤트 → 요약/상세 갱신
  const onEvent = useCallback(
    (type, data) => {
      loadTables();
      if (selectedId != null) loadDetail(selectedId);
      if (type === 'order.created') {
        const tno = data?.table_id;
        toast.info(`새 주문 · 테이블 ${tno ?? ''}`);
      }
      if (type === 'session.closed' && data?.tableId === selectedId) {
        setSelectedId(null);
      }
    },
    [loadTables, loadDetail, selectedId, toast],
  );
  const { connected } = useOrderStream(storeId, onEvent);

  const selectedTable = tables.find((t) => t.id === selectedId) || null;

  const onAdvance = async (order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    try {
      await updateOrderStatus(storeId, order.id, next);
      loadDetail(selectedId);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDelete = async (order) => {
    if (!window.confirm(`주문 #${order.id}을(를) 삭제할까요? (직권 삭제)`)) return;
    try {
      await deleteOrder(storeId, order.id);
      toast.success('주문을 삭제했습니다.');
      loadDetail(selectedId);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onCloseSession = async (tableId) => {
    if (!window.confirm('이 테이블 세션을 종료(이용 완료)할까요? 현재 주문은 이력으로 이동합니다.')) return;
    try {
      const res = await closeSession(storeId, tableId);
      toast.success(`세션 종료 완료 (이력 이동 ${res?.movedOrders ?? 0}건)`);
      setSelectedId(null);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page dashboard">
      <div className="page-head">
        <h2>실시간 모니터링</h2>
        <div className="live-status">
          <span className={`dot ${connected ? 'on' : 'off'}`} />
          {connected ? '실시간 연결됨' : '연결 대기…'}
          <button className="btn btn-ghost btn-sm" onClick={loadTables}>새로고침</button>
        </div>
      </div>

      {error && <div className="banner banner-error">{error}</div>}
      {loading ? (
        <div className="muted">불러오는 중…</div>
      ) : tables.length === 0 ? (
        <div className="empty">등록된 테이블이 없습니다. “테이블 관리”에서 추가하세요.</div>
      ) : (
        <div className="table-grid">
          {tables.map((t) => {
            const active = !!t.session_id;
            return (
              <button
                key={t.id}
                className={`table-card ${active ? 'active' : 'idle'} ${selectedId === t.id ? 'selected' : ''}`}
                onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
              >
                <div className="tc-head">
                  <span className="tc-no">테이블 {t.table_number}</span>
                  <span className={`chip ${active ? 'chip-live' : 'chip-idle'}`}>
                    {active ? '이용중' : '비어있음'}
                  </span>
                </div>
                <div className="tc-metrics">
                  <div><b>{t.order_count ?? 0}</b> 건</div>
                  <div className="tc-amount">{won(t.total_amount)}</div>
                </div>
                {Array.isArray(t.latest_orders) && t.latest_orders.length > 0 && (
                  <ul className="tc-preview">
                    {t.latest_orders.slice(0, 3).map((o) => (
                      <li key={o.id}>
                        <span className={`sdot s-${o.status}`} />
                        #{o.id} · {won(o.total_amount)} · {timeAgoOrClock(o.created_at)}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>
      )}

      {selectedTable && (
        <section className="detail-panel">
          <div className="dp-head">
            <h3>테이블 {selectedTable.table_number} · 현재 주문</h3>
            <div className="dp-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => loadDetail(selectedId)}>새로고침</button>
              <button className="btn btn-warn btn-sm" onClick={() => onCloseSession(selectedTable.id)}>
                이용 완료(세션 종료)
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedId(null)}>닫기</button>
            </div>
          </div>

          {detailLoading ? (
            <div className="muted">불러오는 중…</div>
          ) : !detail || detail.orders.length === 0 ? (
            <div className="empty">현재 세션에 주문이 없습니다.</div>
          ) : (
            <div className="order-list">
              {detail.orders.map((o) => (
                <article key={o.id} className="order-card">
                  <header className="oc-head">
                    <span className="oc-id">#{o.id}</span>
                    <span className={`chip s-${o.status}`}>{STATUS_LABEL[o.status] || o.status}</span>
                    <span className="oc-time">{timeAgoOrClock(o.created_at)}</span>
                  </header>
                  <ul className="oc-items">
                    {o.items.map((it) => (
                      <li key={it.id}>
                        <span>{it.menu_name}</span>
                        <span className="oc-qty">× {it.quantity}</span>
                        <span className="oc-price">{won(it.unit_price * it.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <footer className="oc-foot">
                    <span className="oc-total">합계 {won(o.total_amount)}</span>
                    <span className="oc-btns">
                      {NEXT_STATUS[o.status] && (
                        <button className="btn btn-primary btn-sm" onClick={() => onAdvance(o)}>
                          {STATUS_LABEL[NEXT_STATUS[o.status]]}(으)로
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(o)}>삭제</button>
                    </span>
                  </footer>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
