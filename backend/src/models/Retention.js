import mongoose from 'mongoose';

const retentionSchema = new mongoose.Schema({
  invoice: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Invoice',
    required: true
  },
  retentionNumber: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  items: [
    {
      description: {
        type: String,
        required: true
      },
      base: {
        type: Number,
        required: true
      },
      percentage: {
        type: Number,
        required: true
      }
    }
  ],
  retentionType: {
    type: String,
    required: true,
    enum: ['income', 'vat', 'other']
  },
  totalRetained: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'processed', 'cancelled'],
    default: 'draft'
  },
  authorizationNumber: {
    type: String,
    default: ''
  },
  authorizationDate: {
    type: Date
  },
  processedAt: {
    type: Date
  },
  cancelledAt: {
    type: Date
  },
  cancellationReason: {
    type: String
  },
  observations: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

retentionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export const Retention = mongoose.model('Retention', retentionSchema); 