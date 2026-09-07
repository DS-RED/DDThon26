import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import App from '../src/App.jsx';
import { SETUP_KEY, cartKey, writeStorage, readCart } from '../src/storage/customer-storage.js';

// The 3D cafe needs a real WebGL context, which jsdom lacks. Replace the WebGL
// canvas with a stub that reports the player standing (pointer-locked) at their
// own table — so the E-key ordering overlay (which reuses the 2D pages) opens
// exactly as it does in the browser, and the order logic stays under test.
vi.mock('../src/three/CafeCanvas.jsx', async () => {
  const { useEffect } = await import('react');
  return {
    default: ({ myNumber, onFocusChange, onLockChange }) => {
      useEffect(() => { onLockChange(true); onFocusChange(myNumber); }, [myNumber, onFocusChange, onLockChange]);
      return null;
    },
  };
});

const table = { id: 1, storeId: 1, tableNumber: '1' };
const session = { token: 'old-token', table, credentials: { storeCode: 'demo-001', tableNumber: '1', password: '0000' } };
const menu = [{ category: { id: 1, name: '커피' }, items: [{ id: 1, name: '커피', price: 4000, is_available: true }, { id: 2, name: '품절 메뉴', price: 3000, is_available: false }] }];
const row = { menu_item_id: 1, name: '커피', unit_price: 4000, quantity: 2 };
const json = (body, status = 200) => Promise.resolve({ ok: status < 400, status, json: async () => body });
let orders;
beforeEach(() => { orders = []; vi.stubGlobal('fetch', vi.fn((url) => {
  if (url.endsWith('/login')) return json({ token: 'new-token', table });
  if (url.endsWith('/menu')) return json(menu);
  if (url.endsWith('/mine')) return json(orders);
  if (url.endsWith('/orders')) return json({ id: 9, session_id: 3, total_amount: 8000 }, 201);
  return json({ name: '테스트 카페' });
})); });

// Walk to the table (E) and switch to the requested ordering tab.
function openOverlay(tab = 'menu') {
  fireEvent.keyDown(window, { code: 'KeyE' });
  if (tab !== 'menu') fireEvent.click(screen.getByTestId(`tab-${tab}`));
}
function open(tab = 'menu', withSession = true, withCart = false) {
  if (withSession) writeStorage(SETUP_KEY, session);
  if (withCart) writeStorage(cartKey(1, 1), { version: 1, items: [row], uncertain: false });
  const utils = render(<MemoryRouter><App /></MemoryRouter>);
  if (withSession) openOverlay(tab);
  return utils;
}

it('connects a tablet and opens the menu', async () => { render(<MemoryRouter><App /></MemoryRouter>); const user = userEvent.setup(); await user.type(screen.getByLabelText('매장 코드'), 'demo-001'); await user.type(screen.getByLabelText('테이블 번호'), '1'); await user.type(screen.getByLabelText('테이블 비밀번호'), '0000'); await user.click(screen.getByTestId('setup-submit-button')); await screen.findByTestId('table-reset-button'); openOverlay(); expect(await screen.findByTestId('menu-add-1')).toBeEnabled(); });
it('shows a failed login without losing entered fields', async () => { fetch.mockImplementation(() => json({}, 401)); render(<MemoryRouter><App /></MemoryRouter>); fireEvent.change(screen.getByLabelText('매장 코드'), { target: { value: 'demo' } }); fireEvent.change(screen.getByLabelText('테이블 번호'), { target: { value: '1' } }); fireEvent.submit(screen.getByTestId('setup-form')); expect(await screen.findByRole('alert')).toHaveTextContent('로그인'); expect(screen.getByLabelText('매장 코드')).toHaveValue('demo'); });
it('disables sold-out menu cards and saves available selections', async () => { open(); expect(await screen.findByTestId('menu-add-2')).toBeDisabled(); fireEvent.click(screen.getByTestId('menu-add-1')); expect(readCart(cartKey(1, 1)).items[0].quantity).toBe(1); });
it('renders an empty menu', async () => { fetch.mockImplementation((url) => json(url.endsWith('/menu') ? [] : { name: '카페' })); open(); expect(await screen.findByText('아직 준비된 메뉴가 없어요.')).toBeVisible(); });
it('restores and edits the saved cart', async () => { open('cart', true, true); expect(screen.getByLabelText('커피 수량')).toHaveTextContent('2'); fireEvent.click(screen.getByTestId('cart-increase-1')); expect(readCart(cartKey(1, 1)).items[0].quantity).toBe(3); fireEvent.click(screen.getByTestId('cart-remove-1')); expect(screen.getByText('장바구니가 비어 있어요')).toBeVisible(); });
it('posts only menu ids and quantities and clears on success', async () => { open('cart', true, true); fireEvent.click(screen.getByTestId('cart-checkout-button')); fireEvent.click(screen.getByTestId('order-confirm-submit-button')); expect(await screen.findByTestId('success-order-number')).toHaveTextContent('#9'); expect(readCart(cartKey(1, 1)).items).toHaveLength(0); const call = fetch.mock.calls.find(([url]) => url.endsWith('/orders')); expect(JSON.parse(call[1].body)).toEqual({ items: [{ menu_item_id: 1, quantity: 2 }] }); });
it('keeps the cart when an order is rejected', async () => { const original = fetch.getMockImplementation(); fetch.mockImplementation((url, options) => url.endsWith('/orders') ? json({}, 400) : original(url, options)); open('cart', true, true); fireEvent.click(screen.getByTestId('cart-checkout-button')); fireEvent.click(screen.getByTestId('order-confirm-submit-button')); expect(await screen.findByRole('alert')).toHaveTextContent('요청'); expect(readCart(cartKey(1, 1)).items).toHaveLength(1); expect(readCart(cartKey(1, 1)).uncertain).toBe(false); });
it('requires confirmation after price changes without sending an order', async () => { const original = fetch.getMockImplementation(); fetch.mockImplementation((url, options) => url.endsWith('/menu') ? json([{ category: null, items: [{ ...menu[0].items[0], price: 5000 }] }]) : original(url, options)); open('cart', true, true); fireEvent.click(screen.getByTestId('cart-checkout-button')); fireEvent.click(screen.getByTestId('order-confirm-submit-button')); expect(await screen.findByRole('alert')).toHaveTextContent('가격이 변경'); expect(readCart(cartKey(1, 1)).items[0].unit_price).toBe(5000); expect(fetch.mock.calls.filter(([url]) => url.endsWith('/orders'))).toHaveLength(0); });
it('persists uncertainty on response loss and blocks another submission', async () => { const original = fetch.getMockImplementation(); fetch.mockImplementation((url, options) => url.endsWith('/orders') ? Promise.reject(new TypeError('network')) : original(url, options)); open('cart', true, true); fireEvent.click(screen.getByTestId('cart-checkout-button')); fireEvent.click(screen.getByTestId('order-confirm-submit-button')); await waitFor(() => expect(readCart(cartKey(1, 1)).uncertain).toBe(true)); await screen.findByText('주문이 접수되었을 수 있어요. 다시 주문하기 전에 주문 내역을 확인해 주세요.'); expect(screen.getByTestId('order-confirm-submit-button')).toBeDisabled(); expect(fetch.mock.calls.filter(([url]) => url.endsWith('/orders'))).toHaveLength(1); });
it('refreshes authentication once for GET', async () => { const original = fetch.getMockImplementation(); fetch.mockImplementation((url, options) => url.endsWith('/mine') && options.headers.Authorization === 'Bearer old-token' ? json({}, 401) : original(url, options)); open('orders'); await screen.findByText('아직 주문한 메뉴가 없어요'); expect(fetch.mock.calls.filter(([url]) => url.endsWith('/login'))).toHaveLength(1); });
it('does not automatically repeat POST after an expired token', async () => { const original = fetch.getMockImplementation(); fetch.mockImplementation((url, options) => url.endsWith('/orders') ? json({}, 401) : original(url, options)); open('cart', true, true); fireEvent.click(screen.getByTestId('cart-checkout-button')); fireEvent.click(screen.getByTestId('order-confirm-submit-button')); expect(await screen.findByRole('alert')).toHaveTextContent('로그인을 갱신'); expect(fetch.mock.calls.filter(([url]) => url.endsWith('/orders'))).toHaveLength(1); expect(readCart(cartKey(1, 1)).uncertain).toBe(false); });
it('paginates ten current orders at a time', async () => { orders = Array.from({ length: 11 }, (_, i) => ({ id: i + 1, created_at: '2026-09-07 05:00:00', status: 'pending', total_amount: 4000, items: [{ menu_name: '커피', unit_price: 4000, quantity: 1 }] })); open('orders'); await screen.findByRole('heading', { name: '주문 #11' }); expect(screen.queryByRole('heading', { name: '주문 #1' })).not.toBeInTheDocument(); fireEvent.click(screen.getByTestId('orders-next-button')); expect(screen.getByRole('heading', { name: '주문 #1' })).toBeVisible(); });
it('does not infer a session closure from an empty order array', async () => { open('orders', true, true); await screen.findByText('아직 주문한 메뉴가 없어요'); expect(readCart(cartKey(1, 1)).items).toHaveLength(1); });
