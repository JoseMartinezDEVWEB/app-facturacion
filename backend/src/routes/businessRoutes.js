import express from 'express';
import { createBusiness, getBusinesses } from '../controllers/businessController.js';
import { authMiddleware, checkRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', 
    authMiddleware, 
    checkRole(['admin', 'encargado']), 
    createBusiness
);

router.get('/', 
    authMiddleware, 
    checkRole(['admin', 'encargado', 'cajero']), 
    getBusinesses
);

export default router;