import axios from 'axios';
import { API_ROUTES } from '../config/config';

// Configurar axios para usar la URL base correcta
axios.defaults.baseURL = 'http://localhost:4000';

/**
 * Obtiene la configuración de autenticación para las solicitudes HTTP
 * @returns {Object} Objeto de configuración con el token de autenticación
 */
export const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
};

/**
 * Realiza la autenticación del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const login = async (email, password) => {
  try {
    const response = await axios.post(API_ROUTES.AUTH.LOGIN, { email, password });
    const { token, user } = response.data;
    
    // Guardar token en localStorage
    localStorage.setItem('token', token);
    
    return { token, user };
  } catch (error) {
    console.error('Error en login:', error.response?.data || error.message);
    throw error.response?.data || { message: 'Error al iniciar sesión' };
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logout = () => {
  localStorage.removeItem('token');
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si está autenticado, false en caso contrario
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Obtiene el token actual
 * @returns {string|null} Token o null si no existe
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Verifica si el token es válido haciendo una solicitud al servidor
 * @returns {Promise<boolean>} True si el token es válido, false en caso contrario
 */
export const validateToken = async () => {
  try {
    if (!isAuthenticated()) return false;
    
    const response = await axios.get('/api/auth/validate', getAuthConfig());
    return response.data.valid;
  } catch (error) {
    console.error('Error validando token:', error);
    return false;
  }
}; 