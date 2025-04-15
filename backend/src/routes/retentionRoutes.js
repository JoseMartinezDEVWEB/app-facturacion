import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  createRetention,
  getRetentions,
  getRetentionById,
  updateRetention,
  deleteRetention,
  processRetention,
  cancelRetention,
  getRetentionsByInvoice,
  generateRetentionPdf
} from '../controllers/retentionController.js';

const router = express.Router();

// Rutas públicas
router.route('/')
  .get(protect, getRetentions)
  .post(protect, createRetention);

router.route('/:id')
  .get(protect, getRetentionById)
  .put(protect, updateRetention)
  .delete(protect, deleteRetention);

// Rutas para procesar retenciones
router.route('/:id/process')
  .post(protect, processRetention);

router.route('/:id/cancel')
  .post(protect, cancelRetention);

// Ruta para obtener retenciones por factura
router.route('/invoice/:invoiceId')
  .get(protect, getRetentionsByInvoice);

// Ruta para generar PDF
router.route('/:id/pdf')
  .get(protect, generateRetentionPdf);

export default router; 