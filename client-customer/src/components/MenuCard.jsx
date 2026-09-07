import { useState } from 'react';
import { money } from '../utils/format.js';
export function MenuImage({ item }) {
  const [failed, setFailed] = useState(false);
  return item.image_url && !failed ? <img src={item.image_url} alt={item.name} loading="lazy" onError={() => setFailed(true)} /> : <div className="image-fallback" role="img" aria-label={item.name}><span aria-hidden="true">☕</span></div>;
}
export default function MenuCard({ item, onDetail, onAdd, locked }) {
  return <article className={`menu-card ${item.is_available ? '' : 'sold-out'}`}><button className="image-button" onClick={() => onDetail(item)} aria-label={`${item.name} 상세 보기`} data-testid={`menu-detail-${item.id}`}><MenuImage item={item} />{!item.is_available && <span className="sold-label">품절</span>}</button><div className="menu-card-body"><h3>{item.name}</h3><p className="description">{item.description || '정성껏 준비한 메뉴입니다.'}</p><div className="price-row"><strong>{money(item.price)}</strong><button className="add-button" disabled={!item.is_available || locked} onClick={() => onAdd(item)} aria-label={`${item.name} 담기`} data-testid={`menu-add-${item.id}`}>+</button></div></div></article>;
}
