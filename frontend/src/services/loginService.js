import axios from 'axios';
import { API_ROUTES, API_BASE_URL } from '../config/config';

// Cliente axios específico para autenticación
const authClient = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Realiza la autenticación del usuario
 * @param {Object} credentials - Credenciales del usuario (email y password)
 * @returns {Promise<Object>} Datos del usuario y token
 */
export const loginUser = async (credentials) => {
  try {
    console.log('LoginService: Intentando login con:', credentials.email);
    console.log('URL completa:', `${authClient.defaults.baseURL}${API_ROUTES.AUTH.LOGIN}`);
    
    // Usar el cliente axios específico para autenticación
    const response = await authClient.post(API_ROUTES.AUTH.LOGIN, {
      email: credentials.email,
      password: credentials.password
    });
    
    const data = response.data;
    console.log('LoginService: Respuesta login exitosa:', data);
    
    if (data && data.token) {
      // Guardar token y datos de usuario
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      
      return data;
    } else {
      throw new Error('La respuesta no contiene un token válido');
    }
  } catch (error) {
    console.error('Error en loginService:', error);
    
    // Manejar diferentes tipos de errores
    if (error.response) {
      // Error con respuesta del servidor
      console.error('Error de respuesta del servidor:', error.response.status, error.response.data);
      if (error.response.status === 401) {
        throw new Error('Credenciales inválidas');
      } else {
        throw new Error(error.response.data?.message || 'Error de servidor');
      }
    } else if (error.request) {
      // No se recibió respuesta
      console.error('No se recibió respuesta del servidor', error.request);
      throw new Error('No hay respuesta del servidor');
    } else {
      // Error de configuración
      throw error;
    }
  }
};

/**
 * Cierra la sesión del usuario
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return true;
};

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean} True si está autenticado, false en caso contrario
 */
export const isUserAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Obtiene el token actual
 * @returns {string|null} Token o null si no existe
 */
export const getUserToken = () => {
  return localStorage.getItem('token');
}; 