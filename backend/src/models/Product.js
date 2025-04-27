import mongoose from 'mongoose';

const UNIT_TYPES = {
  UNIT: 'unidad',
  WEIGHT: 'peso',
  PACKAGE: 'paquete'
};

const WEIGHT_UNITS = {
  KG: 'kg',
  G: 'g',
  LB: 'lb',
  OZ: 'oz'
};

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  unitType: {
    type: String,
    required: [true, 'El tipo de unidad es requerido'],
    enum: Object.values(UNIT_TYPES),
    default: UNIT_TYPES.UNIT
  },
  // Campos adicionales para productos por peso
  weightUnit: {
    type: String,
    enum: Object.values(WEIGHT_UNITS),
    default: WEIGHT_UNITS.LB,
    // Solo es requerido si el unitType es peso
    required: function() {
      return this.unitType === UNIT_TYPES.WEIGHT;
    }
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente'
  },
  // Campos para compra a crédito
  creditPurchase: {
    isCredit: {
      type: Boolean,
      default: false
    },
    paymentTerm: {
      type: String,
      enum: ['15dias', '30dias', '45dias', '60dias', 'otro'],
      default: '30dias'
    },
    dueDate: {
      type: Date
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paymentDate: {
      type: Date
    }
  },
  minWeight: {
    type: Number,
    default: 0.01,
    min: [0.001, 'El peso mínimo debe ser mayor a 0'],
    // Solo es requerido si el unitType es peso
    required: function() {
      return this.unitType === UNIT_TYPES.WEIGHT;
    }
  },
  packageWeight: { // Para productos que también se venden en paquetes/sacos
    type: Number,
    default: 0, // Si es 0, no se vende en paquetes completos
  },
  // Campos existentes
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [0, 'La cantidad no puede ser negativa']
  },
  minStock: {
    type: Number,
    required: [true, 'El stock mínimo es requerido'],
    default: 10
  },
  purchasePrice: {
    type: Number,
    required: [true, 'El precio de compra es requerido'],
    min: [0, 'El precio de compra no puede ser negativo']
  },
  salePrice: {
    type: Number,
    required: [true, 'El precio de venta es requerido'],
    min: [0, 'El precio de venta no puede ser negativo']
  },
  pricePerUnit: {
    type: Number,
    default: 0
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es requerida']
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    url: String,
    publicId: String
  },
  alertActive: {
    type: Boolean,
    default: false
  },
  lastAlertDate: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date
  }
});

// Middleware para verificar el stock antes de guardar
productSchema.pre('save', function(next) {
  if (this.quantity <= this.minStock) {
    this.alertActive = true;
    this.lastAlertDate = new Date();
  } else {
    this.alertActive = false;
    this.lastAlertDate = null;
  }
  
  // Calcular pricePerUnit si es producto por peso con packageWeight
  if (this.unitType === UNIT_TYPES.WEIGHT && this.packageWeight > 0 && this.salePrice > 0) {
    this.pricePerUnit = parseFloat((this.salePrice / this.packageWeight).toFixed(2));
  }
  
  next();
});

// Método para obtener la unidad de medida formateada
productSchema.methods.getFormattedQuantity = function() {
  switch(this.unitType) {
    case UNIT_TYPES.WEIGHT:
      return `${this.quantity} ${this.weightUnit}`;
    case UNIT_TYPES.PACKAGE:
      return `${this.quantity} paquetes`;
    default:
      return `${this.quantity} unidades`;
  }
};

// Método virtual para determinar si es producto por peso
productSchema.virtual('sellByWeight').get(function() {
  return this.unitType === UNIT_TYPES.WEIGHT;
});

// Método para calcular el precio por cantidad/peso
productSchema.methods.calculatePrice = function(quantityOrWeight) {
  if (this.unitType === UNIT_TYPES.WEIGHT) {
    // Para productos por peso, multiplicamos por el precio por unidad de peso
    return quantityOrWeight * this.salePrice;
  } else {
    // Para productos por unidad o paquete, multiplicamos por cantidad
    return Math.round(quantityOrWeight) * this.salePrice;
  }
};

// Método virtual para verificar si es compra a crédito
productSchema.virtual('isCreditPurchase').get(function() {
  return this.creditPurchase && this.creditPurchase.isCredit;
});

// Método virtual para calcular días restantes para pago
productSchema.virtual('daysUntilPayment').get(function() {
  if (!this.creditPurchase || !this.creditPurchase.isCredit || !this.creditPurchase.dueDate) {
    return 0;
  }
  
  const today = new Date();
  const dueDate = new Date(this.creditPurchase.dueDate);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// Método para marcar como pagado
productSchema.methods.markAsPaid = function() {
  if (this.creditPurchase && this.creditPurchase.isCredit && !this.creditPurchase.isPaid) {
    this.creditPurchase.isPaid = true;
    this.creditPurchase.paymentDate = new Date();
    return true;
  }
  return false;
};

// Índices para búsqueda eficiente
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ provider: 1 });
productSchema.index({ 'creditPurchase.isPaid': 1, 'creditPurchase.dueDate': 1 });

export const Product = mongoose.model('Product', productSchema);
export { UNIT_TYPES, WEIGHT_UNITS };