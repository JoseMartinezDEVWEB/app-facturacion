import express from 'express';
import {
    createQuote,
    getQuote,
    getQuotes,
    updateQuoteStatus,
    convertToInvoice
} from '../controllers/quoteController.js';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';

const router = express.Router();

// Listar todas las cotizaciones con filtros
router.get('/',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    getQuotes
);

// Obtener una cotización específica
router.get('/:id',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    getQuote
);

// Crear una nueva cotización
router.post('/',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    createQuote
);

// Actualizar estado de una cotización
router.patch('/:id/status',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    updateQuoteStatus
);

// Convertir cotización a factura
router.post('/:id/convert',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    convertToInvoice
);

export default router; 