import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    receiptNumber: {
        type: String,
        required: true,
        unique: true
    },
    fiscalNumber: {
        type: String,
        unique: true,
        sparse: true // Permite valores nulos/undefined
    },
    dateTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    cashier: {
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
            required: true
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
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'credit', 'check', 'other'],
        required: true
    },
    paymentDetails: {
        cardLastFour: String,
        transactionId: String,
        authorizationCode: String,
        bank: String,
        checkNumber: String,
        dueDate: Date // Para pagos a crédito
    },
    paymentStatus: {
        type: String,
        enum: ['paid', 'partial', 'pending', 'overdue'],
        default: 'pending'
    },
    paidAmount: {
        type: Number,
        default: 0
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
    isFiscal: {
        type: Boolean,
        default: false
    },
    fiscalStatus: {
        type: String,
        enum: ['not_fiscal', 'pending', 'sent', 'approved', 'rejected', 'cancelled'],
        default: 'not_fiscal'
    },
    fiscalResponse: {
        code: String,
        message: String,
        timestamp: Date,
        authId: String,
        rejectionReason: String
    },
    status: {
        type: String,
        enum: ['draft', 'pending', 'completed', 'cancelled', 'refunded', 'partially_refunded'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    cash: {
        type: Number,
        default: 0
    },
    change: {
        type: Number,
        default: 0
    },
    refunds: [{
        amount: Number,
        date: Date,
        reason: String,
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Middleware para generar el número de recibo
invoiceSchema.pre('validate', async function(next) {
    try {
        if (!this.receiptNumber) {
            const count = await mongoose.model('Invoice').countDocuments();
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            this.receiptNumber = `FAC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
            
            // Si es fiscal, generar un número fiscal también
            if (this.isFiscal && !this.fiscalNumber) {
                this.fiscalNumber = `F-${year}${month}${day}-${String(count + 1).padStart(6, '0')}`;
            }
        }
        
        // Calcular impuesto total
        if (this.isModified('taxes') || this.isNew) {
            this.taxAmount = this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
        }
        
        // Actualizar estado de pago
        if (this.isModified('paidAmount') || this.isNew) {
            if (this.paidAmount >= this.total) {
                this.paymentStatus = 'paid';
            } else if (this.paidAmount > 0) {
                this.paymentStatus = 'partial';
            } else {
                this.paymentStatus = 'pending';
            }

            // Calcular el cambio en pagos en efectivo
            if (this.paymentMethod === 'cash' && this.cash > this.total) {
                this.change = this.cash - this.total;
            }
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

// Método para calcular el monto pendiente por pagar
invoiceSchema.methods.getPendingAmount = function() {
    return this.total - this.paidAmount;
};

// Método para verificar si está vencida (solo para facturas a crédito)
invoiceSchema.methods.isOverdue = function() {
    if (this.paymentMethod !== 'credit' || !this.paymentDetails.dueDate) {
        return false;
    }
    return new Date() > new Date(this.paymentDetails.dueDate) && this.paymentStatus !== 'paid';
};

// Método para agregar un pago parcial
invoiceSchema.methods.addPayment = async function(amount, paymentMethod, details = {}) {
    this.paidAmount += amount;
    this.updatedAt = new Date();
    
    // Actualizar estado de pago
    if (this.paidAmount >= this.total) {
        this.paymentStatus = 'paid';
    } else {
        this.paymentStatus = 'partial';
    }
    
    return this.save();
};

export const Invoice = mongoose.model('Invoice', invoiceSchema);