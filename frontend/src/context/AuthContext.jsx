import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/apis';

// Crear contexto
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        setIsAuthenticated(true);
        // Intentar obtener información del usuario si es necesario
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
      console.log('AuthContext: Iniciando sesión con:', credentials);
      setError(null);
      
      // CORREGIDO: Usar la ruta /login directamente 
      const response = await api.post('/login', credentials);
      
      console.log('Respuesta login:', response);
      
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
        const errorMsg = 'La respuesta no incluye un token válido';
        console.warn(errorMsg, response);
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error) {
      setError(error.message || 'Error en el inicio de sesión');
      console.error('Error en login (AuthContext):', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        login,
        logout,
        user,
        error,
        checkAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

export default AuthContext;