import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import {
  listMenu,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  createCategory,
  deleteCategory,
} from '../api/endpoints.js';
import { won } from '../lib/format.js';

const emptyItem = {
  category_id: '',
  name: '',
  price: '',
  description: '',
  image_url: '',
  display_order: 0,
  is_available: true,
};

export default function MenuPage() {
  const { profile } = useAuth();
  const storeId = profile?.storeId;
  const toast = useToast();

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | item object
  const [newCategory, setNewCategory] = useState('');

  const load = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      setGroups(await listMenu(storeId));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const categories = useMemo(
    () => groups.map((g) => g.category).filter(Boolean),
    [groups],
  );

  const onToggleAvailable = async (item) => {
    try {
      await updateMenuItem(storeId, item.id, { is_available: !item.is_available });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDelete = async (item) => {
    if (!window.confirm(`"${item.name}" 메뉴를 삭제할까요?`)) return;
    try {
      await deleteMenuItem(storeId, item.id);
      toast.success('메뉴를 삭제했습니다.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onSaveItem = async (form) => {
    const payload = {
      category_id: form.category_id === '' ? null : Number(form.category_id),
      name: form.name.trim(),
      price: Number(form.price),
      description: form.description?.trim() || null,
      image_url: form.image_url?.trim() || null,
      display_order: Number(form.display_order) || 0,
      is_available: !!form.is_available,
    };
    try {
      if (editing === 'new') {
        await createMenuItem(storeId, payload);
        toast.success('메뉴를 추가했습니다.');
      } else {
        await updateMenuItem(storeId, editing.id, payload);
        toast.success('메뉴를 수정했습니다.');
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.error(err.details ? `${err.message} (검증 실패)` : err.message);
    }
  };

  const onAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    try {
      await createCategory(storeId, { name: newCategory.trim(), display_order: categories.length });
      setNewCategory('');
      toast.success('분류를 추가했습니다.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const onDeleteCategory = async (cat) => {
    if (!window.confirm(`분류 "${cat.name}"을(를) 삭제할까요?`)) return;
    try {
      await deleteCategory(storeId, cat.id);
      toast.success('분류를 삭제했습니다.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <h2>메뉴 관리</h2>
        <button className="btn btn-primary" onClick={() => setEditing('new')}>+ 새 메뉴</button>
      </div>

      <section className="panel">
        <h3>분류</h3>
        <form className="inline-form" onSubmit={onAddCategory}>
          <label className="field">
            <span>새 분류 이름</span>
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="예: 시즌 메뉴" />
          </label>
          <button className="btn" type="submit">분류 추가</button>
        </form>
        <div className="chips-row">
          {categories.map((c) => (
            <span key={c.id} className="chip chip-cat">
              {c.name}
              <button className="chip-x" title="삭제" onClick={() => onDeleteCategory(c)}>×</button>
            </span>
          ))}
          {categories.length === 0 && <span className="muted">분류가 없습니다.</span>}
        </div>
      </section>

      {loading ? (
        <div className="muted">불러오는 중…</div>
      ) : (
        groups.map((g) => (
          <section className="panel" key={g.category ? g.category.id : 'uncat'}>
            <h3>{g.category ? g.category.name : '미분류'}</h3>
            {g.items.length === 0 ? (
              <div className="muted">메뉴가 없습니다.</div>
            ) : (
              <table className="grid-table menu-table">
                <thead>
                  <tr><th></th><th>이름</th><th>가격</th><th>판매</th><th></th></tr>
                </thead>
                <tbody>
                  {g.items.map((it) => (
                    <tr key={it.id} className={it.is_available ? '' : 'row-off'}>
                      <td className="mt-thumb">
                        {it.image_url ? <img src={it.image_url} alt="" loading="lazy" /> : <div className="thumb-ph" />}
                      </td>
                      <td>
                        <div className="mt-name">{it.name}</div>
                        {it.description && <div className="mt-desc">{it.description}</div>}
                      </td>
                      <td>{won(it.price)}</td>
                      <td>
                        <label className="switch">
                          <input type="checkbox" checked={!!it.is_available} onChange={() => onToggleAvailable(it)} />
                          <span>{it.is_available ? '판매중' : '중지'}</span>
                        </label>
                      </td>
                      <td className="ta-right">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(it)}>수정</button>
                        <button className="btn btn-danger btn-sm" onClick={() => onDelete(it)}>삭제</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ))
      )}

      {editing && (
        <ItemFormModal
          initial={editing === 'new' ? emptyItem : normalize(editing)}
          categories={categories}
          isNew={editing === 'new'}
          onCancel={() => setEditing(null)}
          onSave={onSaveItem}
        />
      )}
    </div>
  );
}

function normalize(item) {
  return {
    category_id: item.category_id ?? '',
    name: item.name ?? '',
    price: item.price ?? '',
    description: item.description ?? '',
    image_url: item.image_url ?? '',
    display_order: item.display_order ?? 0,
    is_available: !!item.is_available,
  };
}

function ItemFormModal({ initial, categories, isNew, onCancel, onSave }) {
  const [form, setForm] = useState(initial);
  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || form.price === '' || Number(form.price) < 0) return;
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{isNew ? '새 메뉴' : '메뉴 수정'}</h3>
        <label className="field">
          <span>이름 *</span>
          <input value={form.name} onChange={set('name')} maxLength={100} required autoFocus />
        </label>
        <div className="field-row">
          <label className="field">
            <span>가격(원) *</span>
            <input type="number" min="0" max="100000000" value={form.price} onChange={set('price')} required />
          </label>
          <label className="field">
            <span>분류</span>
            <select value={form.category_id} onChange={set('category_id')}>
              <option value="">미분류</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>표시 순서</span>
            <input type="number" value={form.display_order} onChange={set('display_order')} />
          </label>
        </div>
        <label className="field">
          <span>설명</span>
          <input value={form.description} onChange={set('description')} />
        </label>
        <label className="field">
          <span>이미지 URL</span>
          <input value={form.image_url} onChange={set('image_url')} placeholder="https://…" />
        </label>
        <label className="check-inline">
          <input type="checkbox" checked={form.is_available} onChange={set('is_available')} />
          판매중
        </label>
        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>취소</button>
          <button type="submit" className="btn btn-primary">저장</button>
        </div>
      </form>
    </div>
  );
}
