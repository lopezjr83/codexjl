import { Router } from 'express';
import {
  createClient,
  deleteClient,
  getClientById,
  getClients,
  updateClient
} from '../controllers/clientController.js';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../utils/validators.js';

const router = Router();

router.use(auth);
router.route('/').get(getClients).post(validate(clientSchema), createClient);
router.route('/:id').get(getClientById).put(validate(clientSchema), updateClient).delete(deleteClient);

export default router;
