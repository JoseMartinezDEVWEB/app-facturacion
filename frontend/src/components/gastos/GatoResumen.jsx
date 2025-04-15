/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { getExpenseSummary, getExpenses } from '../../services/expenseService';

const GastoResumen = () => {
  const [resumen, setResumen] = useState({
    totalExpenses: 0,
    totalDeductibleExpenses: 0,
    totalNonDeductibleExpenses: 0,
    totalSales: 0,
    balance: 0
  });
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar los datos del resumen al montar el componente
  useEffect(() => {
    fetchResumen();
    fetchMonthlyExpenses();
  }, []);

  // Función para cargar el resumen desde la API
  const fetchResumen = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getExpenseSummary();
      setResumen(response.data);
    } catch (error) {
      console.error('Error al cargar el resumen:', error);
      setError('No se pudo cargar el resumen. Por favor, intenta de nuevo.');
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
      const totalAmount = response.data && Array.isArray(response.data) 
        ? response.data.reduce((total, expense) => total + expense.amount, 0)
        : (response.data && Array.isArray(response.data.data) 
            ? response.data.data.reduce((total, expense) => total + expense.amount, 0)
            : 0);
      
      setMonthlyExpenses(totalAmount || 0);
    } catch (error) {
      console.error('Error al cargar los gastos mensuales:', error);
      // No mostramos error aquí para no duplicar mensajes
    }
  };
  
  // Formatear montos a RD$
  const formatAmount = (amount) => {
    return `RD$ ${amount.toFixed(2)}`;
  };
  
  // Determinar el color del balance según su valor
  const getBalanceColor = (balance) => {
    if (balance > 0) return 'text-green-600';
    if (balance < 0) return 'text-red-600';
    return 'text-gray-600';
  };
  
  // Formatear la fecha actual
  const formatDate = () => {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return now.toLocaleDateString(undefined, options);
  };

  // Formatear el mes actual
  const formatMonth = () => {
    const now = new Date();
    const options = { year: 'numeric', month: 'long' };
    return now.toLocaleDateString(undefined, options);
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-gray-100 animate-pulse p-6 rounded-lg h-48"></div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-lg">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => {
            fetchResumen();
            fetchMonthlyExpenses();
          }}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Gastos de hoy */}
      <div className="bg-red-500 text-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">Gastos de Hoy</h3>
            <p className="text-xs text-red-100">{formatDate()}</p>
          </div>
          <div className="p-2 bg-red-400 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mt-4">{formatAmount(resumen.totalExpenses || 0)}</p>
        
        {/* Resumen de gastos descontables y no descontables */}
        <div className="mt-4 pt-4 border-t border-red-400">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">Gastos descontables:</span>
            <span className="font-semibold">{formatAmount(resumen.totalDeductibleExpenses || 0)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Gastos no descontables:</span>
            <span className="font-semibold">{formatAmount(resumen.totalNonDeductibleExpenses || 0)}</span>
          </div>
        </div>
      </div>
      
      {/* Gastos del mes (anteriormente Ventas de hoy) */}
      <div className="bg-purple-500 text-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold mb-1">Gastos del Mes</h3>
            <p className="text-xs text-purple-100">{formatMonth()}</p>
          </div>
          <div className="p-2 bg-purple-400 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
        </div>
        <p className="text-3xl font-bold mt-4">{formatAmount(monthlyExpenses || 0)}</p>
        
        {/* Mostrar promedio diario si está disponible */}
        <div className="mt-4 pt-4 border-t border-purple-400">
          <div className="flex justify-between items-center">
            <span className="text-sm">Promedio diario:</span>
            <span className="font-semibold">
              {formatAmount(monthlyExpenses / (new Date().getDate() || 1))}
            </span>
          </div>
        </div>
      </div>
      
      {/* Balance del día (considera solo gastos descontables) */}
      <div className="bg-white p-6 rounded-lg shadow">
  <div className="flex justify-between items-start">
    <div>
      <h3 className="text-lg font-semibold text-gray-800 mb-1">Balance del Día</h3>
      <p className="text-xs text-gray-500">{formatDate()}</p>
      <p className="text-xs text-blue-500 mt-1">*Solo considera gastos descontables</p>
    </div>
    <div className="p-2 bg-gray-100 rounded-full">
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
      </svg>
    </div>
  </div>
  <p className={`text-3xl font-bold mt-4 ${getBalanceColor(resumen.balance || 0)}`}>
    {formatAmount(resumen.balance || 0)}
  </p>
  <div className="flex justify-between mt-4">
    <div>
      <p className="text-sm text-gray-500">Ingresos</p>
      <p className="text-lg font-semibold text-green-600">{formatAmount(resumen.totalSales || 0)}</p>
    </div>
    <div>
      <p className="text-sm text-gray-500">Gastos Descontables</p>
      <p className="text-lg font-semibold text-red-600">{formatAmount(resumen.totalDeductibleExpenses || 0)}</p>
    </div>
  </div>
  
  {/* Mostrar los gastos descontados si hay información detallada */}
  {resumen.expensesDetail && resumen.expensesDetail.deductible && resumen.expensesDetail.deductible.length > 0 && (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <p className="text-sm font-medium text-gray-700 mb-2">Gastos descontados hoy:</p>
      <ul className="text-sm">
        {resumen.expensesDetail.deductible.map((expense) => (
          <li key={expense.id} className="flex justify-between py-1">
            <span>{expense.name}</span>
            <span className="text-red-600">{formatAmount(expense.amount)}</span>
          </li>
        ))}
      </ul>
    </div>
  )}
</div>
    </div>
  );
};

export default GastoResumen;