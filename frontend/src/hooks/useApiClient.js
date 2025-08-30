import { useMemo } from 'react';
import createApiInstance from '../config/dynamicAxiosConfig';

/**
 * Custom hook to get a configured Axios instance based on current connection settings
 * @returns {Object} Configured Axios instance
 */
const useApiClient = () => {
  // Create a memoized API client based on the current API URL
  const apiClient = useMemo(() => {
    const baseURL = getApiUrl();
    return createApiInstance(baseURL);
  }, [getApiUrl]);
  
  return apiClient;
};

export default useApiClient; 