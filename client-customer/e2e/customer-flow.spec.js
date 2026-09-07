import { expect, test } from '@playwright/test';
const API = 'http://127.0.0.1:3101';
let tableNumber; let tableId; let adminToken;
test.beforeEach(async ({ page, request }, testInfo) => {
  const login = await request.post(`${API}/api/auth/admin/login`, { data: { storeCode: 'demo-001', username: 'admin', password: 'admin1234' } });
  adminToken = (await login.json()).token;
  tableNumber = `p3-${testInfo.testId}-${Date.now()}`;
  const table = await request.post(`${API}/api/stores/1/tables`, { headers: { Authorization: `Bearer ${adminToken}` }, data: { tableNumber, password: '0000' } });
  tableId = (await table.json()).id;
  // Deterministic image fallback; all business APIs below use the real backend.
  await page.route('https://images.unsplash.com/**', (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('매장 코드').fill('demo-001');
  await page.getByLabel('테이블 번호', { exact: true }).fill(tableNumber);
  await page.getByLabel('테이블 비밀번호').fill('0000');
  await page.getByTestId('setup-submit-button').click();
  await expect(page.getByTestId('menu-add-1')).toBeVisible();
});
async function cart(page) { await page.getByTestId('menu-add-1').click(); await page.getByTestId('nav-cart-link').click(); }
async function submit(page) { await page.getByTestId('cart-checkout-button').click(); await page.getByTestId('order-confirm-submit-button').click(); }
test('real API: restored cart, order, five-second redirect and closed-session history', async ({ page, request }) => {
  await expect(page.getByTestId('menu-add-7')).toBeDisabled();
  await cart(page); await page.getByTestId('cart-increase-1').click(); await page.reload();
  await expect(page.getByLabel('아메리카노 수량', { exact: true })).toHaveText('2');
  await submit(page); await expect(page.getByTestId('success-order-number')).toBeVisible();
  await expect(page).toHaveURL(/order-success/);
  await expect(page).toHaveURL('http://127.0.0.1:5174/', { timeout: 7000 });
  await page.getByTestId('nav-orders-link').click();
  await expect(page.getByText('대기중', { exact: true })).toBeVisible();
  await request.post(`${API}/api/stores/1/tables/${tableId}/close`, { headers: { Authorization: `Bearer ${adminToken}` } });
  await page.getByTestId('orders-refresh-button').click();
  await expect(page.getByText('아직 주문한 메뉴가 없어요')).toBeVisible();
});
test('rejected order keeps the cart', async ({ page }) => {
  await page.route(`${API}/api/stores/1/orders`, (route) => route.fulfill({ status: 400, json: { error: { message: 'Menu unavailable' } } }));
  await cart(page); await submit(page);
  await expect(page.getByRole('alert')).toContainText('요청');
  await page.getByTestId('dialog-close-button').click(); await page.reload();
  await expect(page.getByLabel('아메리카노 수량', { exact: true })).toHaveText('1');
});
test('response loss does not create a second order after reload', async ({ page }) => {
  let posts = 0;
  await page.route(`${API}/api/stores/1/orders`, async (route) => { posts += 1; await route.fetch(); await route.abort(); });
  await cart(page); await submit(page);
  await expect(page.getByText('주문이 접수되었을 수 있어요. 다시 주문하기 전에 주문 내역을 확인해 주세요.')).toBeVisible();
  await page.reload(); await expect(page.getByTestId('cart-checkout-button')).toBeDisabled();
  await page.getByTestId('nav-orders-link').click(); await expect(page.getByText('대기중', { exact: true })).toBeVisible();
  expect(posts).toBe(1);
});
test('invalid cached token is renewed for read requests', async ({ page }) => {
  await page.evaluate(() => { const key = 'table-order:customer:setup:v1'; const value = JSON.parse(localStorage.getItem(key)); value.token = 'expired-cached-token'; localStorage.setItem(key, JSON.stringify(value)); });
  await page.goto('/orders'); await expect(page.getByText('아직 주문한 메뉴가 없어요')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('table-order:customer:setup:v1')).token)).not.toBe('expired-cached-token');
});
test('small viewport and keyboard-accessible menu dialog', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('menu-detail-1').focus(); await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0); await expect(page.getByTestId('menu-detail-1')).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const add = await page.getByTestId('menu-add-1').boundingBox(); expect(add.width).toBeGreaterThanOrEqual(44); expect(add.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'test-results/customer-mobile.png', fullPage: true });
});
