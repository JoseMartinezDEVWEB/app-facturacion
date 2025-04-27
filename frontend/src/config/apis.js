/* eslint-disable no-useless-catch */
/* eslint-disable no-undef */
import axios from 'axios';

// Configuración base de la API
const api = axios.create({
  baseURL: 'http://localhost:4500/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para el token - Descomentar y usar este en lugar de la configuración estática
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Mostrar el error en consola para depuración
    console.error('Error de API:', error);
    
    // Si el error es 401 (no autorizado), redirigir al login
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Usuario API
export const userApi = {
  getInfo: async () => {
    try {
      const response = await api.get('/users/info');
      return response.data;
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      // Devolver un usuario por defecto si falla la petición
      return {
        nombre: 'Usuario',
        rol: 'Invitado',
        error: error.message
      };
    }
  },
  
  login: async (credentials) => {
    try {
      // CORREGIDO: Usar /login en lugar de /users/login que da 404
      const response = await api.post('/login', credentials);
      // Guardar token automáticamente
      if (response.data && response.data.token) {
        localStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error) {
      console.error('Error en el inicio de sesión:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    // Opcional: hacer una petición al backend para invalidar el token
    return Promise.resolve({ success: true });
  }
};

// API para gastos
export const expenseService = {
  // Obtener todos los gastos con filtros opcionales
  getExpenses: async (filters = {}) => {
    try {
      // Construir los parámetros de consulta
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.paymentMethod) queryParams.append('paymentMethod', filters.paymentMethod);
      if (filters.minAmount) queryParams.append('minAmount', filters.minAmount);
      if (filters.maxAmount) queryParams.append('maxAmount', filters.maxAmount);
      if (filters.deductFromSales !== undefined) queryParams.append('deductFromSales', filters.deductFromSales);
      
      const response = await api.get(`/expenses?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener gastos:', error);
      throw error;
    }
  },

  // Obtener un gasto específico
  getExpense: async (id) => {
    try {
      const response = await api.get(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el gasto con ID ${id}:`, error);
      throw error;
    }
  },

  // Crear un nuevo gasto
  createExpense: async (expenseData) => {
    try {
      const response = await api.post('/expenses', expenseData);
      return response.data;
    } catch (error) {
      console.error('Error al crear el gasto:', error);
      throw error;
    }
  },

  // Actualizar un gasto existente
  updateExpense: async (id, expenseData) => {
    try {
      const response = await api.put(`/expenses/${id}`, expenseData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el gasto con ID ${id}:`, error);
      throw error;
    }
  },

  // Eliminar un gasto
  deleteExpense: async (id) => {
    try {
      const response = await api.delete(`/expenses/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el gasto con ID ${id}:`, error);
      throw error;
    }
  },

  // Obtener el resumen de gastos
  getExpenseSummary: async () => {
    try {
      const response = await api.get('/expenses/summary');
      return response.data;
    } catch (error) {
      console.error('Error al obtener el resumen de gastos:', error);
      throw error;
    }
  }
};

// Validación básica de datos de categoría
const validateCategory = (data) => {
  if (!data.name) {
    throw new Error('El nombre de la categoría es requerido');
  }
  return {
    name: data.name.trim(),
    description: data.description?.trim() || ''
  };
};
 
export const categoryApi = {
  getAll: async () => {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      throw new Error('Error al obtener categorías: ' + error.message);
    }
  },
 
  create: async (data) => {
    try {
      const validData = validateCategory(data);
      const response = await api.post('/categories', validData);
      return response.data;
    } catch (error) {
      throw new Error('Error al crear categoría: ' + error.message); 
    }
  },
 
  update: async (id, data) => {
    try {
      const validData = validateCategory(data);
      const response = await api.put(`/categories/${id}`, validData);
      return response.data;
    } catch (error) {
      throw new Error('Error al actualizar categoría: ' + error.message);
    }
  },
 
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      throw new Error('Error al eliminar categoría: ' + error.message);
    }
  }
};
 
export const productApi = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getCategories: () => api.get('/categories')
};

export const invoiceApi = {
  create: async (invoice) => {
    try {
      console.log('Procesando factura con datos:', invoice);
      
      // Asegurar que la factura fiada tiene el método de pago correcto
      if (invoice.isCredit && invoice.paymentMethod !== 'credit') {
        invoice.paymentMethod = 'credit';
      }
      
      const response = await api.post('/newinvoices', invoice);
      console.log('Respuesta del servidor al crear factura:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error detallado al crear factura:', error);
      if (error.response) {
        console.error('Código de estado:', error.response.status);
        console.error('Datos de respuesta:', error.response.data);
      }
      throw error;
    }
  },
  
  getAll: async () => {
    try {
      const response = await api.get('/newinvoices');
      return response.data;
    } catch (error) {
      console.error('Error al obtener facturas:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/newinvoices/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener factura con ID ${id}:`, error);
      throw error;
    }
  }
};
  

export const dashboardService = {
  getData: async (period = 'day', timestamp = null) => {
    try {
      // Convertir período al formato esperado por la API
      let apiPeriod;
      switch (period) {
        case 'day': apiPeriod = 'today'; break;
        case 'week': apiPeriod = 'week'; break;
        case 'month': apiPeriod = 'month'; break;
        case 'year': apiPeriod = 'year'; break;
        default: apiPeriod = 'today';
      }
      
      // Añadir timestamp para evitar problemas de caché
      if (!timestamp) timestamp = new Date().getTime();
      
      // Llamar a la API de dashboard
      const response = await api.get(`/dashboard/${apiPeriod}`);
      
      // Verificar la respuesta
      if (response && response.data) {
        return response.data;
      } else {
        console.warn('Respuesta de API incorrecta:', response);
        throw new Error('Formato de respuesta incorrecto');
      }
    } catch (error) {
      console.error('Error en dashboardService.getData:', error);
      throw error;
    }
  },
  
  getDetailedStats: async (period = 'week') => {
    try {
      const response = await api.get(`/dashboard/stats/${period}`);
      
      if (response && response.data) {
        return response.data;
      } else {
        throw new Error('Formato de respuesta incorrecto');
      }
    } catch (error) {
      console.error('Error en dashboardService.getDetailedStats:', error);
      throw error;
    }
  }
};

// API para clientes
export const clienteApi = {
  getAll: async () => {
    try {
      const response = await api.get('/clientes');
      return response.data;
    } catch (error) {
      console.error('Error al obtener clientes:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el cliente con ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (clienteData) => {
    try {
      const response = await api.post('/clientes', clienteData);
      return response.data;
    } catch (error) {
      console.error('Error al crear el cliente:', error);
      throw error;
    }
  },
  
  update: async (id, clienteData) => {
    try {
      const response = await api.put(`/clientes/${id}`, clienteData);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar el cliente con ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/clientes/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el cliente con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Nuevo método para búsqueda de clientes
  search: async (term) => {
    try {
      const response = await api.get(`/clientes/search?term=${term}`);
      return response.data;
    } catch (error) {
      console.error('Error al buscar clientes:', error);
      throw error;
    }
  },
  
  // Método para obtener estadísticas de clientes
  getStats: async () => {
    try {
      const response = await api.get('/clientes/stats');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estadísticas de clientes:', error);
      throw error;
    }
  },

  // NUEVOS MÉTODOS PARA GESTIÓN DE DEUDAS

  // Obtener clientes con deudas pendientes
  getClientesDeuda: async () => {
    try {
      const response = await api.get('/clientes/deudas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener clientes con deudas:', error);
      throw error;
    }
  },

  // Saldar deuda completa de un cliente
  saldarDeuda: async (clienteId) => {
    try {
      const response = await api.post('/clientes/saldar-deuda', { clienteId });
      return response.data;
    } catch (error) {
      console.error('Error al saldar deuda del cliente:', error);
      throw error;
    }
  },

  // Abonar a la deuda de un cliente
  abonarDeuda: async (clienteId, montoAbono) => {
    try {
      const response = await api.post('/clientes/abonar-deuda', { 
        clienteId, 
        montoAbono 
      });
      return response.data;
    } catch (error) {
      console.error('Error al abonar a la deuda del cliente:', error);
      throw error;
    }
  }
};

// API para proveedores
export const providerApi = {
  getAll: async () => {
    try {
      const response = await api.get('/providers');
      return response.data;
    } catch (error) {
      console.error('Error al obtener proveedores:', error);
      throw error;
    }
  },
  
  getById: async (id) => {
    try {
      const response = await api.get(`/providers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener el proveedor con ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (providerData) => {
    try {
      const response = await api.post('/providers', providerData);
      return response.data.data; // Los proveedores devuelven la data dentro de un objeto con .data
    } catch (error) {
      console.error('Error al crear el proveedor:', error);
      throw error;
    }
  },
  
  update: async (id, providerData) => {
    try {
      const response = await api.put(`/providers/${id}`, providerData);
      return response.data.data; // Los proveedores devuelven la data dentro de un objeto con .data
    } catch (error) {
      console.error(`Error al actualizar el proveedor con ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (id) => {
    try {
      const response = await api.delete(`/providers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar el proveedor con ID ${id}:`, error);
      throw error;
    }
  },
  
  getProducts: async (id) => {
    try {
      const response = await api.get(`/providers/${id}/products`);
      return response.data.data;
    } catch (error) {
      console.error(`Error al obtener productos del proveedor con ID ${id}:`, error);
      throw error;
    }
  }
};

export default api;