import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del negocio es obligatorio'],
    trim: true
  },
  taxId: {
    type: String,
    required: [true, 'El RNC/identificación fiscal es obligatorio'],
    trim: true
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
  website: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true,
    default: ''
  },
  logo: {
    type: String, // URL del logo almacenado
    default: ''
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
businessSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Solo permitiremos un registro de negocio en el sistema
businessSchema.statics.getBusinessInfo = async function() {
  const businessInfo = await this.findOne({});
  return businessInfo || null;
};

const Business = mongoose.model('Business', businessSchema);

export default Business; 