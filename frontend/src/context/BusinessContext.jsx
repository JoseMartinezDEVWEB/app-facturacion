import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getBusinessInfo } from '../services/businessService';
import { toast } from 'react-hot-toast';

const BusinessContext = createContext();

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }) => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Cargar datos del negocio solo al montar el componente
  useEffect(() => {
    // Si ya tenemos datos o estamos cargando, no hacer nada
    if (businessInfo || loading === false) return;
    
    fetchBusinessInfo();
    // Solo depender de fetchBusinessInfo para evitar loops infinitos
  }, [fetchBusinessInfo, businessInfo, loading]);

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