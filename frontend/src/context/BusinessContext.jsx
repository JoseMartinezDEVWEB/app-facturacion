import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBusinessInfo } from '../services/businessService';
import { toast } from 'react-hot-toast';
import { useAuth } from './AuthContext';

const BusinessContext = createContext();

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }) => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  // Usar useCallback para evitar recreaciones innecesarias de la función
  const fetchBusinessInfo = useCallback(async () => {
    // Evitar múltiples llamadas si ya estamos cargando
    if (!loading) setLoading(true);
    
    try {
      const response = await getBusinessInfo();
      if (response.success) {
        setBusinessInfo(response.data);
      }
    } catch (err) {
      console.error('Error al cargar datos del negocio:', err);
      setError(err.message || 'Error al cargar datos del negocio');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Cargar datos del negocio solo al montar el componente o al autenticar
  useEffect(() => {
    // Si no está autenticado, marcar como cargado y salir
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    // Si ya tenemos datos, no hacer nada
    if (businessInfo) return;
    // Autenticado y aún no cargado: obtener datos del negocio
    fetchBusinessInfo();
  }, [isAuthenticated, fetchBusinessInfo, businessInfo]);

  // Actualizar datos del negocio en el contexto
  const updateBusinessInfo = useCallback((newInfo) => {
    setBusinessInfo(newInfo);
  }, []);

  // Memoizar el valor del contexto para evitar renderizados innecesarios
  const value = {
    businessInfo,
    updateBusinessInfo,
    loading,
    error,
    refetch: fetchBusinessInfo
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}; 