/* eslint-disable react/prop-types */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { deleteExpense } from '../../services/expenseService';

const GastoList = ({ gastos, isLoading, onRefresh, onEdit }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDeductible, setFilterDeductible] = useState('all');
  const [filterDeductionPeriod, setFilterDeductionPeriod] = useState('all');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtrar gastos por término de búsqueda, categoría, opción de descuento y periodo
  const filteredGastos = gastos.filter((gasto) => {
    const matchesSearch = gasto.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (gasto.description && gasto.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = filterCategory === '' || gasto.category === filterCategory;
    
    // Filtro por tipo de descuento
    const matchesDeductible = 
      filterDeductible === 'all' || 
      (filterDeductible === 'deductible' && gasto.deductFromSales) || 
      (filterDeductible === 'non-deductible' && !gasto.deductFromSales);
    
    // Filtro por periodo de descuento
    const matchesDeductionPeriod = 
      filterDeductionPeriod === 'all' || 
      (filterDeductionPeriod === 'day' && gasto.deductionPeriod === 'day') || 
      (filterDeductionPeriod === 'month' && gasto.deductionPeriod === 'month') ||
      // Si no es descontable, ignorar el filtro de periodo
      (!gasto.deductFromSales && filterDeductionPeriod !== 'all');
    
    return matchesSearch && matchesCategory && matchesDeductible && matchesDeductionPeriod;
  });
  
  // Formatear fecha
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Formatear monto
  const formatAmount = (amount) => {
    return `RD$ ${amount.toFixed(2)}`;
  };
  
  // Manejar eliminación de gasto
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este gasto?')) {
      setIsDeleting(true);
      try {
        await deleteExpense(id);
        // Actualizar la lista llamando a la función onRefresh pasada como prop
        onRefresh && onRefresh();
      } catch (error) {
        console.error('Error al eliminar el gasto:', error);
        alert('Error al eliminar el gasto. Por favor, intenta de nuevo.');
      } finally {
        setIsDeleting(false);
      }
    }
  };
  
  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h3 className="text-lg font-bold">Lista de Gastos</h3>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar gastos..."
              className="w-full md:w-64 px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
          
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="">Todas las categorías</option>
            <option value="Operativo">Operativo</option>
            <option value="Material">Material</option>
            <option value="Servicio">Servicio</option>
            <option value="Otro">Otro</option>
          </select>
          
          <select
            value={filterDeductible}
            onChange={(e) => setFilterDeductible(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="all">Todos los gastos</option>
            <option value="deductible">Descontados de ventas</option>
            <option value="non-deductible">No descontados</option>
          </select>
          
          {filterDeductible === 'deductible' && (
            <select
              value={filterDeductionPeriod}
              onChange={(e) => setFilterDeductionPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="all">Todos los periodos</option>
              <option value="day">Descuentos diarios</option>
              <option value="month">Descuentos mensuales</option>
            </select>
          )}
        </div>
      </div>
      
      {filteredGastos.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <h3 className="text-lg font-medium mb-1">No hay gastos</h3>
          <p>No se encontraron gastos con los filtros actuales.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descuento
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Método de Pago
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGastos.map((gasto) => (
                <motion.tr 
                  key={gasto._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{gasto.name}</div>
                    {gasto.description && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {gasto.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-red-600">{formatAmount(gasto.amount)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${gasto.category === 'Operativo' ? 'bg-blue-100 text-blue-800' :
                        gasto.category === 'Material' ? 'bg-green-100 text-green-800' :
                        gasto.category === 'Servicio' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {gasto.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {gasto.deductFromSales ? (
                      <div>
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Descontado
                        </span>
                        <span className="mt-1 block px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {gasto.deductionPeriod === 'day' ? 'Diario' : 'Mensual'}
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        No descontado
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {gasto.paymentMethod}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(gasto.date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onEdit(gasto)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                      disabled={isDeleting}
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(gasto._id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GastoList;
