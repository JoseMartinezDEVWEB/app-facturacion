import mongoose from 'mongoose';

const creditNoteSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    relatedInvoice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Invoice',
        required: true
    },
    creditNoteNumber: {
        type: String,
        required: true,
        unique: true
    },
    fiscalCreditNoteNumber: {
        type: String,
        unique: true,
        sparse: true
    },
    dateTime: {
        type: Date,
        default: Date.now,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        enum: ['product_return', 'pricing_error', 'tax_adjustment', 'damaged_product', 'service_issue', 'other']
    },
    reasonDetails: {
        type: String,
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
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
    refundMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer', 'store_credit', 'replacement', 'other'],
        required: true
    },
    refundDetails: {
        accountNumber: String,
        bankName: String,
        transactionId: String,
        storeCreditId: String,
        replacementInvoiceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Invoice'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'processed', 'cancelled'],
        default: 'pending'
    },
    isFiscal: {
        type: Boolean,
        default: false
    },
    fiscalStatus: {
        type: String,
        enum: ['not_fiscal', 'pending', 'sent', 'approved', 'rejected'],
        default: 'not_fiscal'
    },
    fiscalResponse: {
        code: String,
        message: String,
        timestamp: Date,
        authId: String
    },
    notes: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date
    }
});

// Middleware para generar el número de nota de crédito
creditNoteSchema.pre('validate', async function(next) {
    try {
        if (!this.creditNoteNumber) {
            const count = await mongoose.model('CreditNote').countDocuments();
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            this.creditNoteNumber = `NC-${year}${month}-${String(count + 1).padStart(4, '0')}`;
            
            if (this.isFiscal && !this.fiscalCreditNoteNumber) {
                this.fiscalCreditNoteNumber = `FNC-${year}${month}${day}-${String(count + 1).padStart(6, '0')}`;
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Método para verificar si una nota de crédito está relacionada con una factura específica
creditNoteSchema.methods.isRelatedToInvoice = function(invoiceId) {
    return this.relatedInvoice.toString() === invoiceId.toString();
};

// Calcular impuestos
creditNoteSchema.pre('save', function(next) {
    if (this.isModified('taxes') || this.isNew) {
        this.taxAmount = this.taxes.reduce((sum, tax) => sum + tax.amount, 0);
    }
    next();
});

export const CreditNote = mongoose.model('CreditNote', creditNoteSchema); 