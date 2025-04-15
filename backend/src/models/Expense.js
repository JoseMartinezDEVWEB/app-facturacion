import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del gasto es obligatorio'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'El monto del gasto es obligatorio'],
    min: [0, 'El monto no puede ser negativo']
  },
  category: {
    type: String,
    enum: ['Operativo', 'Material', 'Servicio', 'Otro'],
    default: 'Otro'
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'],
    default: 'Efectivo'
  },
  deductFromSales: {
    type: Boolean,
    default: false, // Por defecto no se descuenta
    required: true
  },
  deductionPeriod: {
    type: String,
    enum: ['day', 'month'],
    default: 'day'  // Por defecto se descuenta del día
  },
  receipt: {
    type: String // URL o referencia al archivo
  },
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Índice para mejorar las consultas por fecha
expenseSchema.index({ date: 1 });

// Método para obtener gastos del día actual
expenseSchema.statics.getTodayExpenses = async function() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  return this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
};

// Método para obtener el total de gastos descontables de hoy
expenseSchema.statics.getTodayDeductibleExpensesTotal = async function() {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  const deductibleExpenses = await this.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    deductFromSales: true,
    deductionPeriod: 'day'
  });
  
  return deductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
};

// Método para obtener el total de gastos descontables del mes
expenseSchema.statics.getMonthDeductibleExpensesTotal = async function() {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  
  const deductibleExpenses = await this.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    },
    deductFromSales: true,
    deductionPeriod: 'month'
  });
  
  return deductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
};

const Expense = mongoose.model('Expense', expenseSchema);
export default Expense;