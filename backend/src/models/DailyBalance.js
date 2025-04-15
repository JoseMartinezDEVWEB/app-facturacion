import mongoose from 'mongoose';

const dailyBalanceSchema = new mongoose.Schema({
  date: {
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

// Método para actualizar el balance
dailyBalanceSchema.statics.updateBalance = async function(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Calcular ventas y gastos
  const todaySales = await mongoose.model('Sale').find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const todayExpenses = await mongoose.model('Expense').find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    deductFromSales: true
  });
  
  const totalSales = todaySales.reduce((total, sale) => total + sale.totalAmount, 0);
  const totalDeductibleExpenses = todayExpenses.reduce((total, expense) => total + expense.amount, 0);
  const balance = totalSales - totalDeductibleExpenses;
  
  // Actualizar o crear el registro de balance
  return await this.findOneAndUpdate(
    { date: { $gte: startOfDay, $lte: endOfDay } },
    { 
      date: startOfDay,
      totalSales,
      totalDeductibleExpenses,
      balance,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

const DailyBalance = mongoose.model('DailyBalance', dailyBalanceSchema);
export default DailyBalance;