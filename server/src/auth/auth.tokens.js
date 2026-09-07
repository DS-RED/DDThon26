import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';

/**
 * JWT helpers (P1). Two token audiences:
 *  - admin: { sub: adminId, storeId, username, role: 'admin' }
 *  - table: { sub: tableId, storeId, tableNumber, role: 'table' }
 */

export function signAdminToken(admin) {
  return jwt.sign(
    { storeId: admin.store_id, username: admin.username, role: 'admin' },
    config.jwtSecret,
    { subject: String(admin.id), expiresIn: config.jwtExpiresIn },
  );
}

export function signTableToken(table) {
  return jwt.sign(
    { storeId: table.store_id, tableNumber: table.table_number, role: 'table' },
    config.jwtSecret,
    { subject: String(table.id), expiresIn: config.jwtExpiresIn },
  );
}

/** Verifies and decodes a token. Throws jwt errors on invalid/expired tokens. */
export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}
