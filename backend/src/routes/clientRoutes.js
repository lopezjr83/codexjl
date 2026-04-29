import { Router } from 'express';
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient
} from '../controllers/clientController.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../utils/validators.js';

const router = Router();

router.use(auth);
router.route('/').get(asyncHandler(getClients)).post(validate(clientSchema), asyncHandler(createClient));
router.route('/:id').get(asyncHandler(getClientById)).put(validate(clientSchema), asyncHandler(updateClient)).delete(asyncHandler(deleteClient));

export default router;
