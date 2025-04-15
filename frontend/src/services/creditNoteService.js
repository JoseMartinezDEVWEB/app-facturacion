import axios from 'axios';
import { getAuthConfig } from './authService';
import { API_ROUTES } from '../config/config.js';

const API_URL = API_ROUTES.CREDIT_NOTES;

/**
 * Obtiene todas las notas de crédito con filtros opcionales
 * @param {Object} filters - Filtros opcionales
 * @returns {Promise<Object>} - Datos de notas de crédito y metadatos
 */
export const getCreditNotes = async (filters = {}) => {
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
    console.error('Error en getCreditNotes:', error);
    throw error.response?.data || { message: 'Error al obtener notas de crédito' };
  }
};

/**
 * Obtiene una nota de crédito por su ID
 * @param {string} id - ID de la nota de crédito
 * @returns {Promise<Object>} - Datos de la nota de crédito
 */
export const getCreditNoteById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en getCreditNoteById:', error);
    throw error.response?.data || { message: 'Error al obtener la nota de crédito' };
  }
};

/**
 * Crea una nueva nota de crédito
 * @param {Object} creditNoteData - Datos de la nota de crédito
 * @returns {Promise<Object>} - Nota de crédito creada
 */
export const createCreditNote = async (creditNoteData) => {
  try {
    const response = await axios.post(API_URL, creditNoteData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en createCreditNote:', error);
    throw error.response?.data || { message: 'Error al crear la nota de crédito' };
  }
};

/**
 * Actualiza una nota de crédito existente
 * @param {string} id - ID de la nota de crédito
 * @param {Object} creditNoteData - Datos a actualizar
 * @returns {Promise<Object>} - Nota de crédito actualizada
 */
export const updateCreditNote = async (id, creditNoteData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, creditNoteData, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en updateCreditNote:', error);
    throw error.response?.data || { message: 'Error al actualizar la nota de crédito' };
  }
};

/**
 * Procesa una nota de crédito para fines fiscales
 * @param {string} id - ID de la nota de crédito
 * @returns {Promise<Object>} - Nota de crédito procesada
 */
export const processFiscalCreditNote = async (id) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/process`, {}, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en processFiscalCreditNote:', error);
    throw error.response?.data || { message: 'Error al procesar la nota de crédito' };
  }
};

/**
 * Cancela una nota de crédito
 * @param {string} id - ID de la nota de crédito
 * @param {Object} data - Datos de cancelación (razón)
 * @returns {Promise<Object>} - Nota de crédito cancelada
 */
export const cancelCreditNote = async (id, data) => {
  try {
    const response = await axios.post(`${API_URL}/${id}/cancel`, data, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en cancelCreditNote:', error);
    throw error.response?.data || { message: 'Error al cancelar la nota de crédito' };
  }
};

/**
 * Elimina una nota de crédito (solo borradores)
 * @param {string} id - ID de la nota de crédito
 * @returns {Promise<Object>} - Resultado de la operación
 */
export const deleteCreditNote = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error en deleteCreditNote:', error);
    throw error.response?.data || { message: 'Error al eliminar la nota de crédito' };
  }
};

/**
 * Genera un PDF de la nota de crédito
 * @param {string} id - ID de la nota de crédito
 * @returns {Promise<Blob>} - Blob del PDF
 */
export const generateCreditNotePDF = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}/pdf`, {
      ...getAuthConfig(),
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    console.error('Error en generateCreditNotePDF:', error);
    throw error.response?.data || { message: 'Error al generar el PDF' };
  }
};

/**
 * Obtiene estadísticas de notas de crédito
 * @param {Object} params - Parámetros para las estadísticas
 * @returns {Promise<Object>} - Datos estadísticos
 */
export const getCreditNoteStats = async (params = {}) => {
  try {
    const response = await axios.get(`${API_URL}/stats`, {
      ...getAuthConfig(),
      params
    });
    return response.data;
  } catch (error) {
    console.error('Error en getCreditNoteStats:', error);
    throw error.response?.data || { message: 'Error al obtener estadísticas' };
  }
}; 