import { User } from '../models/User.js';

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
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

  const user = await User.create(req.body);
  res.status(201).json(sanitizeUser(user));
};

export const updateUser = async (req, res) => {
  const update = { ...req.body };
  delete update.password;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  res.json(sanitizeUser(user));
};

export const resetUserPassword = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Contraseña restablecida' });
};
