import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Función auxiliar para manejar errores
const handleError = (error) => {
  console.error('Error en la operación:', error);
  throw error;
};

// Obtener todos los proveedores
export const getSuppliers = async (filters = {}) => {
  try {
    const response = await axios.get(`${API_URL}/suppliers`, { params: filters });
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Obtener un proveedor por ID
export const getSupplierById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/suppliers/${id}`);
    return response;
  } catch (error) {
    return handleError(error);
  }
};

// Crear un nuevo proveedor
export const createSupplier = async (supplierData, documents = []) => {
  try {
    // Si no hay documentos, solo enviamos los datos del proveedor
    if (!documents.length) {
      const response = await axios.post(`${API_URL}/suppliers`, supplierData);
      return response.data;
    }

    // Si hay documentos, usamos FormData para el envío multipart
    const formData = new FormData();
    
    // Añadir datos del proveedor
    formData.append('supplierData', JSON.stringify(supplierData));
    
    // Añadir documentos
    documents.forEach(doc => {
      formData.append('documents', doc);
    });
    
    const response = await axios.post(`${API_URL}/suppliers`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Actualizar un proveedor existente
export const updateSupplier = async (id, supplierData, newDocuments = []) => {
  try {
    // Si no hay nuevos documentos, actualizamos solo los datos
    if (!newDocuments.length) {
      const response = await axios.put(`${API_URL}/suppliers/${id}`, supplierData);
      return response.data;
    }
    
    // Si hay nuevos documentos, usamos FormData
    const formData = new FormData();
    
    // Añadir datos del proveedor
    formData.append('supplierData', JSON.stringify(supplierData));
    
    // Añadir documentos nuevos
    newDocuments.forEach(doc => {
      formData.append('documents', doc);
    });
    
    const response = await axios.put(`${API_URL}/suppliers/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Eliminar un proveedor
export const deleteSupplier = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/suppliers/${id}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Eliminar un documento específico de un proveedor
export const deleteDocument = async (supplierId, documentId) => {
  try {
    const response = await axios.delete(`${API_URL}/suppliers/${supplierId}/documents/${documentId}`);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Añadir una calificación a un proveedor
export const addRating = async (supplierId, ratingData) => {
  try {
    const response = await axios.post(`${API_URL}/suppliers/${supplierId}/ratings`, ratingData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

// Actualizar la calificación de un proveedor
export const updateSupplierRating = async (supplierId, ratingData) => {
  try {
    const response = await axios.put(`${API_URL}/suppliers/${supplierId}/rating`, ratingData);
    return response.data;
  } catch (error) {
    return handleError(error);
  }
};

export default {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  deleteDocument,
  addRating,
  updateSupplierRating
}; 