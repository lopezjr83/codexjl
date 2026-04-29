import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

export const FEATURE_KEYS = ['dashboard', 'operations', 'profile', 'reports', 'usersAdmin'];

export const getDefaultPermissions = (role = 'staff', current = {}) => {
  if (role === 'admin') {
    return { dashboard: true, operations: true, profile: true, reports: true, usersAdmin: true };
  }

  const base = { dashboard: true, operations: true, profile: true, reports: false, usersAdmin: false };
  return { ...base, ...current };
};

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 8 },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
    permissions: {
      dashboard: { type: Boolean, default: true },
      operations: { type: Boolean, default: true },
      profile: { type: Boolean, default: true },
      reports: { type: Boolean, default: false },
      usersAdmin: { type: Boolean, default: false }
    },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.pre('validate', function syncPermissions(next) {
  this.permissions = getDefaultPermissions(this.role, this.permissions || {});
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);
