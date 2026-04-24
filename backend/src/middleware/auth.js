import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }

    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub).select('-password');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Usuario no válido o inactivo' });

    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'No tienes permisos para esta acción' });
  }
  next();
};
