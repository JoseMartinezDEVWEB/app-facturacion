import Expense from '../models/Expense.js';
import DailyBalance from '../models/DailyBalance.js';
import {asyncHandler} from '../middleware/asyncHandler.js';
import Sale from '../models/Sale.js';

// @desc    Obtener todos los gastos con opciones de filtrado
// @route   GET /api/expenses
// @access  Privado
export const getExpenses = asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    category, 
    paymentMethod, 
    minAmount, 
    maxAmount,
    deductFromSales,
    deductionPeriod
  } = req.query;
  
  let filter = {};
  
  // Filtrar por fecha
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  
  // Filtrar por categoría
  if (category) filter.category = category;
  
  // Filtrar por método de pago
  if (paymentMethod) filter.paymentMethod = paymentMethod;
  
  // Filtrar por monto
  if (minAmount || maxAmount) {
    filter.amount = {};
    if (minAmount) filter.amount.$gte = Number(minAmount);
    if (maxAmount) filter.amount.$lte = Number(maxAmount);
  }
  
  // Filtrar por descuento de ventas
  if (deductFromSales !== undefined) {
    filter.deductFromSales = deductFromSales === 'true';
  }
  
  // Filtrar por periodo de descuento
  if (deductionPeriod) {
    filter.deductionPeriod = deductionPeriod;
  }
  
  const expenses = await Expense.find(filter)
    .sort({ date: -1 })
    .populate('user', 'name');
    
  res.status(200).json({
    success: true,
    count: expenses.length,
    data: expenses
  });
});

// @desc    Obtener un gasto específico
// @route   GET /api/expenses/:id
// @access  Privado
export const getExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id).populate('user', 'name');
  
  if (!expense) {
    res.status(404);
    throw new Error('Gasto no encontrado');
  }
  
  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Crear un nuevo gasto
// @route   POST /api/expenses
// @access  Privado
export const createExpense = asyncHandler(async (req, res) => {
  // Verificar si req.user existe antes de acceder a _id
  if (!req.user) {
    res.status(401);
    throw new Error('No autorizado. Inicia sesión para realizar esta acción.');
  }
  
  // Añadir el usuario actual al gasto
  req.body.user = req.user._id;
  
  // Crear el gasto
  const expense = await Expense.create(req.body);
  
  // Si el gasto es descontable, actualizamos el balance según el periodo seleccionado
  if (expense.deductFromSales) {
    if (expense.deductionPeriod === 'day') {
      // Actualizar el balance del día
      await updateDailyBalance(new Date(expense.date));
    } else if (expense.deductionPeriod === 'month') {
      // Actualizar el balance del mes
      await updateMonthlyBalance(new Date(expense.date));
    }
  }
  
  res.status(201).json({
    success: true,
    data: expense
  });
});

// @desc    Actualizar un gasto
// @route   PUT /api/expenses/:id
// @access  Privado
export const updateExpense = asyncHandler(async (req, res) => {
  let expense = await Expense.findById(req.params.id);
  
  if (!expense) {
    res.status(404);
    throw new Error('Gasto no encontrado');
  }
  
  // Verificar si req.user existe antes de acceder a _id
  if (!req.user) {
    res.status(401);
    throw new Error('No autorizado. Inicia sesión para realizar esta acción.');
  }
  
  // Verificar que el usuario es dueño del gasto o es admin
  const isOwner = expense.user && expense.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('No autorizado para actualizar este gasto');
  }
  
  // Guardar información sobre si el gasto era descontable antes de la actualización
  const wasDeductible = expense.deductFromSales;
  const oldDeductionPeriod = expense.deductionPeriod;
  
  // Actualizar el gasto
  expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  // Actualizar balances si hay cambios en la configuración de descuento
  if (wasDeductible || expense.deductFromSales) {
    // Si era descontable del día antes, actualizar balance del día
    if (wasDeductible && oldDeductionPeriod === 'day') {
      await updateDailyBalance(new Date(expense.date));
    }
    
    // Si era descontable del mes antes, actualizar balance del mes
    if (wasDeductible && oldDeductionPeriod === 'month') {
      await updateMonthlyBalance(new Date(expense.date));
    }
    
    // Si es descontable del día ahora, actualizar balance del día
    if (expense.deductFromSales && expense.deductionPeriod === 'day') {
      await updateDailyBalance(new Date(expense.date));
    }
    
    // Si es descontable del mes ahora, actualizar balance del mes
    if (expense.deductFromSales && expense.deductionPeriod === 'month') {
      await updateMonthlyBalance(new Date(expense.date));
    }
  }
  
  res.status(200).json({
    success: true,
    data: expense
  });
});

// @desc    Eliminar un gasto
// @route   DELETE /api/expenses/:id
// @access  Privado
export const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);
  
  if (!expense) {
    res.status(404);
    throw new Error('Gasto no encontrado');
  }
  
  // Verificar si req.user existe antes de acceder a _id
  if (!req.user) {
    res.status(401);
    throw new Error('No autorizado. Inicia sesión para realizar esta acción.');
  }
  
  // Verificar que el usuario es dueño del gasto o es admin
  const isOwner = expense.user && expense.user.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';
  
  if (!isOwner && !isAdmin) {
    res.status(403);
    throw new Error('No autorizado para eliminar este gasto');
  }
  
  // Guardar información antes de eliminar
  const wasDeductible = expense.deductFromSales;
  const deductionPeriod = expense.deductionPeriod;
  const expenseDate = new Date(expense.date);
  
  // Eliminar el gasto
  await Expense.findByIdAndDelete(req.params.id);
  
  // Actualizar balances si era descontable
  if (wasDeductible) {
    if (deductionPeriod === 'day') {
      await updateDailyBalance(expenseDate);
    } else if (deductionPeriod === 'month') {
      await updateMonthlyBalance(expenseDate);
    }
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Obtener resumen de gastos (total diario)
// @route   GET /api/expenses/summary
// @access  Privado
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
  
  // Separar gastos descontables y no descontables
  const deductibleExpensesDay = todayExpenses.filter(expense => 
    expense.deductFromSales && expense.deductionPeriod === 'day');
  const deductibleExpensesMonth = todayExpenses.filter(expense => 
    expense.deductFromSales && expense.deductionPeriod === 'month');
  const nonDeductibleExpenses = todayExpenses.filter(expense => !expense.deductFromSales);
  
  // Calcular totales
  const totalExpenses = todayExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalDeductibleExpensesDay = deductibleExpensesDay.reduce((total, expense) => total + expense.amount, 0);
  const totalDeductibleExpensesMonth = deductibleExpensesMonth.reduce((total, expense) => total + expense.amount, 0);
  const totalDeductibleExpenses = totalDeductibleExpensesDay + totalDeductibleExpensesMonth;
  const totalNonDeductibleExpenses = nonDeductibleExpenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Obtener ventas de hoy sumando totalAmount de todas las ventas
  const todaySales = await Sale.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const totalSales = todaySales.reduce((total, sale) => total + sale.totalAmount, 0);
  
  // Calcular el balance neto (ventas - gastos descontables del día)
  const balance = totalSales - totalDeductibleExpensesDay;
  
  // Para una mejor visualización, obtener detalles de los gastos
  const expensesDetail = {
    deductibleDay: deductibleExpensesDay.map(expense => ({
      id: expense._id,
      name: expense.name,
      amount: expense.amount,
      category: expense.category
    })),
    deductibleMonth: deductibleExpensesMonth.map(expense => ({
      id: expense._id,
      name: expense.name,
      amount: expense.amount,
      category: expense.category
    })),
    nonDeductible: nonDeductibleExpenses.map(expense => ({
      id: expense._id,
      name: expense.name,
      amount: expense.amount,
      category: expense.category
    }))
  };
  
  res.status(200).json({
    success: true,
    data: {
      date: today,
      totalExpenses,
      totalDeductibleExpenses,
      totalDeductibleExpensesDay,
      totalDeductibleExpensesMonth,
      totalNonDeductibleExpenses,
      totalSales,
      balance,
      expensesDetail
    }
  });
});

// @desc    Obtener gastos mensuales
// @route   GET /api/expenses/monthly
// @access  Privado
export const getMonthlyExpenses = asyncHandler(async (req, res) => {
  // Obtener el mes actual
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Obtener todos los gastos del mes
  const monthlyExpenses = await Expense.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  // Calcular totales por categoría
  const deductibleExpensesDay = monthlyExpenses.filter(expense => 
    expense.deductFromSales && expense.deductionPeriod === 'day');
  const deductibleExpensesMonth = monthlyExpenses.filter(expense => 
    expense.deductFromSales && expense.deductionPeriod === 'month');
  
  const totalAmount = monthlyExpenses.reduce((total, expense) => total + expense.amount, 0);
  const totalDeductibleDay = deductibleExpensesDay.reduce((total, expense) => total + expense.amount, 0);
  const totalDeductibleMonth = deductibleExpensesMonth.reduce((total, expense) => total + expense.amount, 0);
  
  // Obtener ventas del mes
  const monthlySales = await Sale.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  const totalMonthlySales = monthlySales.reduce((total, sale) => total + (sale.totalAmount || 0), 0);
  
  // Calcular balance mensual (ventas - gastos descontables mensuales)
  const monthlyBalance = totalMonthlySales - totalDeductibleMonth;
  
  res.status(200).json({
    success: true,
    count: monthlyExpenses.length,
    totalAmount,
    totalDeductibleDay,
    totalDeductibleMonth,
    totalMonthlySales,
    monthlyBalance,
    data: monthlyExpenses
  });
});

// Funciones auxiliares para actualizar balances

// Actualizar balance diario
const updateDailyBalance = async (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  // Obtener gastos descontables del día
  const expenses = await Expense.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    },
    deductFromSales: true,
    deductionPeriod: 'day'
  });
  
  const totalDeductible = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Obtener ventas del día
  const sales = await Sale.find({
    date: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const totalSales = sales.reduce((total, sale) => total + (sale.totalAmount || 0), 0);
  
  // Calcular balance
  const balance = totalSales - totalDeductible;
  
  // Guardar en DailyBalance
  return await DailyBalance.findOneAndUpdate(
    { date: { $gte: startOfDay, $lte: endOfDay } },
    {
      date: startOfDay,
      totalSales,
      totalDeductibleExpenses: totalDeductible,
      balance,
      lastUpdated: new Date()
    },
    { upsert: true, new: true }
  );
};

// Actualizar balance mensual
const updateMonthlyBalance = async (date) => {
  const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  
  // Obtener gastos descontables del mes
  const expenses = await Expense.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    },
    deductFromSales: true,
    deductionPeriod: 'month'
  });
  
  const totalDeductible = expenses.reduce((total, expense) => total + expense.amount, 0);
  
  // Obtener ventas del mes
  const sales = await Sale.find({
    date: {
      $gte: startOfMonth,
      $lte: endOfMonth
    }
  });
  
  const totalSales = sales.reduce((total, sale) => total + (sale.totalAmount || 0), 0);
  
  // Calcular balance
  const balance = totalSales - totalDeductible;
  
  // Esta función guarda el balance mensual en MonthlyBalance
  // Como este modelo no existe aún, necesitamos crearlo después
  await updateOrCreateMonthlyBalance(startOfMonth, totalSales, totalDeductible, balance);
  
  return {
    date: startOfMonth,
    totalSales,
    totalDeductibleExpenses: totalDeductible,
    balance,
    lastUpdated: new Date()
  };
};

// Función temporal para actualizar o crear balance mensual
// Esta función se reemplazará cuando se cree el modelo MonthlyBalance
const updateOrCreateMonthlyBalance = async (date, totalSales, totalDeductible, balance) => {
  // Aquí irá la lógica para guardar en MonthlyBalance
  console.log('Balance mensual actualizado:', {
    date,
    totalSales,
    totalDeductible,
    balance
  });
  
  // Retornamos esto temporalmente
  return {
    date,
    totalSales,
    totalDeductible,
    balance,
    lastUpdated: new Date()
  };
};