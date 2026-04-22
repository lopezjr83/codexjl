import { Visit } from '../models/Visit.js';

export const createVisit = async (req, res) => {
  const visit = await Visit.create({ ...req.body, createdBy: req.user._id });
  const populated = await visit.populate('client', 'companyName contactName');
  res.status(201).json(populated);
};

export const getVisits = async (req, res) => {
  const visits = await Visit.find()
    .populate('client', 'companyName contactName')
    .populate('createdBy', 'name email')
    .sort({ scheduledAt: -1 });
  res.json(visits);
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
