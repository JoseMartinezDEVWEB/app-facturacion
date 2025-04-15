import express from 'express';
import { 
    createInvoice, 
    getInvoice, 
    getInvoices,
    addPayment,
    cancelInvoice,
    processFiscalInvoice
} from '../controllers/invoiceController.js';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';

const router = express.Router();

// Ruta para listar todas las facturas con filtros (admin, encargado y cajero)
router.get('/', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']),
    getInvoices
);

// Obtener factura específica por ID
router.get('/:id', 
    authMiddleware, 
    checkRole(['admin', 'cajero', 'encargado']), 
    getInvoice
);

// Crear nueva factura
router.post('/', 
    authMiddleware, 
    checkRole(['admin', 'cajero', 'encargado']), 
    createInvoice
);

// Agregar pago a una factura existente
router.post('/:id/payment',
    authMiddleware,
    checkRole(['admin', 'cajero', 'encargado']),
    addPayment
);

// Cancelar una factura
router.post('/:id/cancel',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    cancelInvoice
);

// Procesar factura fiscal
router.post('/:id/process-fiscal',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    processFiscalInvoice
);

export default router;