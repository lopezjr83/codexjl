import { User } from '../models/User.js';
import { env } from '../config/env.js';

const OWNER_EMAIL = 'lopezjr@spadd.net';
const OWNER_NAME = 'Lopez Jr';

let ownerEnsured = false;

export const ensureOwnerUser = async () => {
  if (ownerEnsured || !env.ownerAutocreate) return;

  try {
    if (!env.ownerPassword) {
      console.warn('⚠️ OWNER_PASSWORD no está definida. Se omite la creación/sincronización del usuario dueño.');
      return;
    }

    let owner = await User.findOne({ email: OWNER_EMAIL });

    if (!owner) {
      owner = await User.create({ name: OWNER_NAME, email: OWNER_EMAIL, password: env.ownerPassword, role: 'admin' });
      console.log(`✅ Usuario dueño creado: ${OWNER_EMAIL}`);
    } else if (env.ownerSyncPassword) {
      const matchesDefault = await owner.comparePassword(env.ownerPassword);
      if (!matchesDefault) {
        owner.password = env.ownerPassword;
        owner.role = 'admin';
        await owner.save();
        console.log(`✅ Contraseña de usuario dueño sincronizada: ${OWNER_EMAIL}`);
      }
    }
  } catch (error) {
    console.warn('⚠️ No se pudo validar/sincronizar usuario dueño. Verifica permisos de MongoDB.', error.message);
  } finally {
    ownerEnsured = true;
  }
};
