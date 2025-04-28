import api from '../config/apis';
import { API_BASE_URL, API_ROUTES } from '../config/config';

// Base endpoint for quotes
const API_URL = `${API_BASE_URL}${API_ROUTES.QUOTES}`;

/**
 * Obtiene todas las cotizaciones con filtros opcionales
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} - Datos de cotizaciones y metadatos
 */
export const getQuotes = async (filters = {}) => {
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
    console.error('Error en getQuotes:', error);
    throw error.response?.data || { message: 'Error al obtener cotizaciones' };
  }
};

/**
 * Obtiene una cotización por su ID
 * @param {string} id - ID de la cotización
 * @returns {Promise<Object>} - Datos de la cotización
 */
export const getQuoteById = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error en getQuoteById:', error);
    throw error.response?.data || { message: 'Error al obtener la cotización' };
  }
};

/**
 * Crea una nueva cotización
 * @param {Object} quoteData - Datos de la cotización
 * @returns {Promise<Object>} - Cotización creada
 */
export const createQuote = async (quoteData) => {
  try {
    const response = await api.post(API_URL, quoteData);
    return response.data;
  } catch (error) {
    console.error('Error en createQuote:', error);
    throw error.response?.data || { message: 'Error al crear la cotización' };
  }
};

/**
 * Actualiza una cotización existente
 * @param {string} id - ID de la cotización
 * @param {Object} quoteData - Datos a actualizar
 * @returns {Promise<Object>} - Cotización actualizada
 */
export const updateQuote = async (id, quoteData) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, quoteData);
    return response.data;
  } catch (error) {
    console.error('Error en updateQuote:', error);
    throw error.response?.data || { message: 'Error al actualizar la cotización' };
  }
};

/**
 * Aprueba una cotización
 * @param {string} id - ID de la cotización
 * @returns {Promise<Object>} - Cotización aprobada
 */
export const approveQuote = async (id) => {
  try {
    const response = await api.post(`${API_URL}/${id}/approve`, {});
    return response.data;
  } catch (error) {
    console.error('Error en approveQuote:', error);
    throw error.response?.data || { message: 'Error al aprobar la cotización' };
  }
};

/**
 * Rechaza una cotización
 * @param {string} id - ID de la cotización
 * @param {Object} data - Datos del rechazo (razón)
 * @returns {Promise<Object>} - Cotización rechazada
 */
export const rejectQuote = async (id, data) => {
  try {
    const response = await api.post(`${API_URL}/${id}/reject`, data);
    return response.data;
  } catch (error) {
    console.error('Error en rejectQuote:', error);
    throw error.response?.data || { message: 'Error al rechazar la cotización' };
  }
};

/**
 * Convierte una cotización en factura
 * @param {string} id - ID de la cotización
 * @returns {Promise<Object>} - Datos de la operación
 */
export const convertToInvoice = async (id) => {
  try {
    const response = await api.post(`${API_URL}/${id}/convert-to-invoice`, {});
    return response.data;
  } catch (error) {
    console.error('Error en convertToInvoice:', error);
    throw error.response?.data || { message: 'Error al convertir a factura' };
  }
};

/**
 * Genera un PDF de la cotización
 * @param {string} id - ID de la cotización
 * @returns {Promise<Blob>} - Blob del PDF
 */
export const generateQuotePDF = async (id) => {
  try {
    const response = await api.get(`${API_URL}/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error en generateQuotePDF:', error);
    throw error.response?.data || { message: 'Error al generar el PDF' };
  }
};

/**
 * Elimina una cotización (solo borradores)
 * @param {string} id - ID de la cotización
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const deleteQuote = async (id) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error en deleteQuote:', error);
    throw error.response?.data || { message: 'Error al eliminar la cotización' };
  }
}; 