import axios from 'axios';
import { getAuthConfig } from './authService';
import { API_ROUTES } from '../config/config';

const API_URL = API_ROUTES.QUOTES;

/**
 * Obtiene todas las cotizaciones con filtros opcionales
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} - Datos de cotizaciones y metadatos
 */
export const getQuotes = async (filters = {}) => {
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
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
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
    const response = await axios.post(API_URL, quoteData, getAuthConfig());
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
    const response = await axios.put(`${API_URL}/${id}`, quoteData, getAuthConfig());
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
    const response = await axios.post(`${API_URL}/${id}/approve`, {}, getAuthConfig());
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
    const response = await axios.post(`${API_URL}/${id}/reject`, data, getAuthConfig());
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
    const response = await axios.post(`${API_URL}/${id}/convert-to-invoice`, {}, getAuthConfig());
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
    const response = await axios.get(`${API_URL}/${id}/pdf`, {
      ...getAuthConfig(),
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
    const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en deleteQuote:', error);
    throw error.response?.data || { message: 'Error al eliminar la cotización' };
  }
}; 