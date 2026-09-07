export default function CategoryNav({ groups, active, onSelect }) {
  return <nav className="categories" aria-label="메뉴 카테고리"><button aria-pressed={active === 'all'} onClick={() => onSelect('all')} data-testid="category-all-button">전체 메뉴</button>{groups.map((group) => { const id = String(group.category?.id ?? 'other'); return <button key={id} aria-pressed={active === id} onClick={() => onSelect(id)} data-testid={`category-${id}-button`}>{group.category?.name || '기타'}</button>; })}</nav>;
}
