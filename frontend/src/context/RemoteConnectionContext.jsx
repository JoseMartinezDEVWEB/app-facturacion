import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Create context
const RemoteConnectionContext = createContext();

export const RemoteConnectionProvider = ({ children }) => {
  const { user } = useAuth();
  const [isRemoteEnabled, setIsRemoteEnabled] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected'
  const [remoteConfig, setRemoteConfig] = useState({
    serverUrl: localStorage.getItem('remoteServerUrl') || '',
    localMode: localStorage.getItem('connectionMode') === 'local'
  });

  // Check if user is admin or super admin
  const canUseRemoteConnection = () => {
    return user && (user.role === 'admin' || user.role === 'superadmin');
  };

  // Enable remote connection for authorized users
  useEffect(() => {
    if (canUseRemoteConnection()) {
      const savedEnabled = localStorage.getItem('remoteEnabled') === 'true';
      setIsRemoteEnabled(savedEnabled);
    } else {
      setIsRemoteEnabled(false);
    }
  }, [user]);

  // Connect to remote server
  const connectToRemote = async (serverUrl) => {
    if (!canUseRemoteConnection()) {
      return { success: false, message: 'No tienes permisos para usar conexión remota' };
    }

    try {
      setRemoteStatus('connecting');
      
      // Store in localStorage
      localStorage.setItem('remoteServerUrl', serverUrl);
      localStorage.setItem('remoteEnabled', 'true');
      
      setRemoteConfig({
        ...remoteConfig,
        serverUrl
      });
      
      setIsRemoteEnabled(true);
      setRemoteStatus('connected');
      
      return { success: true, message: 'Conexión remota activada' };
    } catch (error) {
      setRemoteStatus('disconnected');
      return { success: false, message: error.message || 'Error al conectar con el servidor remoto' };
    }
  };

  // Disconnect from remote server
  const disconnectFromRemote = () => {
    localStorage.setItem('remoteEnabled', 'false');
    setIsRemoteEnabled(false);
    setRemoteStatus('disconnected');
    return { success: true, message: 'Conexión remota desactivada' };
  };

  // Switch between local and cloud modes
  const switchConnectionMode = (mode) => {
    if (mode !== 'local' && mode !== 'cloud') {
      return { success: false, message: 'Modo de conexión inválido' };
    }
    
    localStorage.setItem('connectionMode', mode);
    setRemoteConfig({
      ...remoteConfig,
      localMode: mode === 'local'
    });
    
    return { success: true, message: `Modo ${mode === 'local' ? 'local' : 'en la nube'} activado` };
  };

  // Get current API URL based on connection mode
  const getApiUrl = () => {
    if (!isRemoteEnabled) {
      return remoteConfig.localMode ? 'http://localhost:4500/api' : process.env.REACT_APP_API_URL || 'http://localhost:4500/api';
    }
    
    return remoteConfig.serverUrl;
  };

  // Provide context value
  const contextValue = {
    isRemoteEnabled,
    remoteStatus,
    remoteConfig,
    connectToRemote,
    disconnectFromRemote,
    switchConnectionMode,
    getApiUrl,
    canUseRemoteConnection
  };

  return (
    <RemoteConnectionContext.Provider value={contextValue}>
      {children}
    </RemoteConnectionContext.Provider>
  );
};

// Hook to use the context
export const useRemoteConnection = () => {
  const context = useContext(RemoteConnectionContext);
  if (!context) {
    throw new Error('useRemoteConnection debe usarse dentro de un RemoteConnectionProvider');
  }
  return context;
};

export default RemoteConnectionContext; 