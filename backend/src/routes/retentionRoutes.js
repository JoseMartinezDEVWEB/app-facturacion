import express from 'express';
import { authMiddleware } from '../middleware/authmiddleware.js';
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

// Aplicar el middleware de autenticación a todas las rutas
// Si necesitas proteger rutas específicas de forma diferente, puedes aplicarlo individualmente
router.use(authMiddleware);

// Rutas (ya no necesitan el middleware individual si se usa router.use)
router.route('/')
  .get(getRetentions)
  .post(createRetention);

router.route('/:id')
  .get(getRetentionById)
  .put(updateRetention)
  .delete(deleteRetention);

// Rutas para procesar retenciones
router.route('/:id/process')
  .post(processRetention);

router.route('/:id/cancel')
  .post(cancelRetention);

// Ruta para obtener retenciones por factura
router.route('/invoice/:invoiceId')
  .get(getRetentionsByInvoice);

// Ruta para generar PDF
router.route('/:id/pdf')
  .get(generateRetentionPdf);

export default router; 