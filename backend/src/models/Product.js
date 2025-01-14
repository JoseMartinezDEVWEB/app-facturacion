
import mongoose from 'mongoose';

const UNIT_TYPES = {
  UNIT: 'unidad',
  WEIGHT: 'peso',
  PACKAGE: 'paquete'
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
  


// Índices para búsqueda eficiente
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ barcode: 1 });
productSchema.index({ qrCode: 1 });

export const Product = mongoose.model('Product', productSchema);
export { UNIT_TYPES };