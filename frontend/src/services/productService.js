import axios from 'axios';
import { getAuthConfig } from './authService';

const API_URL = '/products';

/**
 * Obtiene todos los productos con filtros opcionales
 * @param {Object} filters - Filtros opcionales para la búsqueda
 * @returns {Promise<Array>} Lista de productos
 */
export const getProducts = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_URL}?${params.toString()}`, getAuthConfig());
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
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
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
    const response = await axios.post(API_URL, productData, getAuthConfig());
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
    const response = await axios.put(`${API_URL}/${id}`, productData, getAuthConfig());
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
    const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
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
    const response = await axios.post(
      `${API_URL}/${id}/stock`,
      { quantity },
      getAuthConfig()
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
    const response = await axios.get(`${API_URL}/${id}/movements`, getAuthConfig());
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
    const response = await axios.get(`${API_URL}/${id}/stats`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener las estadísticas' };
  }
}; 