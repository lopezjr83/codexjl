import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const signToken = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive
});

export const register = async (req, res) => {
  const exists = await User.findOne({ email: req.body.email });
  if (exists) return res.status(409).json({ message: 'El correo ya existe' });

  const user = await User.create(req.body);
  const token = signToken(user);

  res.status(201).json({ token, user: sanitizeUser(user) });
};

export const login = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user || !user.isActive || !(await user.comparePassword(req.body.password))) {
    return res.status(401).json({ message: 'Credenciales inválidas' });
  }

  const token = signToken(user);
  res.json({ token, user: sanitizeUser(user) });
};

export const me = async (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

export const updateProfile = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, req.body, { new: true, runValidators: true }).select('-password');
  res.json({ user: sanitizeUser(user) });
};

export const changePassword = async (req, res) => {
  const user = await User.findById(req.user._id);
  const isValid = await user.comparePassword(req.body.currentPassword);
  if (!isValid) return res.status(400).json({ message: 'Contraseña actual incorrecta' });

  user.password = req.body.newPassword;
  await user.save();
  res.json({ message: 'Contraseña actualizada correctamente' });
};
