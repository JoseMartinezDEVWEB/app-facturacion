/**
 * Formatea una fecha en formato legible
 * @param {string|Date} date - Fecha a formatear
 * @param {object} options - Opciones de formato
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Fecha inválida';
    
    return dateObj.toLocaleDateString('es-ES', defaultOptions);
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error en formato';
  }
};

/**
 * Formatea un valor como moneda
 * @param {number} value - Valor a formatear
 * @param {string} currency - Código de moneda (USD, EUR, etc.)
 * @param {string} locale - Configuración regional
 * @returns {string} Valor formateado como moneda
 */
export const formatCurrency = (value, currency = 'USD', locale = 'es-ES') => {
  if (value === null || value === undefined) return 'N/A';
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  } catch (error) {
    console.error('Error al formatear moneda:', error);
    return `${value}`;
  }
};

/**
 * Formatea un número con separadores de miles
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Número de decimales
 * @param {string} locale - Configuración regional
 * @returns {string} Número formateado
 */
export const formatNumber = (value, decimals = 2, locale = 'es-ES') => {
  if (value === null || value === undefined) return 'N/A';
  
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  } catch (error) {
    console.error('Error al formatear número:', error);
    return `${value}`;
  }
};

/**
 * Trunca un texto a una longitud máxima
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Convierte la primera letra de cada palabra a mayúscula
 * @param {string} text - Texto a convertir
 * @returns {string} Texto con primera letra en mayúscula
 */
export const toTitleCase = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}; 