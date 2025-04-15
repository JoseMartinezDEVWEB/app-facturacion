
import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    required: true,
    unique: true
  },
  dateTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  cashier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  customer: {
    name: {
      type: String,
      default: 'Consumidor Final'
    },
    email: String,
    phone: String,
    address: String,
    taxId: String
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    // Añadir soporte para productos por peso
    weightInfo: {
      value: Number,
      unit: String,
      pricePerUnit: Number
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit_card', 'bank_transfer', 'credit'], // Añadir 'credit' para compras fiadas
    required: true
  },
  paymentDetails: {
    cardLastFour: String,
    transactionId: String,
    authorizationCode: String
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxRate: {
    type: Number,
    required: true,
    default: 0.18
  },
  taxAmount: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['completed', 'cancelled', 'pending'],
    default: 'completed'
  },
  // Campos para compras fiadas
  isCredit: {
    type: Boolean,
    default: false
  },
  clienteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente'
  },
  clientInfo: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente'
    },
    name: String
  },
  creditStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Generate receipt number middleware
invoiceSchema.pre('save', async function(next) {
  try {
    if (!this.receiptNumber) {
      const count = await mongoose.model('newInvoice').countDocuments();
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      this.receiptNumber = `FAC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

export const newInvoice = mongoose.model('newInvoice', invoiceSchema);