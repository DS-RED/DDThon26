/**
 * Placeholder admin-auth guard.
 *
 * CONTRACT NOTE (P2 draft → P1 owns real implementation):
 * Admin-only endpoints (menu/category/store mutations) must be protected by
 * JWT-based auth. Until P1 delivers the real middleware, this stub allows
 * requests through so the P2 slice is independently runnable/testable.
 *
 * TODO(P1): verify Authorization: Bearer <jwt>, attach req.admin = { id, storeId }.
 */
export function requireAdmin(req, _res, next) {
  // Stub: no-op. Real implementation will 401 on missing/invalid token.
  req.admin = req.admin || { stub: true };
  next();
}
