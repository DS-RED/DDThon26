import { Router } from 'express';
import * as controller from './tables.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import { createTableSchema } from './tables.schema.js';
import { eventsHandler } from '../sse/sse.js';

// Mounted at /api/stores/:storeId
const router = Router({ mergeParams: true });

// Admin table management
router.get('/tables', requireAdmin, controller.listTables);
router.post('/tables', requireAdmin, validateBody(createTableSchema), controller.createTable);
router.post('/tables/:tableId/close', requireAdmin, controller.closeSession);

// SSE stream. Auth (Authorization: Bearer, admin + store scope) is handled inside
// the handler so it can emit an SSE-style stream/error response rather than JSON.
router.get('/events', eventsHandler);

export default router;
