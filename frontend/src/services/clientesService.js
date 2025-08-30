import axios from 'axios';
import { API_BASE_URL, API_ROUTES } from '../config/config';

// Función para obtener todos los clientes
export const getClientes = async () => {
  try {
    console.log('[DEBUG] Obteniendo clientes desde:', `${API_BASE_URL}${API_ROUTES.CLIENTES}`);
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.CLIENTES}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    // Si hay un error, devolvemos un array vacío para evitar errores en el frontend
    return [];
  }
};

// Función para obtener un cliente por ID
export const getClienteById = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.CLIENTES}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener cliente con ID ${id}:`, error);
    throw error;
  }
};

// Función para crear un nuevo cliente
export const createCliente = async (clienteData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}${API_ROUTES.CLIENTES}`, clienteData);
    return response.data;
  } catch (error) {
    console.error('Error al crear cliente:', error);
    throw error;
  }
};

// Función para actualizar un cliente existente
export const updateCliente = async (id, clienteData) => {
  try {
    const response = await axios.put(`${API_BASE_URL}${API_ROUTES.CLIENTES}/${id}`, clienteData);
    return response.data;
  } catch (error) {
    console.error(`Error al actualizar cliente con ID ${id}:`, error);
    throw error;
  }
};

// Función para eliminar un cliente
export const deleteCliente = async (id) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}${API_ROUTES.CLIENTES}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error al eliminar cliente con ID ${id}:`, error);
    throw error;
  }
};

// Función para buscar clientes por término de búsqueda
export const searchClientes = async (searchTerm) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.CLIENTES}/search?term=${searchTerm}`);
    return response.data;
  } catch (error) {
    console.error(`Error al buscar clientes con término "${searchTerm}":`, error);
    throw error;
  }
};

// Función para obtener las estadísticas de clientes
export const getClientesStats = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.CLIENTES}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas de clientes:', error);
    throw error;
  }
};

// Función para obtener las facturas de un cliente
export const getClienteFacturas = async (id) => {
  try {
    const response = await axios.get(`${API_BASE_URL}${API_ROUTES.CLIENTES}/${id}/facturas`);
    return response.data;
  } catch (error) {
    console.error(`Error al obtener facturas del cliente con ID ${id}:`, error);
    throw error;
  }
}; 