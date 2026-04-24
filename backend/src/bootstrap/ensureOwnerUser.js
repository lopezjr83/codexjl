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
    let owner = await User.findOne({ email: OWNER_DEFAULTS.email });

    if (!owner) {
      owner = await User.create(OWNER_DEFAULTS);
      console.log(`✅ Usuario dueño creado: ${OWNER_DEFAULTS.email}`);
    } else if (env.ownerSyncPassword) {
      const matchesDefault = await owner.comparePassword(OWNER_DEFAULTS.password);
      if (!matchesDefault) {
        owner.password = OWNER_DEFAULTS.password;
        owner.role = 'admin';
        await owner.save();
        console.log(`✅ Contraseña de usuario dueño sincronizada: ${OWNER_DEFAULTS.email}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ No se pudo validar/sincronizar usuario dueño. Verifica permisos de MongoDB.', error.message);
  } finally {
    ownerEnsured = true;
  }
};
