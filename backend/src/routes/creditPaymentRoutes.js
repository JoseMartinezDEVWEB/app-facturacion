import express from 'express';
import { 
  getPendingPayments, 
  markProductAsPaid, 
  markMultipleAsPaid,
  getCreditPaymentStats 
} from '../controllers/creditPaymentController.js';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';

const router = express.Router();

// Proteger todas las rutas (requiere autenticación)
router.use(authMiddleware);

// Restringir todas las rutas a roles específicos
router.use(checkRole(['admin', 'encargado']));

// Obtener pagos pendientes
router.get('/', getPendingPayments);

// Obtener estadísticas de pagos
router.get('/stats', getCreditPaymentStats);

// Marcar producto como pagado
router.patch('/:productId/paid', markProductAsPaid);

// Marcar múltiples productos como pagados
router.patch('/mark-paid', markMultipleAsPaid);

export default router;