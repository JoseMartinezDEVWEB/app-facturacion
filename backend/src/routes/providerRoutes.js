// routes/providerRoutes.js
import express from 'express';
import {
  createProvider,
  getProviders,
  getProviderById,
  updateProvider,
  getProviderProducts,
  addProductToProvider,
  deleteProvider
} from '../controllers/providerController.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Rutas para proveedores
router.route('/')
  .post(createProvider)
  .get(getProviders);

router.route('/:id')
  .get(getProviderById)
  .put(updateProvider)
  .delete(deleteProvider);

router.route('/:id/products')
  .get(getProviderProducts);

router.route('/:id/products')
  .post(addProductToProvider);

export default router;