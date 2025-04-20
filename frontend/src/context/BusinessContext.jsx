import { createContext, useContext, useState, useEffect } from 'react';
import { getBusinessInfo } from '../services/businessService';
import { toast } from 'react-hot-toast';

const BusinessContext = createContext();

export const useBusiness = () => useContext(BusinessContext);

export const BusinessProvider = ({ children }) => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del negocio al iniciar
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        setLoading(true);
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
    };

    fetchBusinessInfo();
  }, []);

  // Actualizar datos del negocio en el contexto
  const updateBusinessInfo = (newInfo) => {
    setBusinessInfo(newInfo);
  };

  const value = {
    businessInfo,
    updateBusinessInfo,
    loading,
    error
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
}; 