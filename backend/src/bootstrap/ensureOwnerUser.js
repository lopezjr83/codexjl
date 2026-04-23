import { User } from '../models/User.js';
import { env } from '../config/env.js';

const OWNER_DEFAULTS = {
  name: 'Lopez Jr',
  email: 'lopezjr@spadd.net',
  password: 'Spadd001!',
  role: 'admin'
};

let ownerEnsured = false;

export const ensureOwnerUser = async () => {
  if (ownerEnsured || !env.ownerAutocreate) return;

  try {
    const existing = await User.findOne({ email: OWNER_DEFAULTS.email });
    if (!existing) {
      await User.create(OWNER_DEFAULTS);
      console.log(`✅ Usuario dueño creado: ${OWNER_DEFAULTS.email}`);
    }
    ownerEnsured = true;
  } catch (error) {
    ownerEnsured = true;
    console.warn('⚠️ No se pudo validar/crear usuario dueño. Verifica permisos readWrite en MongoDB.', error.message);
  }
};
