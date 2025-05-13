/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
// src/components/Dashboard/VentasDiariasChart.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw, MoreVertical, ChevronLeft, ChevronRight, ChevronDown, X, Calendar, Search } from 'lucide-react';
import axios from 'axios';
import LoadingSpinner from '../common/LoadingSpinner';

// Configuración de axios para las solicitudes API
const apiUrl = 'http://localhost:4000/api';

const VentasDiariasChart = () => {
  const [showAllSales, setShowAllSales] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [salesPerPage, setSalesPerPage] = useState(5);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Función para obtener datos desde el backend
  const fetchDailySales = async (forceRefresh = false) => {
    if (isLoading && !forceRefresh) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener el token de autenticación
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.warn('No hay token de autenticación disponible');
        setIsLoading(false);
        return;
      }
      
      // Crear fecha para filtrar por mes y año específicos
      const filterDate = new Date(selectedYear, selectedMonth - 1, 1);
      const today = new Date();
      
      // Si el filtro es para el mes actual, solo mostrar hasta hoy
      const isCurrentMonth = selectedMonth === today.getMonth() + 1 && selectedYear === today.getFullYear();
      
      // Determinar fechas de inicio y fin
      let startDate, endDate;
      
      startDate = new Date(filterDate);
      startDate.setHours(0, 0, 0, 0);
      
      if (isCurrentMonth) {
        // Si es el mes actual, usar la fecha actual como fin
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);
      } else {
        // Si es otro mes, usar el último día del mes
        endDate = new Date(selectedYear, selectedMonth, 0);
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Formatear fechas para la API en formato ISO sin zona horaria (YYYY-MM-DD)
      const formatDate = (date) => {
        return date.toISOString().split('T')[0];
      };
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      // Prevenir caché con timestamp
      const timestamp = new Date().getTime();
      
      // Hacer la solicitud para obtener ventas diarias paginadas
      const response = await axios.get(
        `${apiUrl}/dashboard/daily-sales?startDate=${formattedStartDate}&endDate=${formattedEndDate}&page=${currentPage}&limit=${showAllSales ? 50 : salesPerPage}&sortBy=fecha&order=desc&t=${timestamp}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Verificar si la respuesta tiene el formato esperado
      if (response.data && response.data.success && response.data.data) {
        // Extraer las ventas y la información de paginación
        const { sales, pagination } = response.data.data;
        
        if (Array.isArray(sales) && sales.length > 0) {
          // Normalizar los datos para el gráfico - cada venta es un día
          const normalizedData = sales.map(item => {
            // Formatear la fecha para mostrar en el gráfico
            const fecha = new Date(item.fecha);
            const formattedDate = `${fecha.getDate()}/${fecha.getMonth() + 1}/${fecha.getFullYear()}`;
            
            return {
              name: formattedDate, // Usar fecha como nombre
              total: item.totalVentas || 0,
              cantidad: item.cantidadFacturas || 0,
              fecha: item.fecha, // Mantener fecha original para ordenar
            };
          });
          
          // Ordenar por fecha (más reciente primero)
          normalizedData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          
          setChartData(normalizedData);
          setTotalPages(pagination?.totalPages || 1);
        } else {
          // Si no hay ventas, usar array vacío
          setChartData([]);
          setTotalPages(1);
          console.log('No hay ventas registradas en este período');
        }
      } else {
        // Si la respuesta no tiene el formato esperado
        console.warn('Formato de respuesta incorrecto:', response.data);
        setChartData([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error al obtener ventas diarias:', error);
      setError('Error al cargar las ventas. Por favor, intente de nuevo.');
      
      // Usar datos de ejemplo en caso de error
      setChartData(getDummySalesData());
      setTotalPages(Math.ceil(chartData.length / salesPerPage));
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar datos cuando cambia el mes, año o página
  useEffect(() => {
    fetchDailySales();
    
    // Actualización automática cada 5 minutos
    const intervalId = setInterval(() => fetchDailySales(), 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [selectedMonth, selectedYear, currentPage, salesPerPage, showAllSales]);
  
  // Función auxiliar para datos de ejemplo en caso de error
  const getDummySalesData = () => {
    const today = new Date();
    const data = [];
    
    // Generar datos de venta diaria para el mes actual
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const formattedDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      
      data.push({
        name: formattedDate,
        total: Math.round(1000 + Math.random() * 5000),
        cantidad: Math.round(3 + Math.random() * 10),
        fecha: date.toISOString()
      });
    }
    
    return data;
  };
  
  // Obtener datos para la página actual
  const getCurrentPageData = () => {
    // Si estamos mostrando todos, devolvemos todos los datos
    if (showAllSales) {
      return chartData;
    }
    
    // Si no, calculamos qué datos mostrar según la página actual
    const startIndex = 0;
    const endIndex = salesPerPage;
    return chartData.slice(startIndex, endIndex);
  };
  
  // Datos a mostrar en el gráfico
  const displayData = getCurrentPageData();
  
  // Función para actualizar manualmente
  const handleRefresh = () => {
    if (!isLoading) {
      fetchDailySales(true);
    }
  };
  
  // Alternar entre ver todos o paginado
  const toggleShowAllSales = () => {
    setShowAllSales(!showAllSales);
    if (showAllSales) {
      setCurrentPage(1);
    }
  };
  
  // Abrir modal con todas las ventas
  const openFullSalesModal = () => {
    setShowModal(true);
  };
  
  // Cambiar de página
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  // Cambiar cantidad de ventas por página
  const handleSalesPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setSalesPerPage(value);
    setCurrentPage(1); // Reset a la primera página
  };
  
  // Manejar cambio de mes
  const handleMonthChange = (e) => {
    setSelectedMonth(parseInt(e.target.value));
  };
  
  // Manejar cambio de año
  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };
  
  // Aplicar filtro de fecha
  const applyDateFilter = () => {
    setCurrentPage(1);
    fetchDailySales(true);
    setShowDateFilter(false);
  };
  
  // Mostrar/ocultar filtro de fecha
  const toggleDateFilter = () => {
    setShowDateFilter(!showDateFilter);
  };
  
  // Tooltip personalizado para el gráfico
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-md shadow-lg border border-gray-200">
          <p className="font-medium text-gray-700">{label}</p>
          <p className="text-green-600">
            <span className="font-bold">RD$ {payload[0].value.toLocaleString()}</span>
          </p>
          {payload[0].payload.cantidad && (
            <p className="text-blue-600">
              <span className="font-bold">{payload[0].payload.cantidad}</span> facturas
            </p>
          )}
        </div>
      );
    }
    return null;
  };
  
  // Formatear el título del mes actual
  const getMonthName = (month) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return monthNames[month - 1];
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Ventas Diarias {getMonthName(selectedMonth)} {selectedYear}
        </h2>
        <div className="flex gap-2">
          {/* Botón de filtro por fecha */}
          <button
            onClick={toggleDateFilter}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="Filtrar por fecha"
          >
            <Calendar className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isLoading}
            title="Actualizar datos"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" message="" />
            ) : (
              <RefreshCw className="w-5 h-5" />
            )}
          </button>
          <button 
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={openFullSalesModal}
            title="Ver todas las ventas"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Filtro por fecha */}
      {showDateFilter && (
        <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Mes</label>
              <select 
                value={selectedMonth} 
                onChange={handleMonthChange}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {getMonthName(i + 1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Año</label>
              <select 
                value={selectedYear} 
                onChange={handleYearChange}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - 2 + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <button
              onClick={applyDateFilter}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center"
            >
              <Search className="w-4 h-4 mr-2" />
              <span>Buscar</span>
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <p>{error}</p>
        </div>
      )}

      <div className="h-64">
        {isLoading ? (
          <div className="h-full flex justify-center items-center">
            <LoadingSpinner message="Cargando datos..." />
          </div>
        ) : displayData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fill: '#6B7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="total" 
                fill="#ff6b81" 
                radius={[4, 4, 0, 0]}
                barSize={40}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex justify-center items-center text-gray-500">
            No hay datos de ventas disponibles para este período.
          </div>
        )}
      </div>

      {/* Controles de paginación */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-gray-500 text-sm">
          <p>Los gráficos se actualizan cada vez que se carga la página</p>
        </div>
        
        {!showAllSales && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`p-1 rounded ${currentPage === 1 ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-100'}`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`p-1 rounded ${currentPage === totalPages ? 'text-gray-400' : 'text-blue-600 hover:bg-blue-100'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <select 
              value={salesPerPage}
              onChange={handleSalesPerPageChange}
              className="ml-2 text-sm border rounded p-1"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={15}>15 por página</option>
            </select>
          </div>
        )}
        
        {chartData.length > salesPerPage && (
          <button
            onClick={toggleShowAllSales}
            className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
          >
            {showAllSales ? (
              <>
                <span>Mostrar paginado</span>
                <ChevronDown className="ml-1 w-4 h-4" />
              </>
            ) : (
              <>
                <span>Ver todos</span>
                <ChevronRight className="ml-1 w-4 h-4" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Modal para ver todas las ventas */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Ventas Diarias de {getMonthName(selectedMonth)} {selectedYear}</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto flex-grow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Ventas
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cantidad Facturas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((sale, index) => (
                    <tr key={`${sale.name}-${index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{sale.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 font-semibold">
                          RD$ {sale.total?.toLocaleString() || '0'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900">
                          {sale.cantidad}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-gray-600 text-sm">
                Total: {chartData.length} días
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VentasDiariasChart;