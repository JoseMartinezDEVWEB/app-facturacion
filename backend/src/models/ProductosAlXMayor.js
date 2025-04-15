import mongoose from 'mongoose';

const ProductoSchema = new mongoose.Schema({
  codigo: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  nombre: {
    type: String,
    required: [true, 'Por favor ingrese el nombre del producto'],
    trim: true
  },
  descripcion: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'Por favor ingrese el precio del producto'],
    default: 0
  },
  costo: {
    type: Number,
    default: 0
  },
  stock: {
    type: Number,
    default: 0
  },
  stockMinimo: {
    type: Number,
    default: 5
  },
  unidadMedida: {
    type: String,
    enum: ['unidad', 'kg', 'g', 'l', 'ml', 'paquete', 'caja', 'otro'],
    default: 'unidad'
  },
  proveedor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  estado: {
    type: String,
    enum: ['activo', 'inactivo', 'descontinuado'],
    default: 'activo'
  },
  impuesto: {
    type: Number,
    default: 18 // Porcentaje de ITBIS estándar en RD
  },
  fechaUltimaCompra: {
    type: Date
  },
  imagenUrl: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ProductosAlXMayor = mongoose.model('Producto', ProductoSchema);

export default ProductosAlXMayor;