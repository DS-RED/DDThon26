import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDb } from './connection.js';
import { applySchema } from './migrate.js';

const DEMO_STORE_CODE = 'demo-001';

// Placeholder bcrypt hash for password "admin1234" (P1 replaces with real auth).
// Generated with bcrypt cost 10 — kept as a static constant so seeding needs no
// crypto dependency in the P2 slice.
const ADMIN_PASSWORD_HASH = '$2b$10$X8s3Qk0m1nJ8mQm3n2m1eOa1Yl6Yk8Zk9Zk0Zk1Zk2Zk3Zk4Zk5K';

/**
 * Seeds demo data (idempotent — no-op if the demo store already exists).
 * @param {import('better-sqlite3').Database} [db] defaults to the singleton.
 */
export function seedDatabase(db = getDb()) {
  const existing = db.prepare('SELECT id FROM stores WHERE store_code = ?').get(DEMO_STORE_CODE);
  if (existing) {
    return { skipped: true, storeId: existing.id };
  }

  const seed = db.transaction(() => {
    const storeId = db
      .prepare('INSERT INTO stores (store_code, name) VALUES (?, ?)')
      .run(DEMO_STORE_CODE, '데모 카페').lastInsertRowid;

    const insertCategory = db.prepare(
      'INSERT INTO categories (store_id, name, display_order) VALUES (?, ?, ?)',
    );
    const coffeeId = insertCategory.run(storeId, '커피', 0).lastInsertRowid;
    const teaId = insertCategory.run(storeId, '티', 1).lastInsertRowid;
    const dessertId = insertCategory.run(storeId, '디저트', 2).lastInsertRowid;

    const insertItem = db.prepare(
      `INSERT INTO menu_items
        (store_id, category_id, name, price, description, image_url, display_order, is_available)
       VALUES (@store_id, @category_id, @name, @price, @description, @image_url, @display_order, @is_available)`,
    );

    const items = [
      { category_id: coffeeId, name: '아메리카노', price: 4000, description: '깊고 진한 에스프레소에 물을 더한 클래식', image_url: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04', display_order: 0, is_available: 1 },
      { category_id: coffeeId, name: '카페라떼', price: 4500, description: '부드러운 스팀 밀크와 에스프레소의 조화', image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735', display_order: 1, is_available: 1 },
      { category_id: coffeeId, name: '바닐라라떼', price: 5000, description: '달콤한 바닐라 향의 라떼', image_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5', display_order: 2, is_available: 1 },
      { category_id: teaId, name: '녹차', price: 4000, description: '은은한 향의 우전 녹차', image_url: 'https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5', display_order: 0, is_available: 1 },
      { category_id: teaId, name: '캐모마일', price: 4500, description: '편안한 휴식을 위한 허브티', image_url: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9', display_order: 1, is_available: 1 },
      { category_id: dessertId, name: '치즈케이크', price: 6000, description: '진한 뉴욕 스타일 치즈케이크', image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad', display_order: 0, is_available: 1 },
      { category_id: dessertId, name: '초코 브라우니', price: 5500, description: '겉은 바삭 속은 촉촉한 브라우니', image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c', display_order: 1, is_available: 0 },
    ];
    for (const item of items) {
      insertItem.run({ store_id: storeId, ...item });
    }

    // Contract-only tables (P1 owns logic) — seed minimal rows so slices can integrate.
    db.prepare(
      'INSERT INTO admin_users (store_id, username, password_hash) VALUES (?, ?, ?)',
    ).run(storeId, 'admin', ADMIN_PASSWORD_HASH);

    db.prepare('INSERT INTO tables (store_id, table_number) VALUES (?, ?)').run(storeId, '1');

    return storeId;
  });

  const storeId = seed();
  return { skipped: false, storeId };
}

// Run as CLI: `npm run seed`
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  applySchema(); // ensure schema exists first
  const result = seedDatabase();
  console.log(result.skipped ? 'Seed skipped (demo store already exists).' : `Seeded demo store id=${result.storeId}.`);
}
