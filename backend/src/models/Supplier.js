import mongoose from 'mongoose';

/**
 * Modelo de Proveedor
 * Almacena información sobre los proveedores para las compras a crédito
 */
const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del proveedor es obligatorio'],
    trim: true
  },
  businessName: {
    type: String,
    trim: true
  },
  ruc: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  contactPerson: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  // Registro de la deuda pendiente con este proveedor
  currentDebt: {
    type: Number,
    default: 0
  },
  // Estado del proveedor (activo/inactivo)
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier; 