import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    quoteNumber: {
        type: String,
        required: true,
        unique: true
    },
    dateTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    customer: {
        name: {
            type: String,
            required: true
        },
        email: String,
        phone: String,
        address: String,
        taxId: String,
        type: {
            type: String,
            enum: ['individual', 'business', 'anonymous'],
            default: 'individual'
        }
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        taxes: [{
            name: String,
            rate: Number,
            amount: Number
        }],
        subtotal: {
            type: Number,
            required: true
        }
    }],
    purchaseType: {
        type: String,
        enum: ['retail', 'wholesale'],
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    discountAmount: {
        type: Number,
        default: 0
    },
    taxes: [{
        name: {
            type: String,
            required: true
        },
        rate: {
            type: Number,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        isExempt: {
            type: Boolean,
            default: false
        }
    }],
    taxAmount: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired', 'converted'],
        default: 'pending'
    },
    convertedToInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice'
    },
    notes: {
        type: String,
        trim: true
    },
    paymentTerms: {
        type: String,
        trim: true
    },
    deliveryTerms: {
        type: String,
        trim: true
    },
    additionalConditions: [{
        title: String,
        description: String
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Middleware para generar el número de cotización
quoteSchema.pre('validate', async function(next) {
    try {
        if (!this.quoteNumber) {
            const count = await mongoose.model('Quote').countDocuments();
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            
            this.quoteNumber = `COT-${year}${month}-${String(count + 1).padStart(4, '0')}`;
            
            // Establecer fecha de validez (30 días por defecto)
            if (!this.validUntil) {
                const validUntil = new Date();
                validUntil.setDate(validUntil.getDate() + 30);
                this.validUntil = validUntil;
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar si la cotización ha expirado
quoteSchema.methods.isExpired = function() {
    return new Date() > new Date(this.validUntil);
};

// Método para convertir una cotización en una factura
quoteSchema.methods.convertToInvoice = async function(data) {
    // Este método sería implementado en la lógica del controlador
    // ya que requiere crear una nueva factura y actualizar esta cotización
    return {
        quoteId: this._id,
        status: 'converted'
    };
};

// Validar estado antes de guardar
quoteSchema.pre('save', function(next) {
    // Si está expirada, actualizar estado
    if (this.isExpired() && this.status !== 'converted') {
        this.status = 'expired';
    }
    
    // Calcular impuesto total
    if (this.isModified('taxes') || this.isNew) {
        this.taxAmount = this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    }
    
    next();
});

export const Quote = mongoose.model('Quote', quoteSchema); 