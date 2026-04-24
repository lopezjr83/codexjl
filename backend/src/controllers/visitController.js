import { Visit } from '../models/Visit.js';

export const createVisit = async (req, res) => {
  const visit = await Visit.create({ ...req.body, createdBy: req.user._id });
  const populated = await visit.populate('client', 'companyName contactName');
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

  if (!visit.checkedInAt) visit.checkedInAt = new Date();
  visit.status = 'checked_in';
  await visit.save();
  const populated = await visit.populate('client', 'companyName contactName');
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
  res.json(populated);
};

export const getVisitById = async (req, res) => {
  const visit = await Visit.findById(req.params.id).populate('client', 'companyName contactName');
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
  res.json(visit);
};

export const updateVisit = async (req, res) => {
  const visit = await Visit.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate(
    'client',
    'companyName contactName'
  );
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
  res.json(visit);
};

export const deleteVisit = async (req, res) => {
  const visit = await Visit.findByIdAndDelete(req.params.id);
  if (!visit) return res.status(404).json({ message: 'Visita no encontrada' });
  res.status(204).send();
};
