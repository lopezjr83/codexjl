import { User } from '../models/User.js';

const OWNER_DEFAULTS = {
  name: 'Lopez Jr',
  email: 'lopezjr@spadd.net',
  password: 'Spadd001!',
  role: 'admin'
};

let ownerEnsured = false;

export const ensureOwnerUser = async () => {
  if (ownerEnsured) return;

  const existing = await User.findOne({ email: OWNER_DEFAULTS.email });
  if (!existing) {
    await User.create(OWNER_DEFAULTS);
    console.log(`✅ Usuario dueño creado: ${OWNER_DEFAULTS.email}`);
  }

  ownerEnsured = true;
};
