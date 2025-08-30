import jwt from 'jsonwebtoken';

/**
 * Middleware para verificar token JWT
 * @param {Object} req - Objeto de petición
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función para continuar
 */
export const verifyToken = (req, res, next) => {
  // Obtener el token del encabezado
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'No hay token, autorización denegada'
    });
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Añadir el usuario decodificado a la petición
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Error verificando token:', error);
    return res.status(401).json({
      status: 'error',
      message: 'Token no válido'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {Array} roles - Array de roles permitidos
 * @returns {Function} Middleware
 */
export const checkRole = (roles) => {
  return (req, res, next) => {
    // Primero verificar si hay usuario (debe usarse después de verifyToken)
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'No hay usuario autenticado'
      });
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para esta acción'
      });
    }

    // Si tiene el rol adecuado, continuar
    next();
  };
}; 