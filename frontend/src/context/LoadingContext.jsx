import { createContext, useState, useContext } from 'react';

const LoadingContext = createContext();

export const useLoading = () => useContext(LoadingContext);

export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Cargando...');

  // Función para mostrar el loader con un tiempo máximo y un mensaje opcional
  const showLoader = (maxTime = 3000, message = 'Cargando...') => {
    setLoadingMessage(message);
    setIsLoading(true);
    
    // Retorna una promesa que se resolverá después del tiempo especificado
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsLoading(false);
        resolve();
      }, maxTime);
    });
  };

  // Función específica para la carga inicial (5 segundos)
  const showInitialLoader = (message = 'Iniciando sistema...') => {
    return showLoader(5000, message);
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
        showInitialLoader,
        hideLoader
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export default LoadingContext; 