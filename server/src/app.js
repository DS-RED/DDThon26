import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import storeRoutes from './store/store.routes.js';
import menuRoutes from './menu/menu.routes.js';
import authRoutes from './auth/auth.routes.js';
import ordersRoutes from './orders/orders.routes.js';
import tablesRoutes from './tables/tables.routes.js';

/**
 * Builds the Express app. No side effects (no DB open, no listen) so tests can
 * construct it against an in-memory DB.
 */
export function createApp() {
  const app = express();

  // CORS: P3/P4 SPAs call the API from separate dev-server origins.
  // '*' (default, local dev) reflects any origin; otherwise restrict to the list.
  const allowAny = config.corsOrigins.includes('*');
  app.use(
    cors({
      origin: allowAny ? true : config.corsOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Auth (P1): admin + table login.
  app.use('/api/auth', authRoutes);

  // Store-scoped routers (nested under a store). No path collisions between them:
  //   menu:   /menu, /categories        (P2)
  //   orders: /orders, /history         (P1)
  //   tables: /tables, /events(SSE)     (P1)
  app.use('/api/stores/:storeId', menuRoutes);
  app.use('/api/stores/:storeId', ordersRoutes);
  app.use('/api/stores/:storeId', tablesRoutes);
  // Store routes (list + single). Mounted last so it doesn't shadow the nested paths.
  app.use('/api/stores', storeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
