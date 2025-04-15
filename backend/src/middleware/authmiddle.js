import jwt from 'jsonwebtoken';
import {User} from '../models/User.js'; 
import { asyncHandler } from './asyncHandler.js';

// Middleware para proteger rutas
export const protect = asyncHandler(async (req, res, next) => {
  let token;
  
  // Verificar si hay token en los headers
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(' ')[1];
      
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar el usuario y agregarlo a la solicitud (excluyendo la contraseña)
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        res.status(401);
        throw new Error('Usuario no encontrado');
      }
      
      next();
    } catch (error) {
      console.error('Error en la autenticación:', error.message);
      res.status(401);
      throw new Error('No autorizado, token inválido o expirado');
    }
  } else {
    res.status(401);
    throw new Error('No autorizado, no hay token de acceso');
  }
});

// Middleware para verificar roles de usuario
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('No autorizado, usuario no encontrado');
    }
    
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`Rol ${req.user.role} no tiene permiso para esta acción`);
    }
    
    next();
  };
};

// Genera un token JWT para un usuario
export const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expira en 30 días
  });
};