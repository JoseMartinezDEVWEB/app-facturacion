// axiosConfig.js
import axios from 'axios';
import { API_URL } from './config';
import { getToken, refreshToken } from '../services/authService';

// Crear instancia de axios
const api = axios.create({
  baseURL: 'http://localhost:4000',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Variable para controlar si estamos en proceso de refresh
let isRefreshing = false;
// Cola de requests fallidos que se reintentarán después de refresh
let failedQueue = [];

// Función para procesar la cola de requests fallidos
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor para agregar token a las solicitudes
api.interceptors.request.use(
  (config) => {
    console.log(`Enviando solicitud a: ${config.url}`);
    
    // No agregar token para rutas de autenticación inicial
    if (config.url.includes('/auth/login') || config.url.includes('/auth/refresh-token')) {
      return config;
    }

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('Error en interceptor de solicitud:', error);
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    console.log(`Respuesta recibida de ${response.config.url}:`, response.status);
    // Devolver directamente la respuesta para mantener la estructura completa
    return response;
  },
  async (error) => {
    console.error('Error en respuesta:', error.response?.status || error.message);
    
    const originalRequest = error.config;
    
    // Si no hay respuesta, devolver el error directamente
    if (!error.response) {
      return Promise.reject(error);
    }
    
    // Manejar error 401 (Unauthorized) para token expirado (solo si no es la ruta de login)
    if (error.response.status === 401 && 
        !originalRequest._retry && 
        !originalRequest.url.includes('/auth/login') &&
        !originalRequest.url.includes('/auth/refresh-token')) {
      
      if (isRefreshing) {
        // Si ya estamos refrescando, agregar a la cola
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
      }
      
      // Marcar que estamos intentando refrescar
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Intentar refrescar el token
        console.log('Intentando refrescar token...');
        const data = await refreshToken(api);
        const newToken = data.token;
        
        if (newToken) {
          console.log('Token refrescado exitosamente');
          // Actualizar token en request original
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Procesar cola de requests pendientes
          processQueue(null, newToken);
          
          // Reintentar la solicitud original
          return api(originalRequest);
        } else {
          console.error('No se pudo obtener un nuevo token');
          processQueue(new Error('Error de refresh token'));
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Para cualquier otro error, devolver el error
    return Promise.reject(error);
  }
);

export default api;