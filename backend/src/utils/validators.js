import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('admin', 'staff').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
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
  visitorName: Joi.string().required(),
  visitorDocument: Joi.string().required(),
  purpose: Joi.string().required(),
  scheduledAt: Joi.date().required(),
  status: Joi.string().valid('scheduled', 'checked_in', 'completed', 'cancelled').optional(),
  checkedInAt: Joi.date().optional(),
  checkedOutAt: Joi.date().optional()
});
