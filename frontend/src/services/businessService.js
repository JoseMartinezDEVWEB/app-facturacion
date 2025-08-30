import api from '../config/axiosConfig';

const API_URL = '/business';

// Obtener información del negocio
export const getBusinessInfo = async () => {
  try {
    const response = await api.get(`/business/info`);
    // Si la respuesta ya es un objeto con success/data, retorna tal cual
    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      return response;
    }
    // Si no, adapta la respuesta para evitar bucles
    return { success: true, data: response };
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
    
    const response = await api.post(`${API_URL}/info`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al guardar datos del negocio' };
  }
}; 