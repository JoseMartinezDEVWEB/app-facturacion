
import express from 'express';
import { login, createUser, getUsers, createInitialAdmin, getUserInfo } from '../controllers/userController.js';
import {authMiddleware, checkRole} from '../middleware/authmiddleware.js';
import auth from '../middleware/auth.js';


const router = express.Router();

// Auth routes
router.post('/login', login);

// User routes (protected)
router.post(
  '/users', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  createUser
);

router.get(
  '/users', 
  authMiddleware, 
  checkRole(['admin', 'encargado']), 
  getUsers
);

router.get('/info', auth, getUserInfo);
router.get('/users/info', authMiddleware, getUserInfo);

// Ruta para crear el admin inicial (sin autenticación)
router.post('/register-admin', createInitialAdmin);

export default router;