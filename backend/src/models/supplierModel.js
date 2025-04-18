import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre o razón social es obligatorio'],
    trim: true
  },
  taxId: {
    type: String,
    required: [true, 'El RUT/NIT/CUIT/DNI es obligatorio'],
    trim: true
  },
  supplierType: {
    type: String,
    required: [true, 'El tipo de proveedor es obligatorio'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'La categoría o rubro es obligatorio'],
    trim: true
  },
  status: {
    type: String,
    enum: ['activo', 'inactivo'],
    default: 'activo'
  },
  address: {
    type: String,
    required: [true, 'La dirección es obligatoria'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es obligatorio'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Por favor ingrese un email válido']
  },
  contactPerson: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  fiscalId: {
    type: String,
    trim: true
  },
  fiscalRegime: {
    type: String,
    trim: true
  },
  vatCondition: {
    type: String,
    trim: true
  },
  preferredPaymentMethod: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    trim: true
  },
  relationshipStartDate: {
    type: Date,
    default: Date.now
  },
  paymentTerms: {
    type: String,
    trim: true
  },
  documents: [{
    name: String,
    path: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  rating: {
    score: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    comments: [{
      text: String,
      date: {
        type: Date,
        default: Date.now
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }]
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

// Middleware para actualizar la fecha de modificación
supplierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Supplier = mongoose.model('Supplier', supplierSchema);

export default Supplier; 