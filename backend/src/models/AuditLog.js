import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  action: { type: String, required: true },
  method: { type: String, required: true },
  endpoint: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  details: { type: mongoose.Schema.Types.Mixed }
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema); 