// routes/purchaseOrderRoutes.js
import express from 'express';
import {
  createPurchaseOrder,
  getPurchaseOrders,
  getPurchaseOrderById,
  updatePurchaseOrderStatus,
  addPaymentToPurchaseOrder,
  getPurchaseOrdersByProvider,
  getPendingPurchaseOrders,
  deletePurchaseOrder
} from '../controllers/purchaseOrderController.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas principales
router.route('/')
  .post(createPurchaseOrder)
  .get(getPurchaseOrders);

// Rutas especiales
router.get('/pending', getPendingPurchaseOrders);
router.get('/provider/:id', getPurchaseOrdersByProvider);

// Rutas con parámetros
router.route('/:id')
  .get(getPurchaseOrderById)
  .delete(deletePurchaseOrder);

router.put('/:id/status', updatePurchaseOrderStatus);
router.post('/:id/payments', addPaymentToPurchaseOrder);

export default router;