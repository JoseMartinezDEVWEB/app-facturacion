import axios from 'axios';
import { API_ROUTES } from '../config/config';
import api from '../config/axiosConfig';

/**
 * Obtiene la configuración de autenticación para las solicitudes HTTP
 * @returns {Object} Objeto de configuración con el token de autenticación
 */
export const getAuthConfig = () => {
  // Este método ya no es necesario porque configuramos axios globalmente,
  // pero lo mantenemos para mantener compatibilidad con código existente
  return {};
};

/**
 * Realiza la autenticación del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña del usuario
 * @returns {Promise<Object>} Datos del usuario y token
 */
/*
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

*/

/**
 * Cierra la sesión del usuario
 */
/*
export const logout = () => {
  localStorage.removeItem('token');
};

*/

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


export const login = async (email, password) => {
  try {
    // Cambia la ruta a la correcta
    const response = await api.post('/auth/login', { email, password });
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // También guarda el refresh token si tu API lo proporciona
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error en authService.login:', error);
    if (error.response?.status === 401) {
      throw new Error('Credenciales inválidas');
    }
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  return true;
};

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No hay refresh token disponible');
    }
    
    const response = await api.post('/auth/refresh-token', { refreshToken });
    
    if (response.data && response.data.token) {
      localStorage.setItem('token', response.data.token);
      // También actualiza el refresh token si la API lo devuelve
      if (response.data.refreshToken) {
        localStorage.setItem('refreshToken', response.data.refreshToken);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('Error al refrescar token:', error);
    // Eliminar los tokens si hay un error de refresco
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    throw error;
  }
};