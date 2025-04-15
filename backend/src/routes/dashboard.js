import express from 'express';
import { getDashboardData, getDetailedStats, getTopProducts, getDailySales } from '../controllers/dashboardController.js';
import {authMiddleware} from '../middleware/authmiddleware.js';

const router = express.Router();

// Protegemos las rutas con el middleware de autenticación
router.use(authMiddleware);

// Ruta para obtener datos del dashboard
router.get('/data', getDashboardData);

// Ruta para obtener estadísticas detalladas
router.get('/stats', getDetailedStats);

// NUEVA RUTA: Obtener productos más vendidos con paginación
router.get('/top-products', getTopProducts);


router.get('/daily-sales', getDailySales);
export default router;