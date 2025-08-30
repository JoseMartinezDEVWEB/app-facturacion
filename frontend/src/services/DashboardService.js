// DashboardService.js
import axiosInstance from '../config/axiosConfig';
import { API_ROUTES } from '../config/config';

// Tipos de datos para el dashboard
const DEFAULT_DASHBOARD_DATA = {
  ventas: {
    hoy: {
      total: 0,
      facturas: 0,
      pendientes: 0
    },
    mes: {
      total: 0,
      facturas: 0,
      pendientes: 0
    }
  },
  clientes: {
    total: 0,
    cuentasPendientes: 0,
    cuentasVendidas: 0
  },
  productos: {
    total: 0,
    servicios: 0,
    topVendidos: []
  },
  gastos: {
    hoy: 0,
    mes: 0
  },
  balance: {
    hoy: 0,
    mes: 0
  }
};

class DashboardService {
  constructor() {
    this.data = { ...DEFAULT_DASHBOARD_DATA };
    this.loading = false;
    this.error = null;
    this.lastUpdate = null;
    this.listeners = new Set();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
  }

  // Método para suscribirse a cambios
  subscribe(callback) {
    this.listeners.add(callback);
    // Devolver función para desuscribirse
    return () => this.listeners.delete(callback);
  }

  // Notificar a todos los componentes suscritos
  notifyListeners() {
    this.listeners.forEach(callback => callback({
      data: this.data,
      loading: this.loading,
      error: this.error
    }));
  }

  // Validar y normalizar datos del dashboard
  validateAndNormalizeData(data) {
    try {
      return {
        ventas: {
          hoy: {
            total: Number(data.ventasConfirmadasHoy) || 0,
            facturas: Number(data.totalFacturasHoy) || 0,
            pendientes: Number(data.ventasPendientesHoy) || 0
          },
          mes: {
            total: Number(data.ventasConfirmadasMes) || 0,
            facturas: Number(data.totalFacturasMes) || 0,
            pendientes: Number(data.ventasPendientesMes) || 0
          }
        },
        clientes: {
          total: Number(data.totalClientes) || 0,
          cuentasPendientes: Number(data.cuentasPendientes) || 0,
          cuentasVendidas: Number(data.cuentasVendidas) || 0
        },
        productos: {
          total: Number(data.productosCount) || 0,
          servicios: Number(data.serviciosCount) || 0,
          topVendidos: Array.isArray(data.topProducts) ? data.topProducts : []
        },
        gastos: {
          hoy: Number(data.gastosHoy) || 0,
          mes: Number(data.gastosMes) || 0
        },
        balance: {
          hoy: Number(data.balanceHoy) || 0,
          mes: Number(data.balanceMes) || 0
        }
      };
    } catch (error) {
      console.error('Error al validar datos del dashboard:', error);
      return { ...DEFAULT_DASHBOARD_DATA };
    }
  }

  // Verificar si los datos en caché son válidos
  isCacheValid() {
    return this.lastUpdate && (Date.now() - this.lastUpdate < this.cacheTimeout);
  }

  // Actualizar datos desde la API
  async fetchDashboardData(forceRefresh = false) {
    if (this.loading) return;
    if (!forceRefresh && this.isCacheValid()) return;

    this.loading = true;
    this.error = null;
    this.notifyListeners();

    try {
      const timestamp = new Date().getTime();
      const response = await axiosInstance.get(`${API_ROUTES.DASHBOARD}/data?t=${timestamp}`);

      if (response.data && response.data.success) {
        this.data = this.validateAndNormalizeData(response.data.data);
        this.lastUpdate = Date.now();
      } else {
        throw new Error('Formato de respuesta incorrecto');
      }
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      this.error = error.message || 'Error al cargar datos del dashboard';
    } finally {
      this.loading = false;
      this.notifyListeners();
    }
  }

  // Obtener productos más vendidos
  async getTopProducts(limit = 5) {
    try {
      const response = await axiosInstance.get(`${API_ROUTES.DASHBOARD}/top-products?limit=${limit}`);
      
      if (response.data && response.data.success) {
        this.data.productos.topVendidos = response.data.data || [];
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      throw error;
    }
  }

  // Obtener estadísticas detalladas
  async getDetailedStats(period = 'today') {
    try {
      const response = await axiosInstance.get(`${API_ROUTES.DASHBOARD}/stats?period=${period}`);
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error('Formato de respuesta incorrecto');
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      throw error;
    }
  }

  // Obtener ventas diarias
  async getDailySales(startDate, endDate) {
    try {
      const response = await axiosInstance.get(
        `${API_ROUTES.DASHBOARD}/daily-sales?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.data && response.data.success) {
        return response.data.data;
      }
      throw new Error('Formato de respuesta incorrecto');
    } catch (error) {
      console.error('Error al obtener ventas diarias:', error);
      throw error;
    }
  }

  // Método para obtener datos actuales
  getData() {
    return {
      data: this.data,
      loading: this.loading,
      error: this.error,
      lastUpdate: this.lastUpdate
    };
  }

  // Método para forzar actualización de datos
  refreshData() {
    return this.fetchDashboardData(true);
  }
}

// Exportar una instancia única del servicio (patrón Singleton)
export const dashboardService = new DashboardService();