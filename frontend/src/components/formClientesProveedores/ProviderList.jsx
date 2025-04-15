/* eslint-disable react/prop-types */
// src/components/providers/ProviderList.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import ProviderCard from './ProviderCard';
import ProviderForm from './ProviderForm';

// Componente para listar, filtrar y gestionar proveedores
const ProviderList = ({ onCreateOrder }) => {
  // Estados para gestionar proveedores y filtros
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Estados para gestionar la interfaz
  const [searchTerm, setSearchTerm] = useState('');
  const [condicionFilter, setCondicionFilter] = useState('todos');
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  // Estadísticas
  const [stats, setStats] = useState({
    total: 0,
    pendienteTotal: 0
  });

  // Cargar proveedores al iniciar
  useEffect(() => {
    fetchProviders();
  }, []);

  // Actualizar proveedores filtrados cuando cambian los filtros
  useEffect(() => {
    filterProviders();
  }, [providers, searchTerm, condicionFilter]);

  // Función para obtener proveedores del backend
  const fetchProviders = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/providers');
      setProviders(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setError('No se pudieron cargar los proveedores. Por favor, intente de nuevo.');
      setLoading(false);
    }
  };

  // Función para filtrar proveedores según criterios
  const filterProviders = () => {
    let result = [...providers];
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(provider => 
        provider.name.toLowerCase().includes(searchLower) ||
        provider.email?.toLowerCase().includes(searchLower) ||
        provider.phone?.includes(searchTerm) ||
        provider.rncCedula?.includes(searchTerm) ||
        provider.tipoNegocio?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtrar por condiciones de pago
    if (condicionFilter !== 'todos') {
      result = result.filter(provider => provider.condicionesPago === condicionFilter);
    }
    
    // Actualizar proveedores filtrados
    setFilteredProviders(result);
    
    // Calcular estadísticas
    const stats = {
      total: result.length,
      pendienteTotal: result.reduce((sum, p) => sum + (p.cuentasPendientes || 0), 0)
    };
    
    setStats(stats);
  };

  // Función para manejar la eliminación de un proveedor
  const handleDeleteProvider = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      try {
        await axios.delete(`/api/providers/${id}`);
        // Actualizar la lista local de proveedores
        setProviders(prev => prev.filter(p => p._id !== id));
        // Mostrar mensaje de éxito (podrías implementar un sistema de notificaciones)
      } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        setError('No se pudo eliminar el proveedor. Por favor, intente de nuevo.');
      }
    }
  };

  // Función para manejar la edición de un proveedor
  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setShowForm(true);
    // Hacer scroll al formulario
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para manejar la creación de una orden de compra
  const handleCreateOrder = (provider) => {
    if (onCreateOrder) {
      onCreateOrder(provider);
    } else {
      // Si no se proporciona una función de manejo, redirigir a una página de crear orden
      // Aquí podrías implementar la navegación a otra página si lo necesitas
      console.log('Crear orden para proveedor:', provider._id);
    }
  };

  // Función que se ejecuta después de guardar un proveedor
  const handleProviderSaved = (savedProvider) => {
    if (savedProvider) {
      // Si estábamos editando, actualizar el proveedor en la lista
      if (editingProvider) {
        setProviders(prev => prev.map(p => 
          p._id === savedProvider._id ? savedProvider : p
        ));
      } else {
        // Si estábamos creando, agregar el nuevo proveedor a la lista
        setProviders(prev => [savedProvider, ...prev]);
      }
    }
    
    // Cerrar formulario y limpiar proveedor en edición
    setShowForm(false);
    setEditingProvider(null);
    
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
            <ProviderForm 
              editProvider={editingProvider}
              onSuccess={handleProviderSaved}
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
          Gestión de Proveedores
        </motion.h1>

        <motion.button
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center"
          onClick={() => {
            setEditingProvider(null);
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
              Nuevo Proveedor
            </>
          )}
        </motion.button>
      </div>

      {/* Tarjetas de Estadísticas */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-500">Total Proveedores</h3>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow-md border-l-4 border-amber-500">
          <h3 className="text-sm font-medium text-gray-500">Pendiente por Pagar</h3>
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
              placeholder="Buscar por nombre, teléfono, email, RNC o tipo de negocio..."
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
          
          {/* Filtro por condiciones de pago */}
          <div>
            <select
              value={condicionFilter}
              onChange={(e) => setCondicionFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="todos">Todas las condiciones</option>
              <option value="inmediato">Pago Inmediato</option>
              <option value="15dias">15 días</option>
              <option value="30dias">30 días</option>
              <option value="45dias">45 días</option>
              <option value="60dias">60 días</option>
              <option value="otro">Otro</option>
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

      {/* Lista de Proveedores */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 border-r-2 border-b-2 border-gray-200"></div>
        </div>
      ) : filteredProviders.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredProviders.map((provider) => (
            <ProviderCard 
              key={provider._id} 
              provider={provider} 
              onEdit={() => handleEditProvider(provider)}
              onDelete={() => handleDeleteProvider(provider._id)}
              onCreateOrder={() => handleCreateOrder(provider)}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No se encontraron proveedores</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || condicionFilter !== 'todos'
              ? 'Intenta ajustar tus filtros de búsqueda'
              : 'Comienza agregando un nuevo proveedor'}
          </p>
          {(searchTerm || condicionFilter !== 'todos') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCondicionFilter('todos');
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

export default ProviderList;