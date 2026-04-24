import { Router } from 'express';
import { exportVisitsCsv } from '../controllers/reportController.js';
import { auth, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();

router.use(auth, authorize('admin'));
router.get('/visits.csv', asyncHandler(exportVisitsCsv));

export default router;
