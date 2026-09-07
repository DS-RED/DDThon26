import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { listTables, createTable, closeSession, listHistory } from '../api/endpoints.js';
import { won, dateTime, STATUS_LABEL } from '../lib/format.js';

export default function TablesPage() {
  const { profile } = useAuth();
  const storeId = profile?.storeId;
  const toast = useToast();

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // 새 테이블 폼
  const [tableNumber, setTableNumber] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // 이력
  const [histTableId, setHistTableId] = useState('');
  const [histDate, setHistDate] = useState('');
  const [history, setHistory] = useState(null);
  const [histLoading, setHistLoading] = useState(false);

  const loadTables = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      setTables(await listTables(storeId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const onCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createTable(storeId, {
        tableNumber: tableNumber.trim(),
        ...(password ? { password } : {}),
      });
      toast.success(`테이블 ${tableNumber} 추가됨`);
      setTableNumber('');
      setPassword('');
      loadTables();
    } catch (err) {
      toast.error(err.status === 409 ? '이미 존재하는 테이블 번호입니다.' : err.message);
    } finally {
      setCreating(false);
    }
  };

  const onClose = async (t) => {
    if (!window.confirm(`테이블 ${t.table_number} 세션을 종료할까요?`)) return;
    try {
      const res = await closeSession(storeId, t.id);
      toast.success(`세션 종료 (이력 이동 ${res?.movedOrders ?? 0}건)`);
      loadTables();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onLoadHistory = async (e) => {
    e.preventDefault();
    setHistLoading(true);
    try {
      const rows = await listHistory(storeId, {
        tableId: histTableId ? Number(histTableId) : undefined,
        date: histDate || undefined,
      });
      setHistory(Array.isArray(rows) ? rows : []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setHistLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-head"><h2>테이블 관리</h2></div>

      <section className="panel">
        <h3>테이블 초기 설정</h3>
        <form className="inline-form" onSubmit={onCreate}>
          <label className="field">
            <span>테이블 번호</span>
            <input value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} placeholder="예: 4" required />
          </label>
          <label className="field">
            <span>비밀번호(선택)</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="태블릿 로그인용" />
          </label>
          <button className="btn btn-primary" type="submit" disabled={creating}>
            {creating ? '추가 중…' : '테이블 추가'}
          </button>
        </form>
      </section>

      <section className="panel">
        <h3>테이블 목록</h3>
        {loading ? (
          <div className="muted">불러오는 중…</div>
        ) : (
          <table className="grid-table">
            <thead>
              <tr><th>번호</th><th>상태</th><th>현재 주문</th><th>현재 금액</th><th></th></tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.id}>
                  <td>테이블 {t.table_number}</td>
                  <td>
                    <span className={`chip ${t.session_id ? 'chip-live' : 'chip-idle'}`}>
                      {t.session_id ? '이용중' : '비어있음'}
                    </span>
                  </td>
                  <td>{t.order_count ?? 0}건</td>
                  <td>{won(t.total_amount)}</td>
                  <td className="ta-right">
                    <button className="btn btn-warn btn-sm" disabled={!t.session_id} onClick={() => onClose(t)}>
                      세션 종료
                    </button>
                  </td>
                </tr>
              ))}
              {tables.length === 0 && (
                <tr><td colSpan={5} className="muted">등록된 테이블이 없습니다.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </section>

      <section className="panel">
        <h3>과거 주문 내역</h3>
        <form className="inline-form" onSubmit={onLoadHistory}>
          <label className="field">
            <span>테이블</span>
            <select value={histTableId} onChange={(e) => setHistTableId(e.target.value)}>
              <option value="">전체</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>테이블 {t.table_number}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>날짜</span>
            <input type="date" value={histDate} onChange={(e) => setHistDate(e.target.value)} />
          </label>
          <button className="btn" type="submit" disabled={histLoading}>
            {histLoading ? '조회 중…' : '조회'}
          </button>
        </form>

        {history != null && (
          history.length === 0 ? (
            <div className="empty">해당 조건의 이력이 없습니다.</div>
          ) : (
            <div className="history-list">
              {history.map((h) => {
                const snap = h.order_snapshot || {};
                return (
                  <article key={h.id} className="order-card">
                    <header className="oc-head">
                      <span className="oc-id">주문 #{snap.order_id ?? '-'}</span>
                      <span className={`chip s-${snap.status}`}>{STATUS_LABEL[snap.status] || snap.status}</span>
                      <span className="oc-time">완료 {dateTime(h.completed_at)}</span>
                    </header>
                    <ul className="oc-items">
                      {(snap.items || []).map((it) => (
                        <li key={it.id}>
                          <span>{it.menu_name}</span>
                          <span className="oc-qty">× {it.quantity}</span>
                          <span className="oc-price">{won(it.unit_price * it.quantity)}</span>
                        </li>
                      ))}
                    </ul>
                    <footer className="oc-foot">
                      <span className="oc-total">합계 {won(h.total_amount)}</span>
                    </footer>
                  </article>
                );
              })}
            </div>
          )
        )}
      </section>
    </div>
  );
}
