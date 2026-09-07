import { expect, test } from '@playwright/test';
const API = 'http://127.0.0.1:3101';
let tableNumber; let tableId; let adminToken;

// Drive the 3D cafe deterministically: log in, then use the dev-only
// window.__cafe hook to stand at the player's own table (mouse-look/pointer
// lock can't be driven reliably headless) and press E to open the ordering
// overlay, which reuses the same 2D pages/order logic.
async function enterCafe(page, tab = 'menu') {
  await expect(page.getByTestId('table-reset-button')).toBeVisible();
  await page.waitForFunction(() => Boolean(window.__cafe));
  await page.evaluate(() => window.__cafe.walkToMyTable());
  // Proximity detection flips `focused` on the next render frame; press E until
  // the ordering overlay opens (E works whenever focused — no pointer lock needed).
  await expect.poll(async () => {
    await page.keyboard.press('KeyE');
    return page.getByTestId('tab-menu').isVisible();
  }, { timeout: 5000 }).toBe(true);
  if (tab !== 'menu') await page.getByTestId(`tab-${tab}`).click();
}
async function addAndOpenCart(page) {
  await page.getByTestId('menu-add-1').click();
  await page.getByTestId('tab-cart').click();
}
async function submit(page) { await page.getByTestId('cart-checkout-button').click(); await page.getByTestId('order-confirm-submit-button').click(); }

test.beforeEach(async ({ page, request }) => {
  const login = await request.post(`${API}/api/auth/admin/login`, { data: { storeCode: 'demo-001', username: 'admin', password: 'admin1234' } });
  adminToken = (await login.json()).token;
  // Backend caps tableNumber at 20 chars — keep it short but unique per test.
  tableNumber = `p3-${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`;
  const table = await request.post(`${API}/api/stores/1/tables`, { headers: { Authorization: `Bearer ${adminToken}` }, data: { tableNumber, password: '0000' } });
  tableId = (await table.json()).id;
  // Deterministic image fallback; all business APIs below use the real backend.
  await page.route('https://images.unsplash.com/**', (route) => route.abort());
  await page.goto('/');
  await page.getByLabel('매장 코드').fill('demo-001');
  await page.getByLabel('테이블 번호', { exact: true }).fill(tableNumber);
  await page.getByLabel('테이블 비밀번호').fill('0000');
  await page.getByTestId('setup-submit-button').click();
  await expect(page.getByTestId('table-reset-button')).toBeVisible();
});

test('real API: restored cart, order, auto-return and closed-session history', async ({ page, request }) => {
  await enterCafe(page);
  await expect(page.getByTestId('menu-add-7')).toBeDisabled();
  await addAndOpenCart(page);
  await page.getByTestId('cart-increase-1').click();
  await page.reload();
  await enterCafe(page, 'cart');
  await expect(page.getByLabel('아메리카노 수량', { exact: true })).toHaveText('2');
  await submit(page);
  await expect(page.getByTestId('success-order-number')).toBeVisible();
  // auto-returns to the cafe within five seconds
  await expect(page.getByTestId('success-order-number')).toBeHidden({ timeout: 7000 });
  await enterCafe(page, 'orders');
  await expect(page.getByText('대기중', { exact: true })).toBeVisible();
  await request.post(`${API}/api/stores/1/tables/${tableId}/close`, { headers: { Authorization: `Bearer ${adminToken}` } });
  await page.getByTestId('orders-refresh-button').click();
  await expect(page.getByText('아직 주문한 메뉴가 없어요')).toBeVisible();
});

test('rejected order keeps the cart', async ({ page }) => {
  await page.route(`${API}/api/stores/1/orders`, (route) => route.fulfill({ status: 400, json: { error: { message: 'Menu unavailable' } } }));
  await enterCafe(page);
  await addAndOpenCart(page);
  await submit(page);
  await expect(page.getByRole('alert')).toContainText('요청');
  await page.getByTestId('dialog-close-button').click();
  await page.reload();
  await enterCafe(page, 'cart');
  await expect(page.getByLabel('아메리카노 수량', { exact: true })).toHaveText('1');
});

test('response loss does not create a second order after reload', async ({ page }) => {
  let posts = 0;
  await page.route(`${API}/api/stores/1/orders`, async (route) => { posts += 1; await route.fetch(); await route.abort(); });
  await enterCafe(page);
  await addAndOpenCart(page);
  await submit(page);
  await expect(page.getByText('주문이 접수되었을 수 있어요. 다시 주문하기 전에 주문 내역을 확인해 주세요.')).toBeVisible();
  await page.reload();
  await enterCafe(page, 'cart');
  await expect(page.getByTestId('cart-checkout-button')).toBeDisabled();
  await page.getByTestId('tab-orders').click();
  await expect(page.getByText('대기중', { exact: true })).toBeVisible();
  expect(posts).toBe(1);
});

test('invalid cached token is renewed for read requests', async ({ page }) => {
  await page.evaluate(() => { const key = 'table-order:customer:setup:v1'; const value = JSON.parse(localStorage.getItem(key)); value.token = 'expired-cached-token'; localStorage.setItem(key, JSON.stringify(value)); });
  await page.reload();
  await enterCafe(page, 'orders');
  await expect(page.getByText('아직 주문한 메뉴가 없어요')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('table-order:customer:setup:v1')).token)).not.toBe('expired-cached-token');
});

test('keyboard-accessible menu detail dialog inside the overlay', async ({ page }) => {
  await enterCafe(page);
  await page.getByTestId('menu-detail-1').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('dialog[open]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  // Escape closed only the dialog — the ordering overlay stays open.
  await expect(page.getByTestId('menu-detail-1')).toBeFocused();
  await expect(page.getByTestId('tab-menu')).toBeVisible();
  const add = await page.getByTestId('menu-add-1').boundingBox();
  expect(add.width).toBeGreaterThanOrEqual(44);
  expect(add.height).toBeGreaterThanOrEqual(44);
  await page.screenshot({ path: 'test-results/customer-cafe-overlay.png', fullPage: true });
});
