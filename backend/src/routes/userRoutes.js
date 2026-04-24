import { Router } from 'express';
import { createUser, getUsers, resetUserPassword, updateUser } from '../controllers/userController.js';
import { auth, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { userAdminCreateSchema, userAdminUpdateSchema, userResetPasswordSchema } from '../utils/validators.js';

const router = Router();

router.use(auth, authorize('admin'));

router.route('/').get(asyncHandler(getUsers)).post(validate(userAdminCreateSchema), asyncHandler(createUser));
router.route('/:id').put(validate(userAdminUpdateSchema), asyncHandler(updateUser));
router.route('/:id/reset-password').put(validate(userResetPasswordSchema), asyncHandler(resetUserPassword));

export default router;
