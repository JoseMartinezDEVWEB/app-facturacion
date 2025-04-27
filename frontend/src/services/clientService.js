import api from '../config/apis';
import { API_ROUTES } from '../config/config';

// Use full backend URL for clients
const API_URL = API_ROUTES.CLIENTES;

/**
 * Obtiene todos los clientes con filtros opcionales
 * @param {Object} filters - Filtros opcionales para la búsqueda
 * @returns {Promise<Array>} Lista de clientes
 */
export const getClients = async (filters = {}) => {
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
    throw error.response?.data || { message: 'Error al obtener los clientes' };
  }
};

/**
 * Obtiene un cliente por su ID
 * @param {string} id - ID del cliente
 * @returns {Promise<Object>} Datos del cliente
 */
export const getClientById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el cliente' };
  }
};

/**
 * Crea un nuevo cliente
 * @param {Object} clientData - Datos del cliente
 * @returns {Promise<Object>} Cliente creado
 */
export const createClient = async (clientData) => {
  try {
    const response = await api.post(API_URL, clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear el cliente' };
  }
};

/**
 * Actualiza un cliente existente
 * @param {string} id - ID del cliente
 * @param {Object} clientData - Datos actualizados
 * @returns {Promise<Object>} Cliente actualizado
 */
export const updateClient = async (id, clientData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, clientData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el cliente' };
  }
};

/**
 * Elimina un cliente
 * @param {string} id - ID del cliente
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteClient = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar el cliente' };
  }
};

/**
 * Obtiene el historial de compras de un cliente
 * @param {string} id - ID del cliente
 * @returns {Promise<Array>} Historial de compras
 */
export const getClientPurchaseHistory = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/purchases`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el historial de compras' };
  }
};

/**
 * Obtiene el estado de cuenta del cliente
 * @param {string} id - ID del cliente
 * @returns {Promise<Object>} Estado de cuenta
 */
export const getClientAccountStatus = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/account-status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el estado de cuenta' };
  }
}; 