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

// CAMBIAR: Importar del nuevo archivo consolidado
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// IMPORTANTE: La ruta /summary debe ir ANTES de /:id 
router.get('/summary', protect, getExpenseSummary);

router.route('/')
  .get(protect, getExpenses)
  .post(protect, createExpense);

router.route('/:id')
  .get(protect, getExpense)
  .put(protect, updateExpense)
  .delete(protect, deleteExpense);

router.route('/monthly')
  .get(protect, getMonthlyExpenses);

export default router;