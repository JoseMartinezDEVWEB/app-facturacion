import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/DashboardService';

export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  });

  // Función para actualizar los datos
  const updateData = useCallback(({ data, loading, error, lastUpdate }) => {
    setDashboardData({ data, loading, error, lastUpdate });
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadData = async () => {
      try {
        await dashboardService.fetchDashboardData();
      } catch (error) {
        console.error('Error al cargar datos iniciales del dashboard:', error);
      }
    };

    loadData();
  }, []);

  // Suscribirse a actualizaciones
  useEffect(() => {
    const unsubscribe = dashboardService.subscribe(updateData);
    return () => unsubscribe();
  }, [updateData]);

  // Función para refrescar datos
  const refreshData = useCallback(async () => {
    try {
      await dashboardService.refreshData();
    } catch (error) {
      console.error('Error al refrescar datos del dashboard:', error);
    }
  }, []);

  // Función para obtener productos más vendidos
  const getTopProducts = useCallback(async (limit = 5) => {
    try {
      await dashboardService.getTopProducts(limit);
    } catch (error) {
      console.error('Error al obtener productos más vendidos:', error);
      throw error;
    }
  }, []);

  // Función para obtener estadísticas detalladas
  const getDetailedStats = useCallback(async (period = 'today') => {
    try {
      return await dashboardService.getDetailedStats(period);
    } catch (error) {
      console.error('Error al obtener estadísticas detalladas:', error);
      throw error;
    }
  }, []);

  // Función para obtener ventas diarias
  const getDailySales = useCallback(async (startDate, endDate) => {
    try {
      return await dashboardService.getDailySales(startDate, endDate);
    } catch (error) {
      console.error('Error al obtener ventas diarias:', error);
      throw error;
    }
  }, []);

  return {
    ...dashboardData,
    refreshData,
    getTopProducts,
    getDetailedStats,
    getDailySales
  };
}; 