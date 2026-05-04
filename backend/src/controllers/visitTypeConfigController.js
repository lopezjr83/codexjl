import { VisitTypeConfig } from '../models/VisitTypeConfig.js';

const defaults = {
  visitor: { key: 'visitor', label: 'Visita', color: '#1d4ed8' },
  client: { key: 'client', label: 'Cliente', color: '#b45309' },
  provider: { key: 'provider', label: 'Proveedor', color: '#15803d' }
};

const ensureConfig = async () => {
  let config = await VisitTypeConfig.findOne();
  if (!config) config = await VisitTypeConfig.create({ types: defaults });
  return config;
};

export const getVisitTypeConfig = async (req, res) => {
  const config = await ensureConfig();
  res.json(config.types);
};

export const updateVisitTypeConfig = async (req, res) => {
  const config = await ensureConfig();
  config.types = { ...config.types, ...req.body };
  await config.save();
  res.json(config.types);
};
