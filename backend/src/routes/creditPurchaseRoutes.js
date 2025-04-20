import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getCreditPurchases, 
  getCreditPurchaseById, 
  createCreditPurchase, 
  updateCreditPurchase, 
  deleteCreditPurchase, 
  addPayment,
  getCreditPurchaseStats
} from '../controllers/creditPurchaseController.js';

const router = express.Router();

/**
 * Rutas para gestión de compras a crédito
 */

// Ruta base: /api/credit-purchases

// Estadísticas de compras a crédito (debe ir antes de las rutas con parámetro)
router.get('/stats', protect, getCreditPurchaseStats);

// Obtener todas las compras a crédito y crear una nueva
router.route('/')
  .get(protect, getCreditPurchases)
  .post(protect, createCreditPurchase);

// Obtener, actualizar o eliminar una compra a crédito específica
router.route('/:id')
  .get(protect, getCreditPurchaseById)
  .put(protect, updateCreditPurchase)
  .delete(protect, deleteCreditPurchase);

// Registrar un pago para una compra a crédito
router.post('/:id/payments', protect, addPayment);

export default router; 