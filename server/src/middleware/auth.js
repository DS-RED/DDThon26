import { verifyToken } from '../auth/auth.tokens.js';
import { HttpError } from '../utils/http-error.js';

/**
 * Auth guards (P1 — replaces the earlier P2 placeholder).
 * Tokens are JWTs issued by the auth module. Bearer scheme.
 */

function extractToken(req) {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}

function decode(req) {
  const token = extractToken(req);
  if (!token) throw new HttpError(401, 'Authentication required');
  try {
    return verifyToken(token);
  } catch (err) {
    if (err && err.name === 'TokenExpiredError') throw new HttpError(401, 'Token expired');
    throw new HttpError(401, 'Invalid token');
  }
}

/** Requires a valid admin JWT. Attaches req.admin = { id, storeId, username }. */
export function requireAdmin(req, _res, next) {
  try {
    const payload = decode(req);
    if (payload.role !== 'admin') throw new HttpError(403, 'Admin access required');
    req.admin = { id: Number(payload.sub), storeId: payload.storeId, username: payload.username };
    next();
  } catch (err) {
    next(err);
  }
}

/** Requires a valid table JWT. Attaches req.table = { id, storeId, tableNumber }. */
export function requireTable(req, _res, next) {
  try {
    const payload = decode(req);
    if (payload.role !== 'table') throw new HttpError(403, 'Table access required');
    req.table = { id: Number(payload.sub), storeId: payload.storeId, tableNumber: payload.tableNumber };
    next();
  } catch (err) {
    next(err);
  }
}
