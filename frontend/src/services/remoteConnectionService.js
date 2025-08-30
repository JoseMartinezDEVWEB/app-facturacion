/**
 * Service for handling remote connection functionality
 */

/**
 * Verifies connectivity to a remote server
 * @param {Object} apiClient - The API client instance to use
 * @param {string} serverUrl - The server URL to test
 * @returns {Promise<Object>} Connection status
 */
export const testRemoteConnection = async (apiClient, serverUrl) => {
  try {
    // Add a timeout for the connection test
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    // Try to connect to the server
    const response = await apiClient.get(`${serverUrl}/health-check`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return {
      success: true,
      message: 'Conexión exitosa',
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error de conexión',
      error
    };
  }
};

/**
 * Gets system information from remote server
 * @param {Object} apiClient - The API client instance to use
 * @returns {Promise<Object>} System information
 */
export const getRemoteSystemInfo = async (apiClient) => {
  try {
    const response = await apiClient.get('/system/info');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Error al obtener información del sistema',
      error
    };
  }
};

/**
 * Gets available connection methods for the current user
 * @param {Object} apiClient - The API client instance to use
 * @returns {Promise<Object>} Available connection methods
 */
export const getConnectionMethods = async (apiClient) => {
  try {
    const response = await apiClient.get('/auth/connection-methods');
    return {
      success: true,
      data: response.data.methods || []
    };
  } catch (error) {
    // If the endpoint doesn't exist, return default methods
    return {
      success: true,
      data: ['local', 'cloud']
    };
  }
};

/**
 * Registers a new remote connection for the current user
 * @param {Object} apiClient - The API client instance to use
 * @param {Object} connectionData - Connection details
 * @returns {Promise<Object>} Registration result
 */
export const registerRemoteConnection = async (apiClient, connectionData) => {
  try {
    const response = await apiClient.post('/auth/register-remote', connectionData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      message: error.response?.data?.message || 'Error al registrar conexión remota',
      error
    };
  }
}; 