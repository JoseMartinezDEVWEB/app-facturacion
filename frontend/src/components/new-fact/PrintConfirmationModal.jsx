/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, AlertCircle, CheckCircle, Eye, Settings, Receipt } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../config/config';

const PrintConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  onViewInvoice,
  onConfigInvoice,
  invoiceNumber 
}) => {
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerMessage, setPrinterMessage] = useState('Verificando dispositivos de impresión...');
  const [printers, setPrinters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (isOpen) {
      fetchPrinters();
    }
  }, [isOpen]);

  const fetchPrinters = async () => {
    setLoading(true);
    setError('');
    setPrinterMessage('Verificando dispositivos de impresión...');
    
    try {
      const response = await axios.get(`${API_URL}/api/printers`);
      setPrinters(response.data || []);
      
      if (response.data && response.data.length > 0) {
        setPrinterMessage('Impresoras disponibles encontradas');
        setSelectedPrinter(response.data[0].name);
      } else {
        setPrinterMessage('No se encontraron impresoras');
        setError('No hay impresoras disponibles');
      }
    } catch (error) {
      console.error('Error al obtener las impresoras:', error);
      setPrinterMessage('Error al verificar impresoras');
      setError('No se pudieron cargar las impresoras. Por favor, verifique la conexión.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!selectedPrinter) {
      setError('Por favor seleccione una impresora');
      return;
    }
    
    onConfirm(selectedPrinter, copies);
  };

  const handleIncreaseCopies = () => {
    if (copies < 3) {
      setCopies(copies + 1);
    }
  };

  const handleDecreaseCopies = () => {
    if (copies > 1) {
      setCopies(copies - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4"
          >
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-800">Confirmación de Impresión</h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Estado de impresión</h3>
              
                <div className="mt-4 p-3 rounded-lg bg-gray-50 flex items-center">
                  {loading ? (
                    <div className="animate-pulse flex items-center text-blue-600">
                      <div className="w-4 h-4 mr-2 rounded-full bg-blue-600"></div>
                      <span>{printerMessage}</span>
                    </div>
                  ) : error ? (
                    <div className="flex items-center text-red-600">
                      <AlertCircle size={20} className="mr-2" />
                      <span>{error}</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <CheckCircle size={20} className="mr-2" />
                      <span>{printerMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {!loading && !error && (
                <>
                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="printer">
                      Seleccionar Impresora
                    </label>
                    <div className="relative">
                      <select
                        id="printer"
                        className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-4 py-2 pr-8 rounded shadow leading-tight focus:outline-none focus:shadow-outline"
                        value={selectedPrinter}
                        onChange={(e) => setSelectedPrinter(e.target.value)}
                        disabled={loading || printers.length === 0}
                      >
                        {printers.length === 0 ? (
                          <option value="">No hay impresoras disponibles</option>
                        ) : (
                          printers.map((printer) => (
                            <option key={printer.name} value={printer.name}>
                              {printer.name}
                            </option>
                          ))
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                      Número de Copias
                    </label>
                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={handleDecreaseCopies}
                        disabled={copies <= 1}
                        className={`px-3 py-1 rounded-l border ${
                          copies <= 1 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        -
                      </button>
                      <div className="px-4 py-1 border-t border-b text-center min-w-[40px]">
                        {copies}
                      </div>
                      <button
                        type="button"
                        onClick={handleIncreaseCopies}
                        disabled={copies >= 3}
                        className={`px-3 py-1 rounded-r border ${
                          copies >= 3 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                        }`}
                      >
                        +
                      </button>
                      <span className="ml-3 text-sm text-gray-600">
                        (Máximo 3 copias)
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {invoiceNumber && (
                <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-md">
                  <p className="text-sm">Número de factura: <span className="font-semibold">{invoiceNumber}</span></p>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row sm:justify-between gap-2 mt-6">
                <button
                  onClick={onViewInvoice}
                  className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center justify-center"
                >
                  <Receipt size={18} className="mr-2" /> Ver Factura
                </button>
                
                <div className="flex gap-2">
                  <button
                    onClick={onConfigInvoice}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-gray-50 hover:bg-gray-100 flex items-center justify-center"
                  >
                    <Settings size={18} className="mr-2" /> Configurar
                  </button>
                  
                  <button
                    onClick={handlePrint}
                    disabled={loading || !selectedPrinter}
                    className={`px-4 py-2 rounded-md text-white flex items-center justify-center
                      ${loading || !selectedPrinter ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}
                    `}
                  >
                    <Printer size={18} className="mr-2" />
                    {loading ? 'Verificando...' : 'Imprimir Factura'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

PrintConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onViewInvoice: PropTypes.func,
  onConfigInvoice: PropTypes.func,
  invoiceNumber: PropTypes.string
};

export default PrintConfirmationModal;