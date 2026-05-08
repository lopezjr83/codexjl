import { Visit } from '../models/Visit.js';
import { logAudit } from '../utils/audit.js';
import { uploadToDrive } from '../utils/driveUpload.js';

const CAT_LABEL = { visitor: 'Visita', client: 'Cliente', provider: 'Proveedor' };

const buildDriveFileName = (body, now) => {
  const cat    = CAT_LABEL[body.category] || body.category || 'Visita';
  const badge  = String(body.badgeNumber || '00').padStart(2, '0');
  const name   = (body.visitorName || 'Sin_nombre').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/g, '');
  const date   = now.toISOString().slice(0, 10);
  const time   = now.toTimeString().slice(0, 5).replace(':', '-');
  return `${cat}_${badge}_${name}_${date}_${time}.jpg`;
};

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms))
]);

export const createVisit = async (req, res) => {
  const now = new Date();
  const body = req.body;

  console.log('[createVisit] body keys:', body ? Object.keys(body).join(', ') : 'undefined/null');
  console.log('[createVisit] category:', body?.category, '| hasPhoto:', !!body?.dpiPhoto);

  // Upload DPI photo to Google Drive if present
  let dpiPhoto = body.dpiPhoto || '';
  if (dpiPhoto && process.env.GOOGLE_DRIVE_FOLDER_ID) {
    try {
      const fileName = buildDriveFileName(body, now);
      console.log('[createVisit] Attempting Drive upload:', fileName);
      const driveUrl = await withTimeout(uploadToDrive(dpiPhoto, fileName), 8000);
      if (driveUrl) {
        dpiPhoto = driveUrl;
        console.log('[createVisit] Drive upload OK:', driveUrl);
      }
    } catch (err) {
      console.error('[createVisit] Drive upload failed (fallback to base64):', err.message);
    }
  }

  const payload = {
    ...body,
    dpiPhoto,
    status: 'checked_in',
    scheduledAt: now,
    checkedInAt: now,
    createdBy: req.user._id
  };

  console.log('[createVisit] Creating visit in MongoDB...');
  const visit = await Visit.create(payload);
  console.log('[createVisit] Visit created OK:', visit._id);
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
  await logAudit({ req, action: 'visit.delete', entityType: 'visit', entityId: visit._id });
  res.status(204).send();
};
