// routes/clienteRoutes.js
import express from 'express';
import { 
  getClientesStats, 
  searchClientes, 
  createCliente, 
  getClienteById,
  getClientesDeuda,    // Nueva función
  saldarDeuda,         // Nueva función
  abonarDeuda          // Nueva función
} from '../controllers/clienteController.js';
import { authMiddleware } from '../middleware/authmiddleware.js';

const router = express.Router();

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Rutas para estadísticas y búsqueda
router.get('/stats', getClientesStats);
router.get('/search', searchClientes);

// Nuevas rutas para gestión de deudas
router.get('/deudas', getClientesDeuda);
router.post('/saldar-deuda', saldarDeuda);
router.post('/abonar-deuda', abonarDeuda);

// Rutas CRUD
router.post('/', createCliente);
router.get('/:id', getClienteById);

export default router;