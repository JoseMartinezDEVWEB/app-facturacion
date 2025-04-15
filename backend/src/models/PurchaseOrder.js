// models/PurchaseOrder.js
import mongoose from 'mongoose';

const PurchaseOrderItemSchema = new mongoose.Schema({
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
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String
});

const PaymentSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'bank_transfer', 'check', 'credit_card', 'credit'],
    default: 'cash'
  },
  reference: String,
  notes: String
});

const PurchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente', // Usamos el modelo Cliente existente
    required: true
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  estimatedDeliveryDate: {
    type: Date
  },
  actualDeliveryDate: {
    type: Date
  },
  items: [PurchaseOrderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  discount: {
    type: Number,
    default: 0,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['draft', 'issued', 'received', 'cancelled'],
    default: 'draft'
  },
  payments: [PaymentSchema],
  amountPaid: {
    type: Number,
    default: 0
  },
  balanceDue: {
    type: Number,
    default: 0
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Pre-save hook para actualizar información de pagos
PurchaseOrderSchema.pre('save', function(next) {
  // Calcular monto pagado
  this.amountPaid = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  
  // Calcular saldo pendiente
  this.balanceDue = this.total - this.amountPaid;
  
  // Actualizar estado de pago
  if (this.balanceDue <= 0) {
    this.paymentStatus = 'paid';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'partial';
  } else {
    this.paymentStatus = 'pending';
  }
  
  next();
});

// Método para generar número de orden
PurchaseOrderSchema.statics.generateOrderNumber = async function() {
  // Obtener año y mes actuales
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  // Encontrar la última orden para este mes
  const lastOrder = await this.findOne({
    orderNumber: { $regex: `OC-${year}${month}-` }
  }).sort({ orderNumber: -1 });
  
  let number = 1;
  if (lastOrder) {
    // Extraer el número secuencial
    const lastNumber = lastOrder.orderNumber.split('-')[2];
    number = parseInt(lastNumber) + 1;
  }
  
  // Formatear número con ceros a la izquierda
  const formattedNumber = number.toString().padStart(4, '0');
  
  return `OC-${year}${month}-${formattedNumber}`;
};

const PurchaseOrder = mongoose.model('PurchaseOrder', PurchaseOrderSchema);

export default PurchaseOrder;