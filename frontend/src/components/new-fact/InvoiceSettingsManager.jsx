import { useState } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building, Printer, ChevronRight, Settings } from 'lucide-react';

// Importamos los componentes de configuración
import BusinessInfoSettings from './BusinessInfoSettings';
import PrintConfigurationSettings from './PrintConfigurationSettings';

const InvoiceSettingsManager = ({ isOpen, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState(null);
  
  // Función para manejar el guardado desde cualquier componente hijo
  const handleSettingsSave = (settings) => {
    if (onSave) {
      onSave(settings);
    }
    // Volvemos al menú principal
    setActiveTab(null);
  };

  // Función para manejar el cierre desde cualquier componente hijo
  const handleSettingsClose = () => {
    setActiveTab(null);
  };

  // Renderizar el menú principal
  const renderMainMenu = () => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full mx-4"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold">Configuración de Facturación</h2>
            <p className="text-gray-600">Seleccione qué desea configurar</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => setActiveTab('business')}
            className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 text-left"
          >
            <div className="flex items-center">
              <Building size={24} className="text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Información del Negocio</h3>
                <p className="text-sm text-blue-700">Configure los datos de su empresa en las facturas</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-blue-400" />
          </button>
          
          <button
            onClick={() => setActiveTab('print')}
            className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 text-left"
          >
            <div className="flex items-center">
              <Printer size={24} className="text-purple-600 mr-3" />
              <div>
                <h3 className="font-semibold text-purple-900">Configuración de Impresión</h3>
                <p className="text-sm text-purple-700">Ajuste tamaño de papel, márgenes y opciones de impresión</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-purple-400" />
          </button>
          
          <button
            onClick={() => setActiveTab('advanced')}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-left"
          >
            <div className="flex items-center">
              <Settings size={24} className="text-gray-600 mr-3" />
              <div>
                <h3 className="font-semibold text-gray-900">Configuración Avanzada</h3>
                <p className="text-sm text-gray-700">Opciones avanzadas y ajustes del sistema</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        <div className="mt-6 pt-4 border-t text-center">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </motion.div>
    );
  };

  // Si el modal no está abierto, no mostramos nada
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
        {/* Renderizar el componente correspondiente según la pestaña activa */}
        {activeTab === 'business' ? (
          <BusinessInfoSettings 
            isOpen={true}
            onClose={handleSettingsClose}
            onSave={handleSettingsSave}
          />
        ) : activeTab === 'print' ? (
          <PrintConfigurationSettings 
            isOpen={true}
            onClose={handleSettingsClose}
            onSave={handleSettingsSave}
          />
        ) : activeTab === 'advanced' ? (
          // Placeholder para futuras configuraciones avanzadas
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-xl w-full mx-4">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold">Configuración Avanzada</h2>
              <button onClick={() => setActiveTab(null)}>
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Estas funcionalidades estarán disponibles próximamente. Puede incluir opciones como:
            </p>
            <ul className="list-disc pl-5 mb-4 space-y-2">
              <li>Configuración de envío de facturas por correo</li>
              <li>Integración con servicios fiscales</li>
              <li>Respaldo automático en la nube</li>
              <li>Gestión de usuarios y permisos</li>
            </ul>
            <div className="text-center mt-4">
              <button
                onClick={() => setActiveTab(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Volver
              </button>
            </div>
          </div>
        ) : (
          // Menú principal
          renderMainMenu()
        )}
      </div>
    </AnimatePresence>
  );
};

InvoiceSettingsManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default InvoiceSettingsManager;