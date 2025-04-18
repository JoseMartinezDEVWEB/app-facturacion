import axios from 'axios';
import { getAuthConfig } from './authService';

const API_URL = '/api/newinvoices';

// Obtener todas las facturas con filtros
export const getInvoices = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();
    
    // Agregar filtros como parámetros de consulta
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });

    const response = await axios.get(`${API_URL}?${queryParams.toString()}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener las facturas' };
  }
};

// Obtener una factura por ID
export const getInvoiceById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener la factura' };
  }
};

// Crear una nueva factura
export const createInvoice = async (invoiceData) => {
  try {
    const response = await axios.post(API_URL, invoiceData, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear la factura' };
  }
};

// Agregar un pago a una factura
export const addPayment = async (invoiceId, paymentData) => {
  try {
    const response = await axios.post(
      `${API_URL}/${invoiceId}/payment`,
      paymentData,
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al agregar el pago' };
  }
};

// Cancelar una factura
export const cancelInvoice = async (invoiceId, reason) => {
  try {
    const response = await axios.post(
      `${API_URL}/${invoiceId}/cancel`,
      { reason },
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al cancelar la factura' };
  }
};

// Procesar una factura fiscal
export const processFiscalInvoice = async (invoiceId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${invoiceId}/process-fiscal`,
      {},
      getAuthConfig()
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al procesar la factura fiscal' };
  }
}; 