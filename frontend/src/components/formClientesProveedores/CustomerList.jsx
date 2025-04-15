// src/components/customers/CustomerList.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CustomerCard from './CustomerCard';
import CustomerForm from './CustomerForm';

// Componente para listar, filtrar y gestionar clientes
const CustomerList = () => {
  // Estados para gestionar clientes y filtros
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para gestionar la interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    creditoTotal: 0,
    pendienteTotal: 0
  });

  // Cargar clientes al iniciar
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Actualizar clientes filtrados cuando cambian los filtros
  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, tipoFilter]);

  // Función para obtener clientes del backend
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/clientes'); // Asegúrate de que esta ruta coincida con tu backend
      setCustomers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
      setError('No se pudieron cargar los clientes. Por favor, intente de nuevo.');
      setLoading(false);
    }
  };

  // Función para filtrar clientes según criterios
  const filterCustomers = () => {
    let result = [...customers];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchTerm) ||
        customer.identificacion?.includes(searchTerm)
      );
    }
    
    // Filtrar por tipo de cliente
    if (tipoFilter !== 'todos') {
      result = result.filter(customer => customer.tipoCliente === tipoFilter);
    }
    
    // Actualizar clientes filtrados
    setFilteredCustomers(result);
    
    // Calcular estadísticas
    const stats = {
      total: result.length,
      creditoTotal: result.reduce((sum, c) => sum + (c.credito || 0), 0),
      pendienteTotal: result.reduce((sum, c) => sum + (c.cuentasPendientes || 0), 0)
    };
    
    setStats(stats);
  };

  // Función para manejar la eliminación de un cliente
  const handleDeleteCustomer = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este cliente?')) {
      try {
        await axios.delete(`/api/clientes/${id}`);
        // Actualizar la lista local de clientes
        setCustomers(prev => prev.filter(c => c._id !== id));
        // Mostrar mensaje de éxito (podrías implementar un sistema de notificaciones)
      } catch (error) {
        console.error('Error al eliminar cliente:', error);
        setError('No se pudo eliminar el cliente. Por favor, intente de nuevo.');
      }
    }
  };

  // Función para manejar la edición de un cliente
  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función que se ejecuta después de guardar un cliente
  const handleCustomerSaved = (savedCustomer) => {
    if (savedCustomer) {
      // Si estábamos editando, actualizar el cliente en la lista
      if (editingCustomer) {
        setCustomers(prev => prev.map(c => 
          c._id === savedCustomer._id ? savedCustomer : c
        ));
      } else {
        // Si estábamos creando, agregar el nuevo cliente a la lista
        setCustomers(prev => [savedCustomer, ...prev]);
      }
    }
    
    // Cerrar formulario y limpiar cliente en edición
    setShowForm(false);
    setEditingCustomer(null);
    
    // Opcional: hacer scroll de vuelta a la lista
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Configuración de animaciones
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Sección del Formulario (condicional) */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <CustomerForm 
              editCustomer={editingCustomer}
              onSuccess={handleCustomerSaved}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cabecera y Estadísticas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <motion.h1 
          className="text-2xl font-bold text-gray-800 mb-4 sm:mb-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          Gestión de Clientes
        </motion.h1>

        <motion.button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={() => {
            setEditingCustomer(null);
            setShowForm(!showForm);
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Cancelar
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Nuevo Cliente
            </>
          )}
        </motion.button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Clientes</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-500">Crédito Total</h3>
          <p className="text-2xl font-bold text-gray-800">RD$ {stats.creditoTotal.toFixed(2)}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500">
          <h3 className="text-sm font-medium text-gray-500">Pendiente por Cobrar</h3>
          <p className="text-2xl font-bold text-gray-800">RD$ {stats.pendienteTotal.toFixed(2)}</p>
        </div>
      </motion.div>

      {/* Filtros y Búsqueda */}
      <motion.div
        className="bg-white p-4 rounded-lg shadow-md mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
          {/* Buscador */}
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono, email o identificación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute left-3 top-2.5 text-gray-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>
          
          {/* Filtro por tipo */}
          <div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todos los tipos</option>
              <option value="regular">Clientes Regulares</option>
              <option value="frecuente">Clientes Frecuentes</option>
              <option value="vip">Clientes VIP</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Mensaje de error */}
      {error && (
        <motion.div
          className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-red-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </motion.div>
      )}

      {/* Lista de Clientes */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 border-gray-200"></div>
        </div>
      ) : filteredCustomers.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredCustomers.map((customer) => (
            <CustomerCard 
              key={customer._id} 
              customer={customer} 
              onEdit={() => handleEditCustomer(customer)}
              onDelete={() => handleDeleteCustomer(customer._id)}
            />
          ))}
        </motion.div>
      ) : (
        <motion.div
          className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron clientes</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || tipoFilter !== 'todos'
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Comienza agregando un nuevo cliente'}
          </p>
          {(searchTerm || tipoFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTipoFilter('todos');
              }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800"
            >
              Limpiar filtros
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default CustomerList;