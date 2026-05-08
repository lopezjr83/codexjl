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
    'Fecha entrada',
    'Fecha salida',
    'Duracion (min)',
    'Categoria',
    'Nombre',
    'DPI',
    'A quien visita',
    'Motivo',
    'Empresa',
    'Telefono',
    'No. Tarjeta',
    'Estado',
    'Registrado por'
  ];

  const rows = visits.map((visit) => {
    const inAt  = visit.checkedInAt  || visit.scheduledAt;
    const outAt = visit.checkedOutAt;
    const durationMin = inAt && outAt
      ? Math.max(0, Math.round((new Date(outAt) - new Date(inAt)) / 60000))
      : '';
    const catMap = { visitor: 'Visita', client: 'Cliente', provider: 'Proveedor' };
    return [
      inAt  ? new Date(inAt).toLocaleString('es-GT')  : '',
      outAt ? new Date(outAt).toLocaleString('es-GT') : '',
      durationMin,
      catMap[visit.category] || visit.category,
      visit.visitorName,
      visit.visitorDocument,
      visit.hostPerson || '',
      visit.purpose,
      visit.company || '',
      visit.phone   || '',
      visit.badgeNumber || '',
      visit.status,
      visit.createdBy?.email || ''
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="visits-report-${Date.now()}.csv"`);
  res.status(200).send(csv);
};
