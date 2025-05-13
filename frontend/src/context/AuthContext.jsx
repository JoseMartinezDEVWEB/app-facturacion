import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { login as apiLogin, logout as apiLogout } from '../services/authService';
import { loginUser, logoutUser, isUserAuthenticated } from '../services/loginService';
import { useLoading } from './LoadingContext';

// Crear contexto
const AuthContext = createContext();

// Provider component
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const { showLoader, hideLoader } = useLoading();

  // Usar useCallback para evitar recreaciones innecesarias de la función
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Mostrar animación durante la verificación de autenticación
        await showLoader(800, 'Verificando sesión...');
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
    hideLoader();
  }, [showLoader, hideLoader]);

  // Ejecutar checkAuth solo una vez al montar el componente
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      console.log('AuthContext: Iniciando proceso de login con:', credentials.email);
      
      // Usar el nuevo servicio de login
      const data = await loginUser(credentials);
      console.log('Respuesta del login procesada:', data);
      
      // Extraer información del usuario
      const userInfo = data.user || null;
      console.log('Información de usuario obtenida en login:', userInfo);
      
      if (userInfo && userInfo.role) {
        // Asegurarnos de guardar el rol correctamente
        localStorage.setItem('userRole', userInfo.role);
        console.log('Rol de usuario guardado:', userInfo.role);
      }
      
      setIsAuthenticated(true);
      setUser(userInfo);
      setLoading(false);
      hideLoader();
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Error al iniciar sesión';
      console.error('Error en login (AuthContext):', errorMessage, err);
      setError(errorMessage);
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      hideLoader();
      throw err;
    }
  };

  const logout = async () => {
    try {
      // Mostrar animación durante el cierre de sesión
      await showLoader(800, 'Cerrando sesión...');
      logoutUser();
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Error durante el cierre de sesión:', error);
    }
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

export default AuthContext;