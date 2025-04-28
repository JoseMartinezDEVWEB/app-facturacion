import api from '../config/apis';
import { API_ROUTES } from '../config/config';

// Base endpoint for products
const API_URL = API_ROUTES.PRODUCTS;

/**
 * Obtiene todos los productos con filtros opcionales
 * @param {Object} filters - Filtros opcionales para la búsqueda
 * @returns {Promise<Array>} Lista de productos
 */
export const getProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value);
      }
    });
    const response = await api.get(`${API_URL}?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener los productos' };
  }
};

/**
 * Obtiene un producto por su ID
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Datos del producto
 */
export const getProductById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el producto' };
  }
};

/**
 * Crea un nuevo producto
 * @param {Object} productData - Datos del producto
 * @returns {Promise<Object>} Producto creado
 */
export const createProduct = async (productData) => {
  try {
    const response = await api.post(API_URL, productData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear el producto' };
  }
};

/**
 * Actualiza un producto existente
 * @param {string} id - ID del producto
 * @param {Object} productData - Datos actualizados
 * @returns {Promise<Object>} Producto actualizado
 */
export const updateProduct = async (id, productData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, productData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el producto' };
  }
};

/**
 * Elimina un producto
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteProduct = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar el producto' };
  }
};

/**
 * Actualiza el stock de un producto
 * @param {string} id - ID del producto
 * @param {number} quantity - Cantidad a agregar (positivo) o restar (negativo)
 * @returns {Promise<Object>} Producto con stock actualizado
 */
export const updateProductStock = async (id, quantity) => {
  try {
    const response = await api.post(
      `${API_URL}/${id}/stock`,
      { quantity }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el stock' };
  }
};

/**
 * Obtiene el historial de movimientos de un producto
 * @param {string} id - ID del producto
 * @returns {Promise<Array>} Historial de movimientos
 */
export const getProductMovements = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/movements`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el historial de movimientos' };
  }
};

/**
 * Obtiene las estadísticas de un producto
 * @param {string} id - ID del producto
 * @returns {Promise<Object>} Estadísticas del producto
 */
export const getProductStats = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/stats`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener las estadísticas' };
  }
}; 