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
    await User.create(OWNER_DEFAULTS);
    console.log(`✅ Usuario dueño creado: ${OWNER_DEFAULTS.email}`);
  } catch (error) {
    if (error?.code !== 11000) {
      console.warn('⚠️ No se pudo validar/crear usuario dueño. Verifica permisos de MongoDB.', error.message);
    }
  } finally {
    ownerEnsured = true;
  }
};
