/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, X, AlertCircle, CheckCircle, Eye, Settings } from 'lucide-react';

const PrintConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  invoiceNumber, 
  onViewInvoice,
  onConfigInvoice
}) => {
  const [printerStatus, setPrinterStatus] = useState('checking');
  const [printerMessage, setPrinterMessage] = useState('Verificando dispositivos de impresión...');

  useEffect(() => {
    if (isOpen) {
      // Detección de impresoras
      const checkPrinters = async () => {
        let printerFound = false;
        
        // Intentar con API de navegador (experimental)
        try {
          if ('getPrinters' in window) {
            const printers = await window.getPrinters();
            if (printers && printers.length > 0) {
              printerFound = true;
              setPrinterMessage(`${printers.length} impresora(s) disponible(s)`);
            }
          }
        } catch (e) {
          console.log('API de impresoras no soportada');
        }
        
        // Intentar con Web USB API
        if (!printerFound && 'usb' in navigator) {
          try {
            const devices = await navigator.usb.getDevices();
            // Filtrar dispositivos que parezcan impresoras
            const possiblePrinters = devices.filter(device => 
              device.productName?.toLowerCase().includes('printer') ||
              device.manufacturerName?.toLowerCase().includes('epson') ||
              device.manufacturerName?.toLowerCase().includes('brother') ||
              device.manufacturerName?.toLowerCase().includes('hp') ||
              device.manufacturerName?.toLowerCase().includes('canon')
            );
            
            if (possiblePrinters.length > 0) {
              printerFound = true;
              setPrinterMessage(`Dispositivo de impresión detectado: ${possiblePrinters[0].productName}`);
            }
          } catch (e) {
            console.log('Error al acceder a dispositivos USB:', e);
          }
        }

        // Verificar si el navegador tiene capacidad general de impresión
        if (!printerFound) {
          // Asumimos que si el navegador soporta window.print(), hay alguna forma de imprimir
          if (typeof window.print === 'function') {
            printerFound = true;
            setPrinterMessage('Impresión disponible a través del navegador');
          } else {
            setPrinterMessage('No se detectaron dispositivos de impresión');
          }
        }
        
        setPrinterStatus(printerFound ? 'ready' : 'not-found');
      };
      
      checkPrinters();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        >
          <div className="flex justify-between items-start">
            <h2 className="text-xl font-bold">Factura #{invoiceNumber}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="my-6 text-center">
            <Printer size={48} className="mx-auto mb-4 text-blue-600" />
            <p className="text-lg font-semibold mb-2">
              Factura guardada exitosamente
            </p>
            <p className="text-gray-600">
              ¿Qué desea hacer con esta factura?
            </p>

            <div className="mt-4 p-3 rounded-lg bg-gray-50 flex items-center">
              {printerStatus === 'checking' && (
                <div className="animate-pulse flex items-center text-blue-600">
                  <div className="w-4 h-4 mr-2 rounded-full bg-blue-600"></div>
                  <span>{printerMessage}</span>
                </div>
              )}
              
              {printerStatus === 'ready' && (
                <div className="flex items-center text-green-600">
                  <CheckCircle size={20} className="mr-2" />
                  <span>{printerMessage}</span>
                </div>
              )}
              
              {printerStatus === 'not-found' && (
                <div className="flex items-center text-yellow-600">
                  <AlertCircle size={20} className="mr-2" />
                  <span>{printerMessage}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <button
              onClick={onViewInvoice}
              className="px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 flex items-center"
            >
              <Eye size={18} className="mr-2" /> Ver Factura
            </button>
            
            <button
              onClick={onConfigInvoice}
              className="px-4 py-2 border border-purple-300 rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 flex items-center"
            >
              <Settings size={18} className="mr-2" /> Configurar
            </button>
            
            <button
              onClick={onConfirm}
              disabled={printerStatus === 'checking'}
              className={`px-4 py-2 rounded-md text-white flex items-center
                ${printerStatus === 'checking'
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'}
              `}
            >
              <Printer size={18} className="mr-2" />
              {printerStatus === 'checking' ? 'Verificando...' : 'Imprimir Factura'}
            </button>
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

PrintConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  invoiceNumber: PropTypes.string,
  onViewInvoice: PropTypes.func.isRequired,
  onConfigInvoice: PropTypes.func.isRequired
};

export default PrintConfirmationModal;