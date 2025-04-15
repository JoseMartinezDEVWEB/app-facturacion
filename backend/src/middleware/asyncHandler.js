/**
 * Middleware para manejar excepciones en los controladores asíncronos
 * Esto evita tener que usar try/catch en cada controlador
 * @param {Function} fn - Función controladora asíncrona
 * @returns {Function} Middleware con manejo de errores
 */
export const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
  
  /**
   * Middleware para manejar errores globales
   * Debe colocarse después de todas las rutas en tu archivo server.js
   */
  export const errorHandler = (err, req, res, next) => {
    // Si el status code ya está definido, usarlo; de lo contrario, usar 500
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    
    console.error(`Error: ${err.message}`);
    console.error(err.stack);
    
    res.status(statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack
    });
  };