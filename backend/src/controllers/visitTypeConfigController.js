import { VisitTypeConfig } from '../models/VisitTypeConfig.js';

const defaults = {
  visitor: { key: 'visitor', label: 'Visita', color: '#3b82f6' },
  client: { key: 'client', label: 'Cliente', color: '#ff7f32' },
  provider: { key: 'provider', label: 'Proveedor', color: '#22c55e' }
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
