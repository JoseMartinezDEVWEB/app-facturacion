import mongoose from 'mongoose';

const monthlyBalanceSchema = new mongoose.Schema({
  month: {
    type: Date,
    required: true,
    unique: true
  },
  totalSales: {
    type: Number,
    default: 0
  },
  totalDeductibleExpenses: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

// Método para actualizar el balance mensual
monthlyBalanceSchema.statics.updateBalance = async function(date) {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Calcular ventas y gastos mensuales
  const monthlySales = await mongoose.model('Sale').find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  const monthlyExpenses = await mongoose.model('Expense').find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    },
    deductFromSales: true,
    deductionPeriod: 'month'
  });
  
  const totalSales = monthlySales.reduce((total, sale) => total + (sale.totalAmount || 0), 0);
  const totalDeductibleExpenses = monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  const balance = totalSales - totalDeductibleExpenses;
  
  // Actualizar o crear el registro de balance mensual
  return await this.findOneAndUpdate(
    { month: startOfMonth },
    { 
      month: startOfMonth,
      totalSales,
      totalDeductibleExpenses,
      balance,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

const MonthlyBalance = mongoose.model('MonthlyBalance', monthlyBalanceSchema);
export default MonthlyBalance;