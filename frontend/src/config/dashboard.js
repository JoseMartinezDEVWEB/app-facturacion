// api/dashboard.js
import api from './api'; // Asegúrate de importar correctamente tu instancia de axios

export const dashboardApi = {
  getData: async (period = 'today') => {
    try {
      // Agregar tiempo actual como parámetro para evitar caché
      const timestamp = new Date().getTime();
      const response = await api.get(`/dashboard/data?period=${period}&t=${timestamp}`);
      
      // Asegurar que la respuesta tenga la estructura esperada
      if (response.data && response.data.success) {
        const data = response.data.data || {};
        
        // Normalizar los datos para evitar problemas con valores nulos o undefined
        return {
          success: true,
          data: {
            totalVentas: {
              hoy: parseFloat(data.totalVentas?.hoy) || 0,
              esteMes: parseFloat(data.totalVentas?.esteMes) || 0,
              pendientesHoy: parseFloat(data.totalVentas?.pendientesHoy) || 0,
              pendientesMes: parseFloat(data.totalVentas?.pendientesMes) || 0
            },
            balanceNeto: {
              hoy: parseFloat(data.balanceNeto?.hoy) || 0,
              esteMes: parseFloat(data.balanceNeto?.esteMes) || 0
            },
            facturasCreadas: {
              hoy: parseInt(data.facturasCreadas?.hoy) || 0,
              esteMes: parseInt(data.facturasCreadas?.esteMes) || 0,
              confirmadasHoy: parseInt(data.facturasCreadas?.confirmadasHoy) || 0,
              pendientesHoy: parseInt(data.facturasCreadas?.pendientesHoy) || 0
            },
            gastos: data.gastos || { hoy: 0, esteMes: 0 },
            clientes: data.clientes || { 
              totalClientes: 0, 
              cuentasPendientes: 0, 
              cuentasVendidas: 0 
            },
            productosServicios: data.productosServicios || {
              totalProductos: 0,
              totalServicios: 0
            }
          }
        };
      } else {
        console.error('Respuesta de API incorrecta:', response.data);
        throw new Error('Formato de respuesta incorrecto');
      }
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      
      // Datos de fallback para desarrollo
      return {
        success: true,
        data: {
          totalVentas: {
            hoy: 1449.40,
            esteMes: 12624.08,
            pendientesHoy: 0,
            pendientesMes: 0
          },
          facturasCreadas: {
            hoy: 6,
            esteMes: 34,
            confirmadasHoy: 6,
            pendientesHoy: 0
          },
          balanceNeto: {
            hoy: 1449.40,
            esteMes: 12624.08
          },
          gastos: {
            hoy: 0,
            esteMes: 0
          },
          clientes: {
            totalClientes: 13,
            cuentasPendientes: 2188.55,
            cuentasVendidas: 205
          },
          productosServicios: {
            totalProductos: 10,
            totalServicios: 0
          }
        },
        error: error.message
      };
    }
  },
  
  getDetailedStats: async (period = 'week') => {
    try {
      const timestamp = new Date().getTime();
      const response = await api.get(`/dashboard/stats?period=${period}&t=${timestamp}`);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Formato de respuesta incorrecto');
      }
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      
      // Datos de muestra para desarrollo
      return {
        success: true,
        data: {
          detailedStats: [
            {
              _id: { year: 2025, month: 3, day: 30 },
              totalVentas: 1449.4,
              cantidadFacturas: 6,
              promedioVenta: 241.57
            },
            {
              _id: { year: 2025, month: 3, day: 29 },
              totalVentas: 2188.55,
              cantidadFacturas: 8,
              promedioVenta: 273.57
            },
            {
              _id: { year: 2025, month: 3, day: 28 },
              totalVentas: 3215.65,
              cantidadFacturas: 10,
              promedioVenta: 321.57
            }
          ],
          productosTopVendidos: [
            { nombre: "Galleta Princesa", cantidad: 12, ingresos: 720 },
            { nombre: "Coca-Cola", cantidad: 8, ingresos: 400 },
            { nombre: "Arroz Campo", cantidad: 5, ingresos: 750 },
            { nombre: "Rica 100%", cantidad: 4, ingresos: 300 },
            { nombre: "Carne de Res", cantidad: 3, ingresos: 900 }
          ]
        }
      };
    }
  },
  
  getSalesReport: async (startDate, endDate) => {
    try {
      const response = await api.get(`/sales?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener reporte de ventas:', error);
      throw error;
    }
  },
  
  downloadInvoice: async (saleId) => {
    try {
      const response = await api.get(`/sales/${saleId}/pdf`, { responseType: 'blob' });
      return response.data;
    } catch (error) {
      console.error('Error al descargar factura:', error);
      throw error;
    }
  }
};

// Parte del archivo servicesApi.js que corresponde al servicio de dashboard


  export const dashboardService = {
    getData: async (period = 'day', timestamp = new Date().getTime()) => {
      try {
        // Convertir período a formato esperado por la API
        let apiPeriod = 'today';
        switch (period) {
          case 'day': apiPeriod = 'today'; break;
          case 'week': apiPeriod = 'week'; break;
          case 'month': apiPeriod = 'month'; break;
          case 'year': apiPeriod = 'year'; break;
          default: apiPeriod = 'today';
        }
        
        const response = await api.get(`/dashboard/data?period=${apiPeriod}&t=${timestamp}`);
        
        if (response.data && response.data.success) {
          // Normalizar la respuesta para asegurar que todos los campos esperados existan
          const data = response.data.data || {};
          
          return {
            totalVentas: {
              hoy: parseFloat(data.totalVentas?.hoy) || 0,
              esteMes: parseFloat(data.totalVentas?.esteMes) || 0,
              pendientesHoy: parseFloat(data.totalVentas?.pendientesHoy) || 0,
              pendientesMes: parseFloat(data.totalVentas?.pendientesMes) || 0
            },
            balanceNeto: {
              hoy: parseFloat(data.balanceNeto?.hoy) || 0,
              esteMes: parseFloat(data.balanceNeto?.esteMes) || 0
            },
            facturasCreadas: {
              hoy: parseInt(data.facturasCreadas?.hoy) || 0,
              esteMes: parseInt(data.facturasCreadas?.esteMes) || 0,
              confirmadasHoy: parseInt(data.facturasCreadas?.confirmadasHoy) || 0,
              pendientesHoy: parseInt(data.facturasCreadas?.pendientesHoy) || 0
            },
            gastos: data.gastos || { hoy: 0, esteMes: 0 },
            clientes: data.clientes || { 
              totalClientes: 0, 
              cuentasPendientes: 0, 
              cuentasVendidas: 0 
            },
            productosServicios: data.productosServicios || {
              totalProductos: 0,
              totalServicios: 0
            },
            productosTopVendidos: data.productosTopVendidos || []
          };
        } else {
          throw new Error('Formato de respuesta incorrecto');
        }
      } catch (error) {
        console.error('Error en dashboardService.getData:', error);
        throw error;
      }
    },
    
    getDetailedStats: async (period = 'week', timestamp = new Date().getTime()) => {
      try {
        const response = await api.get(`/dashboard/stats?period=${period}&t=${timestamp}`);
        
        if (response.data && response.data.success) {
          return response.data.data;
        } else {
          throw new Error('Formato de respuesta incorrecto');
        }
      } catch (error) {
        console.error('Error en dashboardService.getDetailedStats:', error);
        throw error;
      }
    }
  };