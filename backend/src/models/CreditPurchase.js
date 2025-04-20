import mongoose from 'mongoose';

/**
 * Modelo de Compra a Crédito
 * Almacena información sobre productos comprados a crédito a proveedores
 */
const creditPurchaseSchema = new mongoose.Schema({
  // Proveedor asociado a esta compra
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'El proveedor es obligatorio']
  },
  // Número de factura o documento proporcionado por el proveedor
  invoiceNumber: {
    type: String,
    trim: true
  },
  // Fecha de la compra
  purchaseDate: {
    type: Date,
    default: Date.now,
    required: [true, 'La fecha de compra es obligatoria']
  },
  // Fecha de vencimiento del crédito
  dueDate: {
    type: Date,
    required: [true, 'La fecha de vencimiento es obligatoria']
  },
  // Items comprados
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'El producto es obligatorio']
    },
    quantity: {
      type: Number,
      required: [true, 'La cantidad es obligatoria'],
      min: [0.01, 'La cantidad debe ser mayor a 0']
    },
    unitPrice: {
      type: Number,
      required: [true, 'El precio unitario es obligatorio'],
      min: [0, 'El precio unitario no puede ser negativo']
    },
    // Precio total del ítem (cantidad * precio unitario)
    totalPrice: {
      type: Number,
      required: [true, 'El precio total es obligatorio']
    }
  }],
  // Subtotal (suma de los precios totales de todos los ítems)
  subtotal: {
    type: Number,
    required: [true, 'El subtotal es obligatorio'],
    min: [0, 'El subtotal no puede ser negativo']
  },
  // Impuesto (IVA)
  tax: {
    type: Number,
    default: 0
  },
  // Descuento aplicado
  discount: {
    type: Number,
    default: 0
  },
  // Total a pagar (subtotal + impuesto - descuento)
  total: {
    type: Number,
    required: [true, 'El total es obligatorio']
  },
  // Saldo pendiente por pagar
  balance: {
    type: Number,
    default: function() {
      return this.total;
    }
  },
  // Estado de la compra (pendiente, parcial, pagada, cancelada)
  status: {
    type: String,
    enum: ['pendiente', 'parcial', 'pagada', 'cancelada'],
    default: 'pendiente'
  },
  // Notas adicionales sobre la compra
  notes: {
    type: String,
    trim: true
  },
  // Archivo adjunto (factura digitalizada, etc.)
  attachments: [{
    filename: String,
    path: String,
    contentType: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  // Registro de pagos realizados a esta compra
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'transferencia', 'cheque', 'otro'],
      default: 'efectivo'
    },
    notes: String,
    receiptNumber: String
  }]
}, {
  timestamps: true
});

// Método para calcular el saldo pendiente
creditPurchaseSchema.methods.calculateBalance = function() {
  const payments = this.payments || [];
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  return this.total - totalPaid;
};

// Middleware para actualizar el saldo y el estado antes de guardar
creditPurchaseSchema.pre('save', function(next) {
  // Calcular el saldo pendiente
  this.balance = this.calculateBalance();
  
  // Actualizar el estado según el saldo
  if (this.balance <= 0) {
    this.status = 'pagada';
  } else if (this.balance < this.total) {
    this.status = 'parcial';
  } else {
    this.status = 'pendiente';
  }
  
  next();
});

const CreditPurchase = mongoose.model('CreditPurchase', creditPurchaseSchema);

export default CreditPurchase; 