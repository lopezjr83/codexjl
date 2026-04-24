import { AuditLog } from '../models/AuditLog.js';

export const getAuditLogs = async (req, res) => {
  const limit = Number(req.query.limit) || 100;
  const logs = await AuditLog.find()
    .populate('user', 'name email role')
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500));

  res.json(logs);
};
