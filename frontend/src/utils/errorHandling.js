// src/utils/errorHandling.js
/**
* Maneja errores de la API y devuelve un mensaje amigable
* @param {Error} error - El error capturado
* @returns {String} Mensaje de error para mostrar al usuario
*/
export const getErrorMessage = (error) => {
    if (!error) return 'Ocurrió un error inesperado';
    
    if (error.status === 401) {
      return 'Tu sesión ha expirado. Por favor, inicia sesión de nuevo.';
    }
    
    if (error.status === 403) {
      return 'No tienes permisos para realizar esta acción';
    }
    
    if (error.status === 404) {
      return 'No se encontró el recurso solicitado';
    }
    
    if (error.status === 500) {
      return 'Error en el servidor. Inténtalo más tarde';
    }
    
    if (error.message) {
      return error.message;
    }
    
    return 'Ocurrió un error al comunicarse con el servidor';
   };
   
   /**
   * Registra errores en la consola con información adicional
   * @param {String} context - Contexto donde ocurrió el error
   * @param {Error} error - El error capturado
   */
   export const logError = (context, error) => {
    console.error(`Error en ${context}:`, error);
    
    // Aquí se podría implementar lógica adicional como enviar a un servicio de registro de errores
   };
   
   /**
   * Maneja errores de autenticación
   * @param {Error} error - El error capturado
   * @returns {Boolean} - Verdadero si el error es de autenticación
   */
   export const handleAuthError = (error) => {
    if (error && (error.status === 401 || error.status === 403)) {
      // Limpiar token
      localStorage.removeItem('token');
      
      // Redireccionar a login después de un pequeño delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 500);
      
      return true;
    }
    
    return false;
   };
   
   /**
   * Formatea errores de validación de formularios
   * @param {Object} validationErrors - Objeto con errores de validación
   * @returns {Array} - Array de mensajes de error
   */
   export const formatValidationErrors = (validationErrors) => {
    if (!validationErrors) return [];
    
    const errors = [];
    
    for (const field in validationErrors) {
      if (Object.prototype.hasOwnProperty.call(validationErrors, field)) {
        errors.push(`${field}: ${validationErrors[field]}`);
      }
    }
    
    return errors;
   };