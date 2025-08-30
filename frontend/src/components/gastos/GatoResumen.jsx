/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { getExpenseSummary, getExpenses } from '../../services/expenseService';
import { motion } from 'framer-motion';

const GastoResumen = () => {
  const [resumen, setResumen] = useState(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchResumen();
    fetchMonthlyExpenses();
  }, []);
  
  // Formatear fecha actual
  const formatDate = () => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', options);
  };
  
  // Función para cargar el resumen desde la API
  const fetchResumen = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Obteniendo resumen de gastos...');
      const response = await getExpenseSummary();
      console.log('Respuesta del resumen:', response);
      
      // Asegurar que response.data no sea undefined y establecer valores predeterminados
      const data = response?.data || {};
      setResumen({
        totalExpenses: data.totalExpenses || 0,
        totalDeductibleExpenses: data.totalDeductibleExpenses || 0,
        totalNonDeductibleExpenses: data.totalNonDeductibleExpenses || 0,
        totalSales: data.totalSales || 0,
        balance: data.balance || 0,
        expensesDetail: data.expensesDetail || { deductible: [], nonDeductible: [] }
      });
    } catch (err) {
      console.error('Error al cargar el resumen de gastos:', err);
      setError('Error al cargar el resumen. Por favor, intenta de nuevo.');
      // Establecer valores predeterminados en caso de error
      setResumen({
        totalExpenses: 0,
        totalDeductibleExpenses: 0,
        totalNonDeductibleExpenses: 0,
        totalSales: 0,
        balance: 0,
        expensesDetail: { deductible: [], nonDeductible: [] }
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar los gastos mensuales usando el endpoint de filtrado existente
  const fetchMonthlyExpenses = async () => {
    try {
      // Obtener la fecha de inicio y fin del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Usar el endpoint existente con filtros
      const response = await getExpenses({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString()
      });
      
      // Calcular el total manualmente sumando los montos de todos los gastos
      // Manejar todos los casos posibles de estructura de respuesta
      const expenses = response?.data || [];
      if (Array.isArray(expenses)) {
        const total = expenses.reduce((sum, expense) => {
          const amount = expense?.amount || 0;
          return sum + Number(amount);
        }, 0);
        setMonthlyExpenses(total);
      } else {
        console.error('La respuesta no es un array:', expenses);
        setMonthlyExpenses(0);
      }
    } catch (err) {
      console.error('Error al cargar los gastos mensuales:', err);
      setMonthlyExpenses(0);
    }
  };
  
  // Formatear montos a RD$
  const formatAmount = (amount) => {
    return `RD$ ${Number(amount || 0).toFixed(2)}`;
  };
  
  // Determinar el color del balance según su valor
  const getBalanceColor = (balance) => {
    const numBalance = Number(balance || 0);
    if (numBalance > 0) return 'text-green-600';
    if (numBalance < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Evitar acceder a propiedades de undefined usando valores predeterminados
  const {
    totalExpenses = 0,
    totalDeductibleExpenses = 0,
    totalNonDeductibleExpenses = 0,
    totalSales = 0,
    balance = 0,
    expensesDetail = { deductible: [] }
  } = resumen || {};
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Gastos de hoy */}
      <div className="bg-red-500 text-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">Gastos de Hoy</h3>
            <p className="text-xs text-red-100">{formatDate()}</p>
          </div>
          <svg className="w-8 h-8 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
        </div>
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-3xl font-bold mb-2">{formatAmount(totalExpenses)}</div>
            <div className="text-sm text-red-100 flex justify-between">
              <span>Descontables: {formatAmount(totalDeductibleExpenses)}</span>
              <span>No descontables: {formatAmount(totalNonDeductibleExpenses)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Gastos del mes */}
      <div className="bg-indigo-500 text-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">Gastos del Mes</h3>
            <p className="text-xs text-indigo-100">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>
          </div>
          <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
        </div>
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="text-3xl font-bold mb-2">{formatAmount(monthlyExpenses)}</div>
          </div>
        )}
      </div>
      
      {/* Balance */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1 text-gray-800">Balance</h3>
            <p className="text-xs text-gray-500">{formatDate()}</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
          </svg>
        </div>
        {isLoading ? (
          <div className="h-20 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Ventas:</span>
              <span className="text-green-600 font-medium">{formatAmount(totalSales)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Gastos:</span>
              <span className="text-red-600 font-medium">{formatAmount(totalExpenses)}</span>
            </div>
            <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
              <span className="text-gray-700 font-semibold">Balance:</span>
              <span className={`${getBalanceColor(balance)} font-bold`}>{formatAmount(balance)}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Detalle de gastos descontables (condicional) */}
      {expensesDetail && expensesDetail.deductible && expensesDetail.deductible.length > 0 && (
        <div className="md:col-span-3 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Detalle de Gastos Descontables</h3>
          {isLoading ? (
            <div className="h-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="overflow-hidden">
              <ul className="text-sm">
                {expensesDetail.deductible.map((expense, index) => (
                  <li key={expense?.id || index} className="flex justify-between py-1">
                    <span>{expense?.name || 'Sin nombre'}</span>
                    <span className="text-red-600">{formatAmount(expense?.amount || 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Mostrar errores */}
      {error && (
        <div className="md:col-span-3 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p className="font-semibold">Error al cargar los datos</p>
          <p>{error}</p>
          <button 
            onClick={fetchResumen} 
            className="mt-2 text-sm text-blue-700 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
};

export default GastoResumen;