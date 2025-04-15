// routes/productoRoutes.js
import express from 'express';
import {
  createProducto,
  getProductos,
  getProductoById,
  updateProducto,
  deleteProducto,
  getProductosByProveedor,
  getProductosBajoStock
} from '../controllers/productoController.js';

const router = express.Router();

router.route('/')
  .post(createProducto)
  .get(getProductos);

router.route('/bajo-stock')
  .get(getProductosBajoStock);

router.route('/proveedor/:id')
  .get(getProductosByProveedor);

router.route('/:id')
  .get(getProductoById)
  .put(updateProducto)
  .delete(deleteProducto);

export default router;