import express from 'express';
import { 
  createSupplier, 
  getSuppliers, 
  getSupplierById, 
  updateSupplier, 
  deleteSupplier,
  addDocumentToSupplier,
  deleteDocument,
  rateSupplier,
  getSupplierCategories,
  getSupplierTypes
} from '../controllers/supplierController.js';
import { authMiddleware, checkRole } from '../middleware/authmiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configurar multer para guardar documentos de proveedores
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadDir = path.join(path.resolve(), 'backend/src/uploads/suppliers');
    
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'supplier-doc-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  fileFilter: function(req, file, cb) {
    // Permitir documentos PDF, imágenes y archivos de Office comunes
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    
    cb(new Error('Solo se permiten archivos de tipo: PDF, imágenes y documentos Office'));
  }
});

// Rutas CRUD básicas
router.post('/', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  upload.array('documents', 5), // Permitir hasta 5 documentos
  createSupplier
);

router.get('/', 
  authMiddleware, 
  getSuppliers
);

router.get('/categories', 
  authMiddleware, 
  getSupplierCategories
);

router.get('/types', 
  authMiddleware, 
  getSupplierTypes
);

router.get('/:id', 
  authMiddleware, 
  getSupplierById
);

router.put('/:id', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  upload.array('documents', 5),
  updateSupplier
);

router.delete('/:id', 
  authMiddleware, 
  checkRole(['admin']), 
  deleteSupplier
);

// Rutas para documentos
router.post('/:id/documents', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  upload.single('document'),
  addDocumentToSupplier
);

router.delete('/:id/documents/:docId', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  deleteDocument
);

// Ruta para calificaciones
router.post('/:id/rate', 
  authMiddleware, 
  rateSupplier
);

export default router; 