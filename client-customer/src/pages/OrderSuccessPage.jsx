import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { money } from '../utils/format.js';
export default function OrderSuccessPage() {
  const { state } = useLocation(); const navigate = useNavigate(); const [seconds, setSeconds] = useState(5);
  useEffect(() => { if (!state?.order) return; const interval = setInterval(() => setSeconds((n) => Math.max(0, n - 1)), 1000); const timeout = setTimeout(() => navigate('/', { replace: true }), 5000); return () => { clearInterval(interval); clearTimeout(timeout); }; }, [state, navigate]);
  if (!state?.order) return <Navigate to="/" replace />;
  return <section className="success-page"><div className="success-icon" aria-hidden="true">✓</div><span className="eyebrow">THANK YOU</span><h1>주문이 접수되었어요!</h1><p>정성껏 준비해서 가져다드릴게요.</p><div className="receipt"><span>주문 번호</span><strong data-testid="success-order-number">#{state.order.id}</strong><span>주문 금액</span><b>{money(state.order.total_amount)}</b></div><p className="muted" role="status">{seconds}초 후 메뉴 화면으로 이동합니다.</p><Link to="/" replace className="primary button-link" data-testid="success-menu-link">메뉴로 돌아가기</Link></section>;
}
