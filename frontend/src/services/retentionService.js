import axios from 'axios';
import { getAuthConfig } from './authService';

const API_URL = '/api/retentions';

/**
 * Obtiene todas las retenciones con filtros opcionales
 * @param {Object} filters - Filtros opcionales para la búsqueda
 * @returns {Promise<Object>} Objeto con datos y metadatos de paginación
 */
export const getRetentions = async (filters = {}) => {
  try {
    // Construir parámetros de consulta para filtros
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_URL}?${queryParams.toString()}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener las retenciones' };
  }
};

/**
 * Obtiene una retención por su ID
 * @param {string} id - ID de la retención
 * @returns {Promise<Object>} Datos de la retención
 */
export const getRetentionById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener la retención' };
  }
};

/**
 * Obtiene todas las retenciones asociadas a una factura
 * @param {string} invoiceId - ID de la factura
 * @returns {Promise<Array>} Array de retenciones
 */
export const getRetentionsByInvoice = async (invoiceId) => {
  try {
    const response = await axios.get(`${API_URL}/invoice/${invoiceId}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener las retenciones de la factura' };
  }
};

/**
 * Crea una nueva retención
 * @param {Object} retentionData - Datos de la retención a crear
 * @returns {Promise<Object>} Retención creada
 */
export const createRetention = async (retentionData) => {
  try {
    const response = await axios.post(API_URL, retentionData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear la retención' };
  }
};

/**
 * Actualiza una retención existente
 * @param {string} id - ID de la retención
 * @param {Object} retentionData - Datos actualizados
 * @returns {Promise<Object>} Retención actualizada
 */
export const updateRetention = async (id, retentionData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, retentionData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar la retención' };
  }
};

/**
 * Elimina una retención
 * @param {string} id - ID de la retención
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteRetention = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar la retención' };
  }
};

/**
 * Procesa fiscalmente una retención
 * @param {string} id - ID de la retención
 * @returns {Promise<Object>} Retención procesada
 */
export const processRetention = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/process`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al procesar la retención' };
  }
};

/**
 * Cancela una retención
 * @param {string} id - ID de la retención
 * @param {string} reason - Motivo de la cancelación
 * @returns {Promise<Object>} Retención cancelada
 */
export const cancelRetention = async (id, reason) => {
  try {
    const response = await axios.post(
      `${API_URL}/${id}/cancel`, 
      { reason }, 
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al anular la retención' };
  }
};

/**
 * Genera el PDF de una retención
 * @param {string} id - ID de la retención
 * @returns {Promise<string>} URL del PDF generado
 */
export const generateRetentionPDF = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/pdf`, {
      ...getAuthConfig(),
      responseType: 'blob'
    });
    
    // Crear URL para el blob y abrir en nueva ventana
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    return url;
  } catch (error) {
    throw error.response?.data || { message: 'Error al generar el PDF de la retención' };
  }
}; 