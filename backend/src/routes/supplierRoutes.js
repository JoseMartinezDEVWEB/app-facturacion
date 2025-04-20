import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  getSuppliers, 
  createSupplier, 
  searchSuppliers, 
  getSupplierStats, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier,
  getSupplierTransactions,
  createSupplierTransaction
} from '../controllers/supplierController.js';

const router = express.Router();

/**
 * Rutas para gestión de proveedores
 */

// Ruta base: /api/suppliers

// Obtener todos los proveedores y crear uno nuevo
router.route('/')
  .get(protect, getSuppliers)
  .post(protect, createSupplier);

// Búsqueda de proveedores (debe ir antes de la ruta con parámetro)
router.get('/search', protect, searchSuppliers);

// Estadísticas de proveedores
router.get('/stats', protect, getSupplierStats);

// Obtener, actualizar o eliminar un proveedor específico
router.route('/:id')
  .get(protect, getSupplierById)
  .put(protect, updateSupplier)
  .delete(protect, deleteSupplier);

// Rutas para transacciones (pagos y deudas)
router.route('/:id/transactions')
  .get(protect, getSupplierTransactions)
  .post(protect, createSupplierTransaction);

export default router; 