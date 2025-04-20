import axios from 'axios';

const API_URL = '/api/business';

// Obtener información del negocio
export const getBusinessInfo = async () => {
  try {
    const response = await axios.get(`${API_URL}/info`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener datos del negocio' };
  }
};

// Guardar información del negocio
export const saveBusinessInfo = async (businessData) => {
  try {
    const formData = new FormData();
    
    // Añadir campos de texto
    Object.keys(businessData).forEach(key => {
      if (key !== 'logo' || (key === 'logo' && typeof businessData[key] === 'string')) {
        formData.append(key, businessData[key]);
      }
    });
    
    // Añadir logo si es un archivo
    if (businessData.logo instanceof File) {
      formData.append('logo', businessData.logo);
    }
    
    const response = await axios.post(`${API_URL}/info`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al guardar datos del negocio' };
  }
}; 