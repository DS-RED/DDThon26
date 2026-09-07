import { useEffect, useState } from 'react';
import { money } from '../utils/format.js';

// Order-success screen. Auto-returns to the cafe after 5 seconds (FR-C4).
export default function SuccessPanel({ order, onDone }) {
  const [seconds, setSeconds] = useState(5);
  useEffect(() => {
    const interval = setInterval(() => setSeconds((n) => Math.max(0, n - 1)), 1000);
    const timeout = setTimeout(onDone, 5000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [onDone]);
  return (
    <div className="overlay-screen">
      <section className="success-page overlay-panel">
        <div className="success-icon" aria-hidden="true">✓</div>
        <span className="eyebrow">THANK YOU</span>
        <h1>주문이 접수되었어요!</h1>
        <p>정성껏 준비해서 가져다드릴게요.</p>
        <div className="receipt">
          <span>주문 번호</span><strong data-testid="success-order-number">#{order.id}</strong>
          <span>주문 금액</span><b>{money(order.total_amount)}</b>
        </div>
        <p className="muted" role="status">{seconds}초 후 카페로 돌아갑니다.</p>
        <button className="primary" onClick={onDone} data-testid="success-menu-link">카페로 돌아가기</button>
      </section>
    </div>
  );
}
