import { Visit } from '../models/Visit.js';

const csvEscape = (value) => {
  const stringValue = value == null ? '' : String(value);
  if (/[",\n]/.test(stringValue)) return `"${stringValue.replace(/"/g, '""')}"`;
  return stringValue;
};

export const exportVisitsCsv = async (req, res) => {
  const visits = await Visit.find()
    .populate('client', 'companyName contactName')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  const header = [
    'id',
    'category',
    'visitorName',
    'visitorDocument',
    'status',
    'scheduledAt',
    'checkedInAt',
    'checkedOutAt',
    'clientCompany',
    'createdBy'
  ];

  const rows = visits.map((visit) => [
    visit._id,
    visit.category,
    visit.visitorName,
    visit.visitorDocument,
    visit.status,
    visit.scheduledAt?.toISOString(),
    visit.checkedInAt?.toISOString(),
    visit.checkedOutAt?.toISOString(),
    visit.client?.companyName,
    visit.createdBy?.email
  ]);

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="visits-report-${Date.now()}.csv"`);
  res.status(200).send(csv);
};
