import { Router } from 'express';
import { getAuditLogs } from '../controllers/auditController.js';
import { auth, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(auth, authorize('admin'));
router.get('/', asyncHandler(getAuditLogs));

export default router;
