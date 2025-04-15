import express from 'express';
import { 
  getPendingPayments, 
  markProductAsPaid, 
  markMultipleAsPaid,
  getCreditPaymentStats 
} from '../controllers/creditPaymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Proteger todas las rutas
router.use(protect);

// Rutas para administradores y encargados
router.use(restrictTo('admin', 'encargado'));

// Obtener pagos pendientes
router.get('/', getPendingPayments);

// Obtener estadísticas de pagos
router.get('/stats', getCreditPaymentStats);

// Marcar producto como pagado
router.patch('/:productId/paid', markProductAsPaid);

// Marcar múltiples productos como pagados
router.patch('/mark-paid', markMultipleAsPaid);

export default router;