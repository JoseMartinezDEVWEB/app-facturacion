import express from 'express';
import multer from 'multer';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';
import { createProduct, updateProduct, deleteProduct, getProducts, getProductById } from '../controllers/productController.js';

const router = express.Router();

// Configuración de Multer para manejo de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

//const upload = multer({ storage: storage });

// Filtro de archivos
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no válido. Solo se permiten imágenes (jpeg, png, gif)'), false);
    }
  };
  
  const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024 // 5MB límite
    }
  });
  
  // Manejo de errores de multer
  const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        message: 'Error al subir el archivo',
        error: err.message
      });
    }
    next(err);
  };

// Rutas protegidas que requieren rol de admin o encargado
router.post(
  '/',
  authMiddleware,
  checkRole(['admin', 'encargado']),
  upload.single('image'),
  handleMulterError,
  createProduct
);

router.put(
  '/:id',
  authMiddleware,
  checkRole(['admin', 'encargado']),
  upload.single('image'),
  updateProduct
);

router.delete(
  '/:id',
  authMiddleware,
  checkRole(['admin', 'encargado']),
  deleteProduct
);

// Rutas públicas (accesibles para todos los usuarios autenticados)
router.get('/', authMiddleware, getProducts);
router.get('/:id', authMiddleware, getProductById);

export default router;