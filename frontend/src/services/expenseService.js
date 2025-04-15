import axios from 'axios';
import { getAuthConfig } from './authService';

const API_URL = '/api/expenses';

// Obtener todos los gastos con filtros opcionales
export const getExpenses = async (filters = {}) => {
  try {
    // Construir los parámetros de consulta
    const queryParams = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        queryParams.append(key, filters[key]);
      }
    });
    
    const response = await axios.get(`${API_URL}?${queryParams.toString()}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener los gastos' };
  }
};

// Obtener un gasto específico
export const getExpense = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el gasto' };
  }
};

// Crear un nuevo gasto
export const createExpense = async (expenseData, isFormData = false) => {
  try {
    let config = getAuthConfig();
    if (isFormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    const response = await axios.post(API_URL, expenseData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear el gasto' };
  }
};

// Actualizar un gasto existente
export const updateExpense = async (id, expenseData, isFormData = false) => {
  try {
    let config = getAuthConfig();
    if (isFormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }
    
    const response = await axios.put(`${API_URL}/${id}`, expenseData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar el gasto' };
  }
};

// Eliminar un gasto
export const deleteExpense = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar el gasto' };
  }
};

// Obtener gastos mensuales
export const getMonthlyExpenses = async () => {
  try {
    const response = await axios.get(`${API_URL}/monthly`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener los gastos mensuales' };
  }
};

// Obtener el resumen de gastos
export const getExpenseSummary = async () => {
  try {
    const response = await axios.get(`${API_URL}/summary`, getAuthConfig());
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener el resumen de gastos' };
  }
};

