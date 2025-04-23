import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/authService';

// Crear contexto
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  // Usar useCallback para evitar recreaciones innecesarias de la función
  const checkAuth = useCallback(async () => {
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
  }, []);

  // Ejecutar checkAuth solo una vez al montar el componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log('AuthContext: Llamando a authService.login con:', credentials.email);
      const { token, user: userData } = await apiLogin(credentials.email, credentials.password);
      
      console.log('Respuesta de authService.login:', { token, user: userData });

      setIsAuthenticated(true);
      setUser(userData);
      setLoading(false);
      return { token, user: userData };

    } catch (err) {
      const errorMessage = err.message || 'Error en el inicio de sesión';
      console.error('Error en login (AuthContext):', errorMessage, err);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    apiLogout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Memoizar el valor del contexto para evitar renderizados innecesarios
  const contextValue = {
    isAuthenticated,
    loading,
    login,
    logout,
    user,
    error,
    checkAuth
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

const login = async (credentials) => {
  setLoading(true);
  setError(null);
  try {
    console.log('AuthContext: Llamando a authService.login con:', credentials.email);
    const data = await apiLogin(credentials.email, credentials.password);
    
    // Guarda token en localStorage (aunque esto ya lo hace authService)
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    
    setIsAuthenticated(true);
    setUser(data.user || null);
    setLoading(false);
    return data;
  } catch (err) {
    const errorMessage = err.message || 'Error al iniciar sesión';
    console.error('Error en login (AuthContext):', errorMessage, err);
    setError(errorMessage);
    setIsAuthenticated(false);
    setUser(null);
    setLoading(false);
    throw err;
  }
}; 

export default AuthContext;