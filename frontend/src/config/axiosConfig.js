import axios from 'axios';
import { API_BASE_URL } from './config';

// Configuración global de axios
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 30000; // 30 segundos

// Interceptor para manejar tokens de autenticación
axios.interceptors.request.use(
  (config) => {
    // No inyectar Authorization en endpoints de autenticación
    const url = config.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/check-session')) {
      return config;
    }
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // No manejar aquí auth endpoints
    const url = error.config?.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/check-session')) {
      return Promise.reject(error);
    }
    console.error('Error de respuesta axios:', error.response || error);
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.log('No autorizado - Sesión caducada o token inválido');
          break;
        case 403:
          console.log('Prohibido - No tienes permisos para esta acción');
          break;
        case 404:
          console.log('Recurso no encontrado');
          break;
        case 500:
          console.log('Error del servidor');
          break;
        default:
          console.log(`Error HTTP ${error.response.status}`);
      }
    } else if (error.request) {
      console.log('No se recibió respuesta del servidor. Verifique su conexión.');
    }
    return Promise.reject(error);
  }
);

export default axios; 