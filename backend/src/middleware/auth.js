import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { asyncHandler } from './asyncHandler.js';

/**
 * Middleware de protección de rutas - Verifica el token JWT
 * @mode DESARROLLO - Incluye opciones para desarrollo/producción
 */
export const protect = asyncHandler(async (req, res, next) => {
  // MODO DESARROLLO - Descomentar para desarrollo, comentar para producción
  const DEV_MODE = true; // Cambiar a false en producción
  
  if (DEV_MODE) {
    console.log('⚠️ ADVERTENCIA: Modo desarrollo activado - autenticación simplificada');
    req.user = { 
      _id: '123456789012345678901234', 
      id: '123456789012345678901234', // Incluir ambas versiones para compatibilidad
      userId: '123456789012345678901234', // Incluir ambas versiones para compatibilidad
      role: 'admin',
      nombre: 'Usuario Desarrollo',
      email: 'desarrollo@ejemplo.com'
    };
    return next();
  }
  
  // CÓDIGO PARA PRODUCCIÓN
  let token;
  
  // Verificar si hay token en los headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtener el token del header
      token = req.headers.authorization.split(' ')[1];
      
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decodificado:', decoded);
      
      // Buscar el usuario con id o userId (compatibilidad con ambos formatos)
      const userId = decoded.id || decoded.userId;
      
      if (!userId) {
        console.error('Token no contiene ID de usuario válido:', decoded);
        res.status(401);
        throw new Error('Token inválido: no contiene ID de usuario');
      }
      
      // Buscar el usuario
      const user = await User.findById(userId).select('-password');
      
      if (!user) {
        console.error('Usuario no encontrado con ID:', userId);
        res.status(401);
        throw new Error('Usuario no encontrado');
      }
      
      // Establecer el usuario en la solicitud con TODOS los formatos para compatibilidad
      req.user = user;
      req.user.id = user._id; // Asegurar que id esté disponible
      req.user.userId = user._id; // Asegurar que userId esté disponible
      
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

/**
 * Middleware para verificar roles de usuario
 * @param {string[]} roles - Roles permitidos
 * @returns {function} Middleware
 */
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

/**
 * Genera un token JWT para un usuario
 * @param {string} id - ID del usuario
 * @returns {string} Token JWT
 */
export const generateToken = (id) => {
  // Usar un objeto con AMBOS formatos para máxima compatibilidad
  return jwt.sign({ 
    id, // Formato usado en authmiddle.js
    userId: id // Formato usado en auth.js y authmiddleware.js
  }, process.env.JWT_SECRET, {
    expiresIn: '30d' // Token expira en 30 días
  });
};

// Exportación por defecto para compatibilidad con importaciones existentes
export default protect;