// Añade estos endpoints a tu servidor para pruebas
// Importar express y crear un router
import express from 'express';
const router = express.Router();

// Endpoint de prueba para obtener gastos (sin autenticación)
router.get('/expenses', (req, res) => {
  // Datos de prueba
  const mockExpenses = [
    {
      _id: '1',
      name: 'Compra de suministros',
      description: 'Material de oficina',
      amount: 150.50,
      category: 'Material',
      paymentMethod: 'Efectivo',
      deductFromSales: true,
      date: new Date(),
      user: '123'
    },
    {
      _id: '2',
      name: 'Pago de internet',
      description: 'Servicio mensual',
      amount: 75.00,
      category: 'Servicio',
      paymentMethod: 'Transferencia',
      deductFromSales: false,
      date: new Date(),
      user: '123'
    }
  ];
  
  res.status(200).json({
    success: true,
    count: mockExpenses.length,
    data: mockExpenses
  });
});

// Endpoint de prueba para el resumen de gastos (sin autenticación)
router.get('/expenses/summary', (req, res) => {
  // Datos de prueba
  const mockSummary = {
    date: new Date(),
    totalExpenses: 225.50,
    totalDeductibleExpenses: 150.50,
    totalNonDeductibleExpenses: 75.00,
    totalSales: 500.00,
    balance: 349.50,
    expensesDetail: {
      deductible: [],
      nonDeductible: []
    }
  };
  
  res.status(200).json({
    success: true,
    data: mockSummary
  });
});

// Exportar el router
export default router;

// En tu archivo server.js o app.js principal, añade:
// import mockRouter from './routes/mockRoutes.js';
// app.use('/api', mockRouter);