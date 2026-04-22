import { Router } from 'express';
import {
  createVisit,
  deleteVisit,
  getVisitById,
  getVisits,
  updateVisit
} from '../controllers/visitController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { visitSchema } from '../utils/validators.js';

const router = Router();

router.use(auth);
router.route('/').get(getVisits).post(validate(visitSchema), createVisit);
router.route('/:id').get(getVisitById).put(validate(visitSchema), updateVisit).delete(deleteVisit);

export default router;
