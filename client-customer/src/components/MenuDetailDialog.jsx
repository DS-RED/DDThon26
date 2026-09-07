import Dialog from './Dialog.jsx';
import { MenuImage } from './MenuCard.jsx';
import { money } from '../utils/format.js';
export default function MenuDetailDialog({ item, onClose, onAdd, locked }) {
  return <Dialog title={item.name} onClose={onClose}><div className="detail-image"><MenuImage item={item} /></div><p>{item.description}</p><p className="large-price">{money(item.price)}</p><button className="primary full" disabled={!item.is_available || locked} onClick={() => { onAdd(item); onClose(); }} data-testid="menu-detail-add-button">{item.is_available ? '장바구니에 담기' : '오늘은 품절이에요'}</button></Dialog>;
}
