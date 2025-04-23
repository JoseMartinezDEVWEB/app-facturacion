import express from 'express';
import { 
  getExpenses, 
  getExpense, 
  createExpense, 
  updateExpense, 
  deleteExpense, 
  getExpenseSummary,
  getMonthlyExpenses
} from '../controllers/expenseController.js';

// Corregir importación de middleware
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js'; 

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authMiddleware);

// IMPORTANTE: La ruta /summary debe ir ANTES de /:id 
router.get('/summary', getExpenseSummary);

router.route('/')
  .get(getExpenses)
  .post(createExpense);

router.route('/:id')
  .get(getExpense)
  .put(updateExpense)
  .delete(deleteExpense);

router.route('/monthly')
  .get(getMonthlyExpenses);

export default router;