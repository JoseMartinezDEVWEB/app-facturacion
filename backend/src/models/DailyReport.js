import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    category: {
        type: String,
        enum: ['supplies', 'utilities', 'maintenance', 'products', 'other'],
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'credit_card', 'bank_transfer'],
        required: true
    }
});

const salesSummarySchema = new mongoose.Schema({
    totalSales: {
        type: Number,
        required: true,
        default: 0
    },
    totalInvoices: {
        type: Number,
        required: true,
        default: 0
    },
    paymentMethods: {
        cash: {
            count: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        },
        creditCard: {
            count: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        },
        bankTransfer: {
            count: { type: Number, default: 0 },
            amount: { type: Number, default: 0 }
        }
    }
});

const cashRegisterSchema = new mongoose.Schema({
    initialAmount: {
        type: Number,
        required: true
    },
    finalAmount: {
        type: Number,
        required: true
    },
    difference: {
        type: Number,
        required: true
    },
    notes: String
});

const inventoryMovementSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['purchase', 'sale', 'return', 'adjustment'],
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    cost: Number
});

const dailyReportSchema = new mongoose.Schema({
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now
    },
    openedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    closedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['open', 'closed'],
        default: 'open'
    },
    sales: salesSummarySchema,
    expenses: [expenseSchema],
    cashRegister: cashRegisterSchema,
    inventoryMovements: [inventoryMovementSchema],
    notes: String,
    closingNotes: String
}, {
    timestamps: true
});

// Método para calcular totales
dailyReportSchema.methods.calculateTotals = function() {
    // Calcular total de gastos
    const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calcular ganancia neta
    const netProfit = this.sales.totalSales - totalExpenses;
    
    return {
        totalExpenses,
        netProfit,
        grossSales: this.sales.totalSales
    };
};

export const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
