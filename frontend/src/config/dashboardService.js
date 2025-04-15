// src/services/dashboardService.js
import api from './apis'; // Asumiendo que tienes un archivo api.js base

/**
 * Servicio para obtener datos del dashboard
 */
export const dashboardService = {
  /**
   * Obtiene los datos generales del dashboard
   * @param {string} period - Período de tiempo ('day', 'week', 'month', 'year')
   * @returns {Promise} Promesa con los datos del dashboard
   */
  getData: async (period = 'day') => {
    try {
      // Añadir timestamp para evitar caché
      const timestamp = new Date().getTime();
      
      // Convertir período al formato esperado por la API
      let apiPeriod;
      switch (period) {
        case 'day': apiPeriod = 'today'; break;
        case 'week': apiPeriod = 'week'; break;
        case 'month': apiPeriod = 'month'; break;
        case 'year': apiPeriod = 'year'; break;
        default: apiPeriod = 'today';
      }
      
      console.log(`Obteniendo datos del dashboard para periodo: ${apiPeriod}`);
      const response = await api.get(`/dashboard/data?period=${apiPeriod}&t=${timestamp}`);
      
      if (response && response.success) {
        return response.data;
      } else {
        console.warn('Formato de respuesta incorrecto, usando datos de fallback');
        return getDummyData(period);
      }
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      return getDummyData(period);
    }
  },
  
  /**
   * Obtiene los productos más vendidos con soporte para paginación
   * @param {Object} options - Opciones de consulta
   * @param {string} options.period - Período ('day', 'week', 'month', 'year')
   * @param {number} options.page - Número de página
   * @param {number} options.limit - Elementos por página
   * @param {string} options.sortBy - Campo para ordenar ('cantidad', 'ingresos')
   * @param {string} options.order - Orden ('asc', 'desc')
   * @returns {Promise} Promesa con los productos más vendidos
   */
  getTopProducts: async (options = {}) => {
    try {
      // Valores por defecto
      const { 
        period = 'day', 
        page = 1, 
        limit = 10, 
        sortBy = 'cantidad', 
        order = 'desc' 
      } = options;
      
      // Convertir período al formato esperado por la API
      let apiPeriod;
      switch (period) {
        case 'day': apiPeriod = 'today'; break;
        case 'week': apiPeriod = 'week'; break;
        case 'month': apiPeriod = 'month'; break;
        case 'year': apiPeriod = 'year'; break;
        default: apiPeriod = 'today';
      }
      
      // Añadir timestamp para evitar caché
      const timestamp = new Date().getTime();
      
      // Hacer la solicitud al endpoint
      const response = await api.get(
        `/dashboard/top-products?period=${apiPeriod}&page=${page}&limit=${limit}&sortBy=${sortBy}&order=${order}&t=${timestamp}`
      );
      
      if (response && response.success) {
        return response.data;
      } else {
        console.warn('Formato de respuesta incorrecto, usando datos de prueba');
        return getDummyTopProducts(options);
      }
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      return getDummyTopProducts(options);
    }
  }
};

/**
 * Genera datos de ejemplo para el dashboard cuando la API falla
 * @param {string} period - Período de tiempo
 * @returns {Object} Datos simulados del dashboard
 */
function getDummyData(period) {
  // Datos base
  const baseData = {
    totalVentas: {
      hoy: 1449.40,
      esteMes: 12624.08,
      pendientesHoy: 245.50,
      pendientesMes: 944.15
    },
    facturasCreadas: {
      hoy: 6,
      esteMes: 34,
      confirmadasHoy: 5,
      pendientesHoy: 1
    },
    balanceNeto: {
      hoy: 1449.40,
      esteMes: 12624.08
    },
    clientes: {
      totalClientes: 13,
      cuentasPendientes: 2188.55,
      cuentasVendidas: 205
    }
  };
  
  // Productos más vendidos
  const productosBase = [
    { nombre: "Galleta Princesa", cantidad: 12, ingresos: 720 },
    { nombre: "Coca-Cola", cantidad: 8, ingresos: 400 },
    { nombre: "Arroz Campo", cantidad: 5, ingresos: 750 },
    { nombre: "Rica 100%", cantidad: 4, ingresos: 300 },
    { nombre: "Carne de Res", cantidad: 3, ingresos: 900 },
    { nombre: "Pan Integral", cantidad: 3, ingresos: 150 },
    { nombre: "Queso Blanco", cantidad: 2, ingresos: 400 },
    { nombre: "Jugo Naranja", cantidad: 2, ingresos: 160 },
    { nombre: "Aceite Vegetal", cantidad: 2, ingresos: 380 },
    { nombre: "Leche Entera", cantidad: 2, ingresos: 240 },
    { nombre: "Pasta Dental", cantidad: 1, ingresos: 85 },
    { nombre: "Jabón Tocador", cantidad: 1, ingresos: 65 },
    { nombre: "Papel Higiénico", cantidad: 1, ingresos: 120 },
    { nombre: "Atún Enlatado", cantidad: 1, ingresos: 95 },
    { nombre: "Galletas Saladas", cantidad: 1, ingresos: 45 }
  ];
  
  // Ajustar datos según el período
  let productosTopVendidos = [...productosBase];
  
  if (period === 'week') {
    productosTopVendidos = productosBase.map(p => ({
      ...p,
      cantidad: p.cantidad * 5,
      ingresos: p.ingresos * 5
    }));
  } else if (period === 'month') {
    productosTopVendidos = productosBase.map(p => ({
      ...p,
      cantidad: p.cantidad * 20,
      ingresos: p.ingresos * 20
    }));
  } else if (period === 'year') {
    productosTopVendidos = productosBase.map(p => ({
      ...p,
      cantidad: p.cantidad * 200,
      ingresos: p.ingresos * 200
    }));
  }
  
  return {
    ...baseData,
    productosTopVendidos
  };
}

/**
 * Genera datos de ejemplo para productos más vendidos con paginación
 * @param {Object} options - Opciones de consulta
 * @returns {Object} Datos simulados con paginación
 */
function getDummyTopProducts(options) {
  const { 
    period = 'day', 
    page = 1, 
    limit = 10, 
    sortBy = 'cantidad', 
    order = 'desc' 
  } = options;
  
  // Obtener datos de ejemplo según el período
  const data = getDummyData(period);
  const allProducts = data.productosTopVendidos;
  
  // Ordenar según los parámetros
  const sortOrder = order === 'asc' ? 1 : -1;
  const sortedProducts = [...allProducts].sort((a, b) => {
    return (a[sortBy] - b[sortBy]) * sortOrder;
  });
  
  // Aplicar paginación
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = sortedProducts.slice(startIndex, endIndex);
  
  return {
    products: paginatedProducts,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(allProducts.length / limit),
      totalItems: allProducts.length,
      itemsPerPage: limit
    }
  };
}