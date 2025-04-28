import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:4500/api';

const useBusinessInfo = () => {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    address: '',
    phone: '',
    taxId: '',
    email: '',
    website: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/business`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setBusinessInfo(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching business info:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchBusinessInfo();
  }, []);

  return { businessInfo, loading, error };
};

export default useBusinessInfo;