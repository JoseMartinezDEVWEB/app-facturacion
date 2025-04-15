import { useState, useEffect } from 'react';
import api from '../config/apis';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Opcionalmente verificar si el token es válido haciendo una petición
        // al backend, pero por ahora solo verificamos si existe
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Error al verificar token:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      }
    } else {
      setIsAuthenticated(false);
    }
    
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      console.log('Iniciando sesión con:', credentials);
      
      // CORREGIDO: Usar directamente api en lugar de userApi
      // Ya que el error 404 indica que la ruta /users/login no existe
      const response = await api.post('/login', credentials);
      
      // Verificar la respuesta y guardar el token
      if (response && response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
        setIsAuthenticated(true);
        
        // Si la respuesta incluye información del usuario, guardarla
        if (response.data.user) {
          setUser(response.data.user);
        }
        
        return response.data;
      } else {
        console.warn('Respuesta sin token:', response);
        throw new Error('La respuesta no incluye un token válido');
      }
    } catch (error) {
      console.error('Error en login (useAuth):', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return { 
    isAuthenticated, 
    loading, 
    login, 
    logout,
    user
  };
};