import axios from 'axios';
import { API_BASE_URL } from './config';

// Configuración global de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Interceptor para añadir el token de autenticación
api.interceptors.request.use(
  (config) => {
    // No inyectar Authorization en endpoints de autenticación
    const url = config.url || '';
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/check-session')) {
      return config;
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores de respuesta y refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const url = error.config?.url || '';
    // No manejar aquí auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/check-session')) {
      return Promise.reject(error);
    }
    // Si es 401 y hay refresh token, intentar refrescar
    if (error.response && error.response.status === 401 && !error.config._retry) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        error.config._retry = true;
        try {
          const res = await api.post('/auth/refresh-token', { refreshToken });
          if (res.data && res.data.token) {
            localStorage.setItem('token', res.data.token);
            if (res.data.refreshToken) {
              localStorage.setItem('refreshToken', res.data.refreshToken);
            }
            error.config.headers['Authorization'] = `Bearer ${res.data.token}`;
            return api(error.config);
          }
        } catch (refreshError) {
          // Si falla el refresh, limpiar y redirigir
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setTimeout(() => {
            window.location.href = '/login';
          }, 500);
          return Promise.reject(refreshError);
        }
      } else {
        // Si no hay refresh token, limpiar y redirigir
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    }
    // Otros errores
    if (error.response) {
      switch (error.response.status) {
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

export default api; 