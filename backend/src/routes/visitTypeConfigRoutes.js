import { Router } from 'express';
import { auth, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getVisitTypeConfig, updateVisitTypeConfig } from '../controllers/visitTypeConfigController.js';

const router = Router();

router.get('/', auth, asyncHandler(getVisitTypeConfig));
router.put('/', auth, authorize('admin'), asyncHandler(updateVisitTypeConfig));

export default router;
