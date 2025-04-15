// models/Cliente.js
import mongoose from 'mongoose';

const ClienteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Por favor ingrese un nombre'],
    trim: true
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Por favor ingrese un email válido'
    ]
  },
  phone: {
    type: String,
    required: [true, 'Por favor ingrese un número de teléfono']
  },
  role: {
    type: String,
    enum: ['cliente', 'proveedor', 'socio'],
    default: 'cliente'
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  credito: {
    type: Number,
    default: 0
  },
  cuentasPendientes: {
    type: Number,
    default: 0
  },
  cuentasVendidas: {
    type: Number,
    default: 0
  },
  // Campos específicos para proveedores
  rncCedula: {
    type: String,
    trim: true
  },
  tipoNegocio: String,
  condicionesPago: {
    type: String,
    enum: ['inmediato', '15dias', '30dias', '45dias', '60dias', 'otro'],
    default: 'inmediato'
  },
  contactoPrincipal: String,
  notasAdicionales: String,
  // Productos que ofrece este proveedor
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  createdBy: {
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
}, {
  timestamps: true
});

// Método para verificar si es proveedor
ClienteSchema.methods.isProvider = function() {
  return this.role === 'proveedor';
};

// Método para calcular totales pendientes
ClienteSchema.methods.calculatePendingBalance = async function() {
  if (this.role !== 'proveedor') return 0;
  
  const PurchaseOrder = mongoose.model('PurchaseOrder');
  
  const pendingOrders = await PurchaseOrder.find({
    provider: this._id,
    paymentStatus: { $ne: 'paid' }
  });
  
  return pendingOrders.reduce((total, order) => total + order.balanceDue, 0);
};

// Para búsqueda por texto
ClienteSchema.index({ name: 'text', email: 'text', rncCedula: 'text' });

// Por tipo
ClienteSchema.index({ role: 1 });

const Cliente = mongoose.model('Cliente', ClienteSchema);

export default Cliente;