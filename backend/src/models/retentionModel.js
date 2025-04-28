import mongoose from 'mongoose';

const retentionItemSchema = mongoose.Schema({
  description: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    trim: true
  },
  base: {
    type: Number,
    required: true,
    default: 0
  },
  percentage: {
    type: Number,
    required: true,
    default: 0
  }
}, { _id: false });

const retentionSchema = mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  retentionNumber: {
    type: String,
    required: true,
    unique: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [retentionItemSchema],
  retentionType: {
    type: String,
    required: true,
    enum: ['renta', 'iva', 'ambos'],
    default: 'renta'
  },
  totalRetained: {
    type: Number,
    required: true,
    default: 0
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'processed', 'cancelled'],
    default: 'draft'
  },
  observations: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  authorizationNumber: {
    type: String,
    trim: true
  },
  authorizationDate: {
    type: Date
  },
  electronicDocumentUrl: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Índices para mejorar el rendimiento de las consultas
retentionSchema.index({ invoice: 1 });
retentionSchema.index({ date: 1 });
retentionSchema.index({ status: 1 });
retentionSchema.index({ createdAt: 1 });

export const Retention = mongoose.model('Retention', retentionSchema);
export default Retention; 