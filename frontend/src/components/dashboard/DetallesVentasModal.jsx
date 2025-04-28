/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowDown, ArrowUp, Calendar, Filter, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import axios from 'axios';

const DetallesVentasModal = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [period, setPeriod] = useState('week');
  const [detailedStats, setDetailedStats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos del resumen
  const { confirmadasHoy, confirmadasMes, pendientesHoy, pendientesMes } = data || {};
  
  // Obtener estadísticas detalladas
  useEffect(() => {
    if (isOpen && activeTab === 'diario') {
      fetchDetailedStats();
    }
  }, [isOpen, activeTab, period]);
  
  const fetchDetailedStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseURL = import.meta.env.DEV ? 'http://localhost:4500' : '';
      const response = await axios.get(`${baseURL}/api/dashboard/stats?period=${period}`);
      
      if (response.data.success) {
        setDetailedStats(response.data.data.detailedStats || []);
      } else {
        throw new Error('No se pudieron cargar las estadísticas detalladas');
      }
    } catch (err) {
      console.error('Error al obtener estadísticas:', err);
      setError('No se pudieron cargar los datos. Por favor intente nuevamente.');
      
      // Datos de muestra para desarrollo
      setDetailedStats([
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
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // Si el modal no está abierto, no renderizar
  if (!isOpen) return null;
  
  // Obtener el nombre del mes
  const getMonthName = (month) => {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1];
  };
  
  // Formatear fecha para mostrar
  const formatDate = (year, month, day) => {
    return `${day} ${getMonthName(month)}, ${year}`;
  };
  
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <AnimatePresence>
        <motion.div
          className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Cabecera del modal */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold">Detalles de Ventas</h2>
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Pestañas */}
          <div className="flex border-b">
            <button
              className={`py-2 px-4 focus:outline-none ${
                activeTab === 'resumen' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('resumen')}
            >
              Resumen
            </button>
            <button
              className={`py-2 px-4 focus:outline-none ${
                activeTab === 'diario' ? 'text-blue-600 border-b-2 border-blue-600 font-medium' : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('diario')}
            >
              Ventas Diarias
            </button>
          </div>
          
          {/* Contenido */}
          <div className="p-4 overflow-y-auto flex-grow">
            {activeTab === 'resumen' ? (
              <div className="space-y-6">
                <h3 className="text-lg font-medium">Resumen de Ventas</h3>
                
                {/* Hoy */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <Calendar size={16} className="mr-1" /> HOY
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Ventas Confirmadas</div>
                      <div className="text-2xl font-bold text-gray-800 mt-1">
                        RD$ {confirmadasHoy.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Ventas Pendientes</div>
                      <div className="text-2xl font-bold text-amber-600 mt-1">
                        RD$ {pendientesHoy.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Este Mes */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                    <Calendar size={16} className="mr-1" /> ESTE MES
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Ventas Confirmadas</div>
                      <div className="text-2xl font-bold text-gray-800 mt-1">
                        RD$ {confirmadasMes.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded border">
                      <div className="text-sm text-gray-600">Ventas Pendientes</div>
                      <div className="text-2xl font-bold text-amber-600 mt-1">
                        RD$ {pendientesMes.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-500 mt-4">
                  <p>* Las ventas pendientes corresponden a facturas fiadas o a crédito.</p>
                  <p>* Solo las ventas confirmadas se incluyen en el cálculo del balance.</p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Ventas Diarias</h3>
                  
                  <div className="flex gap-2">
                    <div className="relative">
                      <Filter size={16} className="absolute left-2 top-2.5 text-gray-500" />
                      <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="pl-8 pr-2 py-2 border rounded text-sm focus:outline-none focus:border-blue-500"
                      >
                        <option value="week">Última semana</option>
                        <option value="month">Último mes</option>
                        <option value="year">Último año</option>
                      </select>
                    </div>
                    
                    <button className="px-3 py-2 border rounded text-sm flex items-center text-gray-600 hover:bg-gray-50">
                      <Download size={16} className="mr-1" />
                      Exportar
                    </button>
                  </div>
                </div>
                
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                ) : error ? (
                  <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded">
                    {error}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ventas Totales
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Facturas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Promedio por Venta
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailedStats.map((stat) => (
                          <tr key={`${stat._id.year}-${stat._id.month}-${stat._id.day}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {formatDate(stat._id.year, stat._id.month, stat._id.day)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="font-medium">
                                RD$ {stat.totalVentas.toLocaleString()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {stat.cantidadFacturas}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              RD$ {stat.promedioVenta.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Pie del modal */}
          <div className="p-4 border-t text-right">
            <button 
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded text-gray-800 hover:bg-gray-300"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default DetallesVentasModal;