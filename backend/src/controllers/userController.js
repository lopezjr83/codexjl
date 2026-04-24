import { User, getDefaultPermissions } from '../models/User.js';
import { logAudit } from '../utils/audit.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  permissions: getDefaultPermissions(user.role, user.permissions || {}),
  isActive: user.isActive,
  createdAt: user.createdAt
});

export const getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.json(users.map(sanitizeUser));
};

export const createUser = async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) return res.status(409).json({ message: 'El correo ya existe' });

  const payload = {
    ...req.body,
    role: 'staff',
    permissions: getDefaultPermissions('staff', req.body.permissions || {})
  };

  const user = await User.create(payload);
  await logAudit({ req, action: 'user.create', entityType: 'user', entityId: user._id, metadata: { role: user.role } });
  res.status(201).json(sanitizeUser(user));
};

export const updateUser = async (req, res) => {
  const update = { ...req.body };
  delete update.password;
  if (update.role) {
    update.permissions = getDefaultPermissions(update.role, update.permissions || {});
  } else if (update.permissions) {
    const current = await User.findById(req.params.id);
    if (!current) return res.status(404).json({ message: 'Usuario no encontrado' });
    update.permissions = getDefaultPermissions(current.role, update.permissions);
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  await logAudit({ req, action: 'user.update', entityType: 'user', entityId: user._id });
  res.json(sanitizeUser(user));
};

export const resetUserPassword = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  user.password = req.body.newPassword;
  await user.save();
  await logAudit({ req, action: 'user.reset_password', entityType: 'user', entityId: user._id });
  res.json({ message: 'Contraseña restablecida' });
};
