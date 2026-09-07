import { Router } from 'express';
import * as controller from './auth.controller.js';
import { validateBody } from '../middleware/validate.js';
import { adminLoginSchema, tableLoginSchema } from './auth.schema.js';

// Mounted at /api/auth
const router = Router();

router.post('/admin/login', validateBody(adminLoginSchema), controller.adminLogin);
router.post('/table/login', validateBody(tableLoginSchema), controller.tableLogin);

export default router;
