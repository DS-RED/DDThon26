import { Router } from 'express';
import * as controller from './menu.controller.js';
import { validateBody } from '../middleware/validate.js';
import { requireAdmin } from '../middleware/auth.js';
import {
  menuItemCreateSchema,
  menuItemUpdateSchema,
  reorderSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
} from './menu.schema.js';

// mergeParams so :storeId from the parent mount is available here.
const router = Router({ mergeParams: true });

// ----- Categories -----
router.get('/categories', controller.listCategories);
router.post('/categories', requireAdmin, validateBody(categoryCreateSchema), controller.createCategory);

// NOTE: /categories/reorder MUST be registered before /categories/:categoryId so
// "reorder" is not captured as a categoryId (same gotcha as /menu/reorder).
router.patch('/categories/reorder', requireAdmin, validateBody(reorderSchema), controller.reorderCategories);

router.put('/categories/:categoryId', requireAdmin, validateBody(categoryUpdateSchema), controller.updateCategory);
router.delete('/categories/:categoryId', requireAdmin, controller.deleteCategory);

// ----- Menu items -----
router.get('/menu', controller.listMenu);
router.post('/menu', requireAdmin, validateBody(menuItemCreateSchema), controller.createMenuItem);

// NOTE: /menu/reorder MUST be registered before /menu/:itemId so "reorder"
// is not captured as an itemId.
router.patch('/menu/reorder', requireAdmin, validateBody(reorderSchema), controller.reorderMenu);

router.get('/menu/:itemId', controller.getMenuItem);
router.put('/menu/:itemId', requireAdmin, validateBody(menuItemUpdateSchema), controller.updateMenuItem);
router.delete('/menu/:itemId', requireAdmin, controller.deleteMenuItem);

export default router;
