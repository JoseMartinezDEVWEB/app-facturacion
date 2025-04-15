// src/services/api.js
import axios from 'axios';
import { mockData } from './dashboardData';

// Configuración global
const API_URL = 'http://localhost:4000/api';
const USE_MOCK_DATA = false; // Cambiar a false para usar la API real

// Creamos la instancia de axios
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Interceptor para añadir el token y hacer logging
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('Token en localStorage:', token ? 'Presente' : 'Ausente');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log(`Realizando petición a: ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Error en la configuración de la petición:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log(`Respuesta exitosa de ${response.config.url}:`, response.status);
    return response.data;
  },
  (error) => {
    console.error('Error completo:', error);
    
    if (error.response) {
      console.error(`Error ${error.response.status} en ${error.config.url}:`, error.response.data);
      
      // Solo redirigir a login en caso de error 401 si no estamos en la página de login
      if (error.response.status === 401 && !window.location.pathname.includes('login')) {
        console.warn('Redirigiendo a login debido a error de autenticación');
        // Añadimos un pequeño retraso para evitar redirecciones en cascada
        setTimeout(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }, 500);
      }
      
      return Promise.reject(error.response.data);
    } else if (error.request) {
      console.error('No se recibió respuesta:', error.request);
      return Promise.reject({ message: 'No hay respuesta del servidor' });
    } else {
      console.error('Error en la configuración:', error.message);
      return Promise.reject({ message: 'Error al realizar la petición' });
    }
  }
);

// Servicio de autenticación mejorado
export const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      
      if (response.token) {
        localStorage.setItem('token', response.token);
        console.log('Token guardado en localStorage');
        return response;
      } else {
        throw new Error('No se recibió token de autenticación');
      }
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  },
  
  verifySession: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw { status: 401, message: 'No hay token de autenticación' };
    }
    
    try {
      // Intenta obtener información del usuario para verificar la sesión
      return await api.get('/users/info');
    } catch (error) {
      console.error('Error al verificar sesión:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    console.log('Token eliminado de localStorage');
    window.location.href = '/login';
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Servicio del dashboard
export const dashboardService = {
  getData: async (period = 'day') => {
    if (USE_MOCK_DATA) {
      console.log('Usando datos simulados para el dashboard');
      return mockData;
    }
    
    try {
      // Verificar la sesión primero (opcional)
      await authService.verifySession();
      
      console.log(`Obteniendo datos del dashboard para periodo: ${period}`);
      return await api.get(`/dashboard/data?period=${period}`);
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      
      // Si hay un error de autenticación, no usamos los datos simulados
      if (error.status === 401) {
        throw error;
      }
      
      // Para otros errores, usamos los datos simulados como fallback
      console.warn('Fallback a datos simulados');
      return mockData;
    }
  },
  
  getDetailedStats: async (startDate, endDate) => {
    if (USE_MOCK_DATA) {
      return mockData.detailedStats || [];
    }
    
    try {
      return await api.get(`/dashboard/stats?startDate=${startDate}&endDate=${endDate}`);
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      return mockData.detailedStats || [];
    }
  }
};

export default api;