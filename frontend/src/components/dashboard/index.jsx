/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
// src/components/Dashboard/index.jsx
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
//import { dashboardService } from '../../config/dashboardService';
import { dashboardService, authService } from '../../config/servicesApi';
import LoadingSpinner from '../common/LoadingSpinner';
import TotalVentas from './TotalVentas';
import FacturasCreadas from './FacturasCreadas';
import BalanceNeto from './BalanceNeto';
import TotalClientes from './TotalClientes';
import { RefreshCw } from 'lucide-react';
import VentasDiariasChart from './VentasDiariasChart';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  // Añadimos el estado para el uso de datos de ejemplo
  const [isUsingMock, setIsUsingMock] = useState(false);
  // Establecemos 'day' como valor predeterminado para mantener compatibilidad
  const [period] = useState('day');

  const fetchDashboardData = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // Verificar autenticación antes de hacer la petición
      if (!authService.isAuthenticated()) {
        console.warn('No hay token de autenticación');
        authService.logout();
        return;
      }
      
      // Obtener datos del dashboard
      const data = await dashboardService.getData(period);
      
      // Transformar datos si es necesario
      if (data) {
        // Asegurarse de que todos los objetos existan
        if (!data.gastos) {
          data.gastos = { 
            hoy: 0, 
            esteMes: 0,
            diaDescontable: data.totalGastos?.hoy || 0,
            mesDescontable: data.totalGastos?.esteMes || 0
          };
        } else if (data.totalGastos) {
          // Si tenemos totalGastos, añadir los descontables
          data.gastos.diaDescontable = data.totalGastos.hoy || 0;
          data.gastos.mesDescontable = data.totalGastos.esteMes || 0;
        }
        
        // Añadir balanceNeto si no existe
        if (!data.balanceNeto && data.totalVentas && data.totalGastos) {
          data.balanceNeto = {
            hoy: (data.totalVentas.hoy || 0) - (data.totalGastos.hoy || 0),
            esteMes: (data.totalVentas.esteMes || 0) - (data.totalGastos.esteMes || 0)
          };
        }
      }
      
      setDashboardData(data);
      setIsUsingMock(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      
      if (error.status === 401) {
        console.warn('Error de autenticación, redirigiendo a login');
        authService.logout();
        return;
      }
      
      // Si es otro tipo de error, mostramos mensaje y usamos datos simulados
      setError('Hubo un problema al cargar los datos. Se muestran datos de ejemplo.');
      setIsUsingMock(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDashboardData(false);
    
    // Actualización automática cada 5 minutos
    const intervalId = setInterval(() => {
      fetchDashboardData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [fetchDashboardData]);

  // Manejador para actualización manual
  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  // Mostrar spinner mientras carga inicialmente
  if (isLoading && !dashboardData) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center">
        <LoadingSpinner size="lg" message="Cargando dashboard..." />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-100 p-6"
    >
      {/* Encabezado con botón de actualización */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800">
            Bienvenido a Facturas.
          </h1>
          <p className="text-gray-600">
            Aquí podrá encontrar algunos indicadores
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span>Actualizando...</span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              <span>Actualizar</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Grid para contenido principal */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tarjetas de estadísticas */}
        <div className="md:col-span-1 space-y-6">
          <TotalVentas data={dashboardData?.totalVentas} />
          <BalanceNeto data={dashboardData?.balanceNeto} />
          <FacturasCreadas data={dashboardData?.facturasCreadas} />
        </div>

        {/* Gráfico de ventas diarias - Pasar los datos del dashboard */}
        <div className="md:col-span-2">
          <VentasDiariasChart dashboardData={dashboardData} />
        </div>
      </div>

      {/* Sección inferior - Clientes */}
      <div className="mt-6">
        <TotalClientes data={dashboardData?.clientes} />
      </div>
    </motion.div>
  );
};

export default Dashboard;