import express from 'express';
import { protect as authMiddleware } from '../middleware/auth.js';
import { createInvoice, getInvoices, getInvoiceById } from '../controllers/newInvoiceController.js';

const router = express.Router();

// Añadir un middleware para verificar y registrar el usuario en cada petición
router.use((req, res, next) => {
  console.log('Middleware de ruta: usuario autenticado:', req.user);
  next();
});

router.use(authMiddleware);

// Otro middleware después de la autenticación para verificar que se haya añadido el usuario
router.use((req, res, next) => {
  console.log('Usuario después de autenticación:', req.user);
  if (!req.user) {
    console.warn('ADVERTENCIA: Usuario no disponible después de autenticación');
  }
  next();
});

router.post('/', createInvoice);
router.get('/', getInvoices);
router.get('/:id', getInvoiceById);

export default router;