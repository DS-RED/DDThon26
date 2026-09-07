import { Router } from 'express';
import * as controller from './orders.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAdmin, requireTable } from '../middleware/auth.js';
import { createOrderSchema, updateStatusSchema } from './orders.schema.js';

// Mounted at /api/stores/:storeId
const router = Router({ mergeParams: true });

// Customer (table token)
router.post('/orders', requireTable, validateBody(createOrderSchema), controller.createOrder);
router.get('/orders/mine', requireTable, controller.listMine);

// Admin
router.get('/orders', requireAdmin, controller.listCurrent);
router.get('/orders/:orderId', requireAdmin, controller.getOrder);
router.patch('/orders/:orderId/status', requireAdmin, validateBody(updateStatusSchema), controller.updateStatus);
router.delete('/orders/:orderId', requireAdmin, controller.deleteOrder);

// Past order history (admin)
router.get('/history', requireAdmin, controller.listHistory);

export default router;
