import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    visitorName: { type: String, required: true, trim: true },
    visitorDocument: { type: String, required: true, trim: true },
    purpose: { type: String, required: true, trim: true },
    scheduledAt: { type: Date, required: true },
    checkedInAt: { type: Date },
    checkedOutAt: { type: Date },
    status: { type: String, enum: ['scheduled', 'checked_in', 'completed', 'cancelled'], default: 'scheduled' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

export const Visit = mongoose.model('Visit', visitSchema);
