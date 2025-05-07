import { createContext, useState, useContext, useEffect } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');
  
  // Efecto para garantizar que el loader nunca se quede más de 3 segundos
  useEffect(() => {
    let timer;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsLoading(false);
      }, 3000); // Forzar cierre después de exactamente 3 segundos
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoading]);

  // Función para mostrar el loader con un tiempo máximo y un mensaje opcional
  const showLoader = (maxTime = 3000, message = 'Cargando...') => {
    // Nunca permitir tiempos mayores a 3000ms
    const safeTime = Math.min(maxTime, 3000);
    setLoadingMessage(message);
    setIsLoading(true);
    
    // Retorna una promesa que se resolverá después del tiempo especificado
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, safeTime);
    });
  };

  // Función para ocultar el loader manualmente si es necesario
  const hideLoader = () => {
    setIsLoading(false);
  };

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoader,
        hideLoader
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext; 