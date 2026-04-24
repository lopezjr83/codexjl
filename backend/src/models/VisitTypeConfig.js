import mongoose from 'mongoose';

const typeSchema = new mongoose.Schema({
  key: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, required: true }
}, { _id: false });

const visitTypeConfigSchema = new mongoose.Schema({
  types: {
    visitor: { type: typeSchema, default: { key: 'visitor', label: 'Visita', color: '#3b82f6' } },
    client: { type: typeSchema, default: { key: 'client', label: 'Cliente', color: '#ff7f32' } },
    provider: { type: typeSchema, default: { key: 'provider', label: 'Proveedor', color: '#22c55e' } }
  }
}, { timestamps: true });

export const VisitTypeConfig = mongoose.model('VisitTypeConfig', visitTypeConfigSchema);
