import { Router } from 'express';
import {
  checkInVisit,
  checkOutVisit,
  createVisit,
  deleteVisit,
  getVisitById,
  getVisits,
  updateVisit
} from '../controllers/visitController.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { visitSchema } from '../utils/validators.js';

const router = Router();

router.use(auth);
router.route('/').get(asyncHandler(getVisits)).post(validate(visitSchema), asyncHandler(createVisit));
router.route('/:id/check-in').put(asyncHandler(checkInVisit));
router.route('/:id/check-out').put(asyncHandler(checkOutVisit));
router.route('/:id').get(asyncHandler(getVisitById)).put(validate(visitSchema), asyncHandler(updateVisit)).delete(asyncHandler(deleteVisit));

export default router;
