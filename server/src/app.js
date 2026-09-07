import express from 'express';
import { requestLogger } from './middleware/logger.js';
import { notFoundHandler, errorHandler } from './middleware/error-handler.js';
import storeRoutes from './store/store.routes.js';
import menuRoutes from './menu/menu.routes.js';

/**
 * Builds the Express app. No side effects (no DB open, no listen) so tests can
 * construct it against an in-memory DB.
 */
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLogger);

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  // Menu/category routes are nested under a store.
  app.use('/api/stores/:storeId', menuRoutes);
  // Store routes (list + single). Mounted after so it doesn't shadow the nested paths.
  app.use('/api/stores', storeRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
