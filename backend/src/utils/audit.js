import { AuditLog } from '../models/AuditLog.js';

export const logAudit = async ({ req, action, entityType, entityId, metadata = {} }) => {
  try {
    await AuditLog.create({
      user: req.user?._id,
      action,
      entityType,
      entityId: entityId ? String(entityId) : undefined,
      metadata,
      ip: req.ip
    });
  } catch (error) {
    console.warn('⚠️ Error registrando auditoría:', error.message);
  }
};
