import express from 'express';
import { createBusiness, getBusinesses, getBusinessInfo, saveBusinessInfo } from '../controllers/businessController.js';
import { authMiddleware, checkRole } from '../middleware/authMiddleware.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configurar multer para guardar los logos de negocios
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(path.resolve(), 'backend/src/uploads/business');
        
        // Crear directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'logo-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: function(req, file, cb) {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        
        if (mimetype && extname) {
            return cb(null, true);
        }
        
        cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
    }
});

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

// Nuevas rutas para la configuración del negocio
router.get('/info', getBusinessInfo);

router.post('/info', 
    upload.single('logo'), 
    saveBusinessInfo
);

export default router;