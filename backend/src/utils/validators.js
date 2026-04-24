import Joi from 'joi';

const permissionsSchema = Joi.object({
  dashboard: Joi.boolean().optional(),
  operations: Joi.boolean().optional(),
  profile: Joi.boolean().optional(),
  reports: Joi.boolean().optional(),
  usersAdmin: Joi.boolean().optional()
}).optional();

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('', null),
  role: Joi.string().valid('admin', 'staff').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().allow('', null).optional()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required()
});

export const userAdminCreateSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().allow('', null),
  role: Joi.string().valid('admin', 'staff').optional(),
  permissions: permissionsSchema,
  isActive: Joi.boolean().optional()
});

export const userAdminUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().allow('', null).optional(),
  role: Joi.string().valid('admin', 'staff').optional(),
  permissions: permissionsSchema,
  isActive: Joi.boolean().optional()
});

export const userResetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(8).required()
});

export const clientSchema = Joi.object({
  companyName: Joi.string().required(),
  contactName: Joi.string().required(),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().allow('', null),
  notes: Joi.string().allow('', null)
});

export const visitSchema = Joi.object({
  client: Joi.string().required(),
  category: Joi.string().valid('client', 'provider', 'visitor').optional(),
  visitorName: Joi.string().required(),
  visitorDocument: Joi.string().required(),
  purpose: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  status: Joi.string().valid('scheduled', 'checked_in', 'completed', 'cancelled').optional(),
  checkedInAt: Joi.date().optional(),
  checkedOutAt: Joi.date().optional()
});
