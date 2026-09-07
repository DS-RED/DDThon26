import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthProvider.jsx';
import { useNavigate } from 'react-router-dom';
export default function SetupPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  const controller = useRef(null);
  useEffect(() => () => controller.current?.abort(), []);
  async function submit(event) {
    event.preventDefault(); if (controller.current) return;
    const data = new FormData(event.currentTarget);
    controller.current = new AbortController(); setBusy(true); setError('');
    try { await signIn({ storeCode: data.get('storeCode').trim(), tableNumber: data.get('tableNumber').trim(), password: data.get('password') }, controller.current.signal); navigate('/', { replace: true }); }
    catch (err) { if (err.name !== 'AbortError') setError(err.message); }
    finally { controller.current = null; setBusy(false); }
  }
  return <main className="setup-layout"><div className="setup-intro"><span className="eyebrow">TABLE ORDER</span><h1>편안한 자리에서,<br />맛있는 시간을.</h1><p>테이블을 연결하면<br />메뉴를 고르고 바로 주문할 수 있어요.</p><span className="brand-seal" aria-hidden="true">한 잔의 여유</span></div><section className="setup-card"><span className="eyebrow">WELCOME</span><h2>테이블 연결</h2><p>처음 한 번, 매장의 테이블 정보를 입력해 주세요.</p><form onSubmit={submit} data-testid="setup-form"><fieldset disabled={busy}><label>매장 코드<input name="storeCode" autoComplete="off" required placeholder="매장 코드 입력" data-testid="setup-store-input" /></label><label>테이블 번호<input name="tableNumber" autoComplete="off" required placeholder="예: 1" data-testid="setup-table-input" /></label><label>테이블 비밀번호<input name="password" type="password" autoComplete="current-password" placeholder="비밀번호 입력" data-testid="setup-password-input" /></label>{error && <p role="alert" className="error">{error}</p>}<button className="primary full" data-testid="setup-submit-button">{busy ? '연결하고 있어요…' : '메뉴 보러 가기 →'}</button></fieldset></form><p className="muted small">연결 정보는 이 기기에 저장됩니다.</p></section></main>;
}
