import { money, orderStatus, orderTime } from '../utils/format.js';
export default function OrderCard({ order }) {
  return <article className="order-card"><header><div><h2>주문 #{order.id}</h2><p className="muted small">{orderTime(order.created_at)}</p></div><span className={`status status-${order.status}`}>{orderStatus[order.status] || '확인 중'}</span></header><ul className="confirm-items">{order.items.map((item, index) => <li key={item.id ?? index}><span>{item.menu_name} × {item.quantity}</span><span>{money(item.unit_price * item.quantity)}</span></li>)}</ul><div className="total-line"><span>주문 금액</span><strong>{money(order.total_amount)}</strong></div></article>;
}
