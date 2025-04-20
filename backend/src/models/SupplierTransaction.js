import mongoose from 'mongoose';

/**
 * Modelo de Transacción de Proveedor
 * Almacena registros de pagos y deudas para los proveedores
 */
const supplierTransactionSchema = new mongoose.Schema({
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'El proveedor es obligatorio']
  },
  type: {
    type: String,
    enum: ['payment', 'debt'],
    required: [true, 'El tipo de transacción es obligatorio']
  },
  amount: {
    type: Number,
    required: [true, 'El monto es obligatorio'],
    min: [0.01, 'El monto debe ser mayor a cero']
  },
  date: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    trim: true
  },
  // Referencia a la compra a crédito (opcional)
  creditPurchase: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditPurchase'
  },
  // Información del usuario que registró la transacción
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Middleware pre-save para actualizar la deuda del proveedor
supplierTransactionSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Supplier = mongoose.model('Supplier');
      const supplier = await Supplier.findById(this.supplier);
      
      if (!supplier) {
        return next(new Error('Proveedor no encontrado'));
      }
      
      // Actualizar la deuda según el tipo de transacción
      if (this.type === 'payment') {
        // Si es un pago, reducir la deuda
        supplier.currentDebt = Math.max(0, supplier.currentDebt - this.amount);
      } else if (this.type === 'debt') {
        // Si es una deuda, incrementar
        supplier.currentDebt += this.amount;
      }
      
      supplier.updatedAt = new Date();
      await supplier.save();
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const SupplierTransaction = mongoose.model('SupplierTransaction', supplierTransactionSchema);

export default SupplierTransaction; 