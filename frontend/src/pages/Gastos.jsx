/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getExpenses, deleteExpense, createExpense, updateExpense } from '../../src/services/expenseService';
import GastoForm from '../components/gastos/GastoForm';
import GastoList from '../components/gastos/GastoList';
import GastoResumen from '../components/gastos/GatoResumen';


const Gastos = () => {
  const [gastos, setGastos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [currentGasto, setCurrentGasto] = useState(null);
  
  // Cargar gastos al montar el componente
  useEffect(() => {
    fetchGastos();
  }, []);
  
  // Función para cargar la lista de gastos
  const fetchGastos = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getExpenses();
      setGastos(response.data);
    } catch (err) {
      console.error('Error al cargar los gastos:', err);
      setError('Error al cargar los gastos. Por favor, intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar la creación/actualización exitosa de un gasto
  const handleGastoSuccess = (gastoData) => {
    fetchGastos(); // Recargar la lista completa
    setShowForm(false);
    setCurrentGasto(null);
  };
  
  // Manejar clic en editar gasto
  const handleEditGasto = (gasto) => {
    setCurrentGasto(gasto);
    setShowForm(true);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Gastos</h1>
        <motion.button
          onClick={() => {
            setCurrentGasto(null);
            setShowForm(!showForm);
          }}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          {showForm ? 'Cancelar' : 'Nuevo Gasto'}
        </motion.button>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
          <button
            onClick={fetchGastos}
            className="mt-2 text-red-700 underline focus:outline-none"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
      
      {/* Resumen de gastos */}
      <GastoResumen />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de gasto (condicional) */}
        {showForm && (
          <div className="lg:col-span-1">
            <GastoForm 
              initialData={currentGasto} 
              onSuccess={handleGastoSuccess} 
              onCancel={() => {
                setShowForm(false);
                setCurrentGasto(null);
              }}
            />
          </div>
        )}
        
        {/* Lista de gastos */}
        <div className={showForm ? "lg:col-span-2" : "lg:col-span-3"}>
          <GastoList 
            gastos={gastos} 
            isLoading={isLoading} 
            onRefresh={fetchGastos} 
            onEdit={handleEditGasto} 
          />
        </div>
      </div>
    </div>
  );
};

export default Gastos;