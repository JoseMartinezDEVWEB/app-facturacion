/* eslint-disable react/prop-types */
// src/components/Dashboard/ClientesDeudaModal.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';
import { clienteApi } from '../../config/apis'; // Asegúrate de ajustar la ruta según la estructura de tu proyecto

const ClientesDeudaModal = ({ isOpen, onClose, onDataChange }) => {
  // Estados para manejar los datos y las interacciones
  const [clientesDeuda, setClientesDeuda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para los modales secundarios
  const [showSaldadoModal, setShowSaldadoModal] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');

  // Efecto para cargar la lista de clientes con deuda cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      fetchClientesDeuda();
    }
  }, [isOpen]);

  /**
   * Función para obtener la lista de clientes con deuda pendiente
   */
  const fetchClientesDeuda = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Usar la API de clientes para obtener los clientes con deuda
      const response = await clienteApi.getClientesDeuda();
      
      if (response.success) {
        setClientesDeuda(response.clientes || []);
      } else {
        throw new Error(response.message || 'No se pudo obtener la lista de clientes con deuda');
      }
    } catch (error) {
      console.error('Error al obtener clientes con deuda:', error);
      setError('No se pudo cargar la lista de clientes con deuda. Por favor, intente nuevamente.');
      
      // Datos de ejemplo para desarrollo en caso de error
      setClientesDeuda([
        { id: 1, nombre: 'Juan Pérez', totalDeuda: 245.50, facturasPendientes: 2 },
        { id: 2, nombre: 'María García', totalDeuda: 350.65, facturasPendientes: 3 },
        { id: 3, nombre: 'Carlos López', totalDeuda: 120.00, facturasPendientes: 1 },
        { id: 4, nombre: 'Ana Martínez', totalDeuda: 228.00, facturasPendientes: 2 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para manejar la acción de saldar la cuenta completa
   * @param {Object} cliente - Datos del cliente a saldar cuenta
   */
  const handleSaldarCuenta = (cliente) => {
    setClienteActual(cliente);
    setShowSaldadoModal(true);
  };

  /**
   * Función para manejar la acción de abonar a la cuenta
   * @param {Object} cliente - Datos del cliente para abonar
   */
  const handleAbonarCuenta = (cliente) => {
    setClienteActual(cliente);
    setMontoAbono('');
    setShowAbonoModal(true);
  };

  /**
   * Función para confirmar el pago completo de una cuenta
   */
  const confirmarSaldoCuenta = async () => {
    try {
      setLoading(true);
      
      // Llamar a la API para saldar la deuda
      const response = await clienteApi.saldarDeuda(clienteActual.id);
      
      if (response.success) {
        // Actualizar la lista de clientes con deuda
        setClientesDeuda(clientesDeuda.filter(c => c.id !== clienteActual.id));
        setConfirmMessage('¡Cuenta saldada exitosamente!');
        
        // Cerrar el modal de saldado después de un tiempo
        setTimeout(() => {
          setShowSaldadoModal(false);
          setConfirmMessage('');
          // Notificar al componente padre que los datos han cambiado
          if (onDataChange) onDataChange();
        }, 2000);
      } else {
        throw new Error(response.message || 'No se pudo procesar el pago');
      }
    } catch (error) {
      console.error('Error al saldar cuenta:', error);
      setError('Ocurrió un error al procesar el pago. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Función para confirmar un abono a la cuenta
   */
  const confirmarAbono = async () => {
    // Validar que el monto sea un número válido y mayor que cero
    const montoNumerico = parseFloat(montoAbono);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setError('Por favor, ingrese un monto válido mayor que cero.');
      return;
    }
    
    // Validar que el monto no sea mayor que la deuda
    if (montoNumerico > clienteActual.totalDeuda) {
      setError('El monto de abono no puede ser mayor que la deuda total.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Llamar a la API para abonar a la deuda
      const response = await clienteApi.abonarDeuda(clienteActual.id, montoNumerico);
      
      if (response.success) {
        // Actualizar la lista de clientes con deuda
        const nuevaDeuda = clienteActual.totalDeuda - montoNumerico;
        
        if (nuevaDeuda <= 0) {
          // Si la nueva deuda es 0 o menos, remover el cliente de la lista
          setClientesDeuda(clientesDeuda.filter(c => c.id !== clienteActual.id));
        } else {
          // Actualizar el monto de la deuda para este cliente
          setClientesDeuda(clientesDeuda.map(c => 
            c.id === clienteActual.id 
              ? { ...c, totalDeuda: nuevaDeuda } 
              : c
          ));
        }
        
        setConfirmMessage(`¡Abono de RD$ ${montoNumerico.toLocaleString()} aplicado correctamente!`);
        
        // Cerrar el modal de abono después de un tiempo
        setTimeout(() => {
          setShowAbonoModal(false);
          setConfirmMessage('');
          // Notificar al componente padre que los datos han cambiado
          if (onDataChange) onDataChange();
        }, 2000);
      } else {
        throw new Error(response.message || 'No se pudo procesar el abono');
      }
    } catch (error) {
      console.error('Error al abonar cuenta:', error);
      setError('Ocurrió un error al procesar el abono. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Animación para el modal principal
  const modalAnimation = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  };

  // Animación para el overlay
  const overlayAnimation = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } }
  };

  // Función para limpiar mensajes de error
  const clearError = () => {
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          {/* Overlay con animación */}
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50"
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />
          
          {/* Modal principal */}
          <motion.div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 z-[91] max-h-[80vh] flex flex-col"
            variants={modalAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Cabecera del modal */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-800">
                Clientes con Cuentas Pendientes
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            {/* Contenido del modal */}
            <div className="p-6 overflow-auto flex-grow">
              {loading && !clientesDeuda.length ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
                </div>
              ) : error && !clientesDeuda.length ? (
                <div className="bg-red-50 p-4 rounded-md">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                    <p className="text-red-600">{error}</p>
                  </div>
                  <button 
                    onClick={fetchClientesDeuda}
                    className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              ) : clientesDeuda.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg">No hay clientes con cuentas pendientes.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cliente
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Facturas Pendientes
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Monto Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {clientesDeuda.map((cliente) => (
                        <tr key={cliente.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">
                              {cliente.nombre}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900">
                              {cliente.facturasPendientes}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-900 font-semibold">
                              RD$ {cliente.totalDeuda.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex justify-end space-x-2">
                              <button 
                                onClick={() => handleSaldarCuenta(cliente)}
                                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
                              >
                                Saldar Cuenta
                              </button>
                              <button 
                                onClick={() => handleAbonarCuenta(cliente)}
                                className="px-3 py-1 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors text-sm"
                              >
                                Abonar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
          
          {/* Modal de confirmación para saldar cuenta */}
          <AnimatePresence>
            {showSaldadoModal && (
              <motion.div 
                className="fixed inset-0 z-[100] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => !confirmMessage && setShowSaldadoModal(false)}></div>
                <motion.div 
                  className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 z-[101]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  {confirmMessage ? (
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {confirmMessage}
                      </h3>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Confirmar Pago Completo
                      </h3>
                      <p className="text-gray-600 mb-6">
                        ¿Está seguro que desea marcar como pagada la deuda de <span className="font-semibold">{clienteActual?.nombre}</span> por un monto de <span className="font-semibold">RD$ {clienteActual?.totalDeuda.toLocaleString()}</span>?
                      </p>
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => setShowSaldadoModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={confirmarSaldoCuenta}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="mr-2">Procesando</span>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            </>
                          ) : 'Confirmar Pago'}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Modal para abonar a cuenta */}
          <AnimatePresence>
            {showAbonoModal && (
              <motion.div 
                className="fixed inset-0 z-[100] flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => !confirmMessage && setShowAbonoModal(false)}></div>
                <motion.div 
                  className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 z-[101]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  {confirmMessage ? (
                    <div className="text-center">
                      <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {confirmMessage}
                      </h3>
                    </div>
                  ) : (
                    <>
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">
                        Abonar a Cuenta
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Cliente: <span className="font-semibold">{clienteActual?.nombre}</span>
                      </p>
                      <p className="text-gray-600 mb-6">
                        Deuda actual: <span className="font-semibold">RD$ {clienteActual?.totalDeuda.toLocaleString()}</span>
                      </p>
                      
                      {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md flex items-start">
                          <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                          <div>
                            {error}
                            <button 
                              onClick={clearError}
                              className="block text-sm text-red-500 hover:text-red-700 mt-1"
                            >
                              Cerrar
                            </button>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <label htmlFor="montoAbono" className="block text-sm font-medium text-gray-700 mb-1">
                          Monto a abonar (RD$)
                        </label>
                        <input
                          type="number"
                          id="montoAbono"
                          value={montoAbono}
                          onChange={(e) => setMontoAbono(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                          placeholder="0.00"
                          min="1"
                          max={clienteActual?.totalDeuda}
                          step="0.01"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => setShowAbonoModal(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          disabled={loading}
                        >
                          Cancelar
                        </button>
                        <button 
                          onClick={confirmarAbono}
                          className="px-4 py-2 bg-pink-500 text-white rounded-md hover:bg-pink-600 transition-colors flex items-center"
                          disabled={loading || !montoAbono}
                        >
                          {loading ? (
                            <>
                              <span className="mr-2">Procesando</span>
                              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            </>
                          ) : 'Confirmar Abono'}
                        </button>
                      </div>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ClientesDeudaModal;