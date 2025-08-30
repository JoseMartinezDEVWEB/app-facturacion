import axios from 'axios';
import { API_BASE_URL, API_ROUTES } from '../config/config';

// Función para obtener todas las facturas
export const getFacturas = async () => {
  try {
    console.log('[DEBUG] Obteniendo facturas desde:', `${API_BASE_URL}${API_ROUTES.FACTURAS}`);
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.FACTURAS}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    // Si hay un error, devolvemos un array vacío para evitar errores en el frontend
    return [];
  }
};

// Función para obtener una factura por ID
export const getFacturaById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.FACTURAS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener factura con ID ${id}:`, error);
    throw error;
  }
};

// Función para crear una nueva factura
export const createFactura = async (facturaData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}${API_ROUTES.FACTURAS}`, facturaData);
    return response.data;
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
};

// Función para actualizar una factura existente
export const updateFactura = async (id, facturaData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}${API_ROUTES.FACTURAS}/${id}`, facturaData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar factura con ID ${id}:`, error);
    throw error;
  }
};

// Función para eliminar una factura
export const deleteFactura = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}${API_ROUTES.FACTURAS}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar factura con ID ${id}:`, error);
    throw error;
  }
};

// Función para cambiar el estado de una factura
export const updateFacturaStatus = async (id, status) => {
  try {
    const response = await axios.patch(`${API_BASE_URL}${API_ROUTES.FACTURAS}/${id}/status`, { status });
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar estado de factura con ID ${id}:`, error);
    throw error;
  }
};

// Función para generar PDF de factura
export const generateFacturaPDF = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.FACTURAS}/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  } catch (error) {
    console.error(`Error al generar PDF de factura con ID ${id}:`, error);
    throw error;
  }
};

// Función para obtener estadísticas de facturas
export const getFacturasStats = async (period = 'month') => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.FACTURAS}/stats?period=${period}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de facturas:', error);
    throw error;
  }
}; 