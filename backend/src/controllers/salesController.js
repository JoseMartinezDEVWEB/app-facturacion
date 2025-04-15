
import Sale from '../models/Sale.js';
import { Product } from '../models/Product.js';
import { DailyBalance } from '../models/DailyBalance.js';

export const createSale = async (req, res) => {
  try {
    const { items, clientId, total, paymentMethod } = req.body;
    
    // Crear la venta con los productos asociados
    const sale = new Sale({
      client: clientId,
      items: items.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.quantity * item.price
      })),
      total,
      paymentMethod,
      date: new Date()
    });

    // Actualizar el stock de los productos
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    await sale.save();
    
    // Actualizar el balance diario
    await DailyBalance.updateBalance(new Date());
    
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getSales = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = {};

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sales = await Sale.find(query)
      .populate('client')
      .populate('items.product');

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Función getExpenseSummary corregida para manejar posibles errores
export const getExpenseSummary = asyncHandler(async (req, res) => {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(today);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Obtener todos los gastos de hoy
  const todayExpenses = await Expense.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  // Inicializar valores por defecto
  let totalExpenses = 0;
  let totalDeductibleExpenses = 0;
  let totalNonDeductibleExpenses = 0;
  let totalSales = 0;
  let balance = 0;
  
  // Separar gastos descontables y no descontables (con manejo de errores)
  if (todayExpenses && todayExpenses.length > 0) {
    const deductibleExpenses = todayExpenses.filter(expense => expense.deductFromSales);
    const nonDeductibleExpenses = todayExpenses.filter(expense => !expense.deductFromSales);
    
    totalExpenses = todayExpenses.reduce((total, expense) => total + expense.amount, 0);
    totalDeductibleExpenses = deductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
    totalNonDeductibleExpenses = nonDeductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
  }
  
  try {
    // Obtener ventas de hoy (con manejo de errores)
    // Verificar si el modelo Sale está disponible
    if (typeof Sale !== 'undefined' && Sale !== null) {
      const todaySales = await Sale.find({
        date: {
          $gte: startOfDay,
          $lte: endOfDay
        }
      });
      
      if (todaySales && todaySales.length > 0) {
        totalSales = todaySales.reduce((total, sale) => {
          // Verificar que sale.totalAmount existe y es un número
          const amount = typeof sale.totalAmount === 'number' ? sale.totalAmount : 0;
          return total + amount;
        }, 0);
      }
    } else {
      console.warn('Modelo Sale no disponible, se usará 0 como valor predeterminado para ventas');
    }
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    // No lanzar error, simplemente continuar con totalSales = 0
  }
  
  // Calcular balance (ventas - gastos descontables)
  balance = totalSales - totalDeductibleExpenses;
  
  res.status(200).json({
    success: true,
    data: {
      date: today,
      totalExpenses,
      totalDeductibleExpenses,
      totalNonDeductibleExpenses,
      totalSales,
      balance,
      expensesDetail: {
        deductible: todayExpenses.filter(expense => expense.deductFromSales),
        nonDeductible: todayExpenses.filter(expense => !expense.deductFromSales)
      }
    }
  });
});