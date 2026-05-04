import { Router } from 'express';
import { changePassword, login, me, register, updateProfile } from '../controllers/authController.js';
import { auth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { changePasswordSchema, loginSchema, profileUpdateSchema, registerSchema } from '../utils/validators.js';

const router = Router();

router.post('/register', validate(registerSchema), asyncHandler(register));
router.post('/login', validate(loginSchema), asyncHandler(login));
router.get('/me', auth, asyncHandler(me));
router.put('/me', auth, validate(profileUpdateSchema), asyncHandler(updateProfile));
router.put('/me/password', auth, validate(changePasswordSchema), asyncHandler(changePassword));

export default router;
