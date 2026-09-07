import { Router } from 'express';
import * as controller from './store.controller.js';

const router = Router();

// GET /api/stores            -> list all stores
// GET /api/stores/:storeId   -> single store
router.get('/', controller.listStores);
router.get('/:storeId', controller.getStore);

export default router;
