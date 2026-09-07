import Dialog from './Dialog.jsx';
import { money } from '../utils/format.js';
export default function OrderConfirmDialog({ cart, busy, error, onClose, onSubmit }) {
  return <Dialog title="이대로 주문할까요?" onClose={onClose} busy={busy}><ul className="confirm-items">{cart.items.map((item) => <li key={item.menu_item_id}><span>{item.name} × {item.quantity}</span><strong>{money(item.unit_price * item.quantity)}</strong></li>)}</ul><div className="total-line"><span>총 주문 금액</span><strong>{money(cart.total)}</strong></div>{error && <p role="alert" className="error">{error}</p>}<p className="muted small">주문이 접수되면 매장에서 바로 준비를 시작해요.</p><button className="primary full" disabled={busy || cart.uncertain} onClick={onSubmit} data-testid="order-confirm-submit-button">{busy ? '주문을 보내고 있어요…' : '주문 확정'}</button></Dialog>;
}
