import { Visit } from '../models/Visit.js';
import { logAudit } from '../utils/audit.js';

const ACTIVE_VISIT_STATUSES = ['scheduled', 'checked_in'];

const usesPhysicalBadge = (category) => category === 'client' || category === 'provider';

const assertBadgeIsAvailable = async ({ badgeNumber, category, excludeVisitId }) => {
  if (!usesPhysicalBadge(category) || !Number.isInteger(badgeNumber)) return;

  const query = {
    badgeNumber,
    category: { $in: ['client', 'provider'] },
    status: { $in: ACTIVE_VISIT_STATUSES }
  };
  if (excludeVisitId) query._id = { $ne: excludeVisitId };

  const existingVisit = await Visit.findOne(query).select('_id visitorName');
  if (existingVisit) {
    const error = new Error(`La tarjeta ${badgeNumber} ya está asignada a otra visita activa.`);
    error.statusCode = 409;
    throw error;
  }
};

export const createVisit = async (req, res) => {
  const now = new Date();
  const payload = {
    ...req.body,
    status: 'checked_in',
    scheduledAt: now,
    checkedInAt: now,
    createdBy: req.user._id
  };

  await assertBadgeIsAvailable({
    badgeNumber: payload.badgeNumber,
    category: payload.category
  });

  const visit = await Visit.create(payload);
  const populated = await visit.populate('client', 'companyName contactName');
  await logAudit({ req, action: 'visit.create', entityType: 'visit', entityId: visit._id, metadata: { category: visit.category } });
  res.status(201).json(populated);
};

export const getVisits = async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.scheduledAt = {};
    if (req.query.dateFrom) filter.scheduledAt.$gte = new Date(req.query.dateFrom);
    if (req.query.dateTo) filter.scheduledAt.$lte = new Date(req.query.dateTo);
  }

  const visits = await Visit.find(filter)
    .populate('client', 'companyName contactName')
    .populate('createdBy', 'name email')
    .sort({ scheduledAt: -1 });
  res.json(visits);
};

export const checkInVisit = async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });

  await assertBadgeIsAvailable({
    badgeNumber: visit.badgeNumber,
    category: visit.category,
    excludeVisitId: visit._id
  });

  if (!visit.checkedInAt) visit.checkedInAt = new Date();
  visit.status = 'checked_in';
  await visit.save();
  const populated = await visit.populate('client', 'companyName contactName');
  await logAudit({ req, action: 'visit.checkin', entityType: 'visit', entityId: visit._id });
  res.json(populated);
};

export const checkOutVisit = async (req, res) => {
  const visit = await Visit.findById(req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });

  if (!visit.checkedInAt) visit.checkedInAt = new Date();
  visit.checkedOutAt = new Date();
  visit.status = 'completed';
  await visit.save();
  const populated = await visit.populate('client', 'companyName contactName');
  await logAudit({ req, action: 'visit.checkout', entityType: 'visit', entityId: visit._id });
  res.json(populated);
};

export const getVisitById = async (req, res) => {
  const visit = await Visit.findById(req.params.id).populate('client', 'companyName contactName');
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
  res.json(visit);
};

export const updateVisit = async (req, res) => {
  const currentVisit = await Visit.findById(req.params.id);
  if (!currentVisit) return res.status(404).json({ message: 'Visita no encontrada' });

  const nextCategory = req.body.category ?? currentVisit.category;
  const nextBadgeNumber = req.body.badgeNumber ?? currentVisit.badgeNumber;
  const nextStatus = req.body.status ?? currentVisit.status;
  const nextIsActiveStatus = ACTIVE_VISIT_STATUSES.includes(nextStatus);

  if (nextIsActiveStatus) {
    await assertBadgeIsAvailable({
      badgeNumber: nextBadgeNumber,
      category: nextCategory,
      excludeVisitId: currentVisit._id
    });
  }

  const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('client', 'companyName contactName');
  res.json(visit);
};

export const deleteVisit = async (req, res) => {
  const visit = await Visit.findByIdAndDelete(req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
  await logAudit({ req, action: 'visit.delete', entityType: 'visit', entityId: visit._id });
  res.status(204).send();
};
