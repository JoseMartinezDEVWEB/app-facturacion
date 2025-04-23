import express from 'express';
import { authMiddleware } from '../middleware/authmiddleware.js';
import { createInvoice, getInvoices, getInvoiceById } from '../controllers/newInvoiceController.js';

const router = express.Router();

// Añadir un middleware para verificar y registrar el usuario en cada petición
router.use((req, res, next) => {
  console.log('Middleware de ruta newInvoices: usuario antes de authMiddleware:', req.user); 
  next();
});

router.use(authMiddleware);

// Otro middleware después de la autenticación para verificar que se haya añadido el usuario
router.use((req, res, next) => {
  console.log('Middleware de ruta newInvoices: usuario después de authMiddleware:', req.user?.id, req.user?.role);
  if (!req.user) {
    console.warn('ADVERTENCIA: Usuario no disponible después de authMiddleware en newInvoices.js');
  }
  next();
});

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

export default router;