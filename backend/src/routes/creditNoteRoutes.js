import express from 'express';
import {
    createCreditNote,
    getCreditNote,
    getCreditNotes,
    processFiscalCreditNote,
    cancelCreditNote
} from '../controllers/creditNoteController.js';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';

const router = express.Router();

// Listar todas las notas de crédito con filtros
router.get('/',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    getCreditNotes
);

// Obtener una nota de crédito específica
router.get('/:id',
    authMiddleware,
    checkRole(['admin', 'encargado', 'cajero']),
    getCreditNote
);

// Crear una nueva nota de crédito
router.post('/',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    createCreditNote
);

// Procesar una nota de crédito fiscal
router.post('/:id/process-fiscal',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    processFiscalCreditNote
);

// Cancelar una nota de crédito
router.post('/:id/cancel',
    authMiddleware,
    checkRole(['admin', 'encargado']),
    cancelCreditNote
);

export default router; 