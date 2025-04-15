import mongoose from 'mongoose';

const businessSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre del negocio es requerido']
    },
    address: {
        street: String,
        suite: String,
        city: String,
        state: String,
        zipCode: String
    },
    phone: {
        type: String,
        required: [true, 'El teléfono es requerido']
    },
    taxId: String,
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const Business = mongoose.model('Business', businessSchema);