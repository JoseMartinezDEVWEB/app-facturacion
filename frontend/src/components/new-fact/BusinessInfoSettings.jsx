import  { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, X, Building, Phone, MapPin, Globe, Hash, Mail, MessageCircle } from 'lucide-react';

// Clave para almacenar la configuración en localStorage
const BUSINESS_INFO_KEY = 'business_info_settings';

const BusinessInfoSettings = ({ isOpen, onClose, onSave }) => {
  const [businessInfo, setBusinessInfo] = useState({
    name: '',
    slogan: '',
    address: '',
    phone: '',
    rnc: '', // Registro Nacional del Contribuyente o identificación fiscal
    website: '',
    email: '',
    logoUrl: '',
    footer: '¡Gracias por su compra!',
    currency: 'RD$', // Peso dominicano por defecto
    additionalComment: '', // Nuevo campo para comentarios opcionales
  });

  // Cargar configuración guardada al abrir
  useEffect(() => {
    if (isOpen) {
      const savedInfo = localStorage.getItem(BUSINESS_INFO_KEY);
      if (savedInfo) {
        try {
          const parsedInfo = JSON.parse(savedInfo);
          setBusinessInfo(prevInfo => ({
            ...prevInfo,
            ...parsedInfo
          }));
        } catch (error) {
          console.error('Error al cargar la información del negocio:', error);
        }
      }
    }
  }, [isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBusinessInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Guardar en localStorage
    localStorage.setItem(BUSINESS_INFO_KEY, JSON.stringify(businessInfo));
    
    // Notificar al componente padre
    if (onSave) {
      onSave(businessInfo);
    }
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white rounded-lg shadow-xl p-6 max-w-3xl w-full mx-4 my-8"
        >
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold">Información del Negocio</h2>
              <p className="text-gray-600">Configure los datos de su negocio que aparecerán en las facturas</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del Negocio
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <Building size={16} />
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={businessInfo.name}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nombre de su negocio"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Eslogan o Descripción
                </label>
                <input
                  type="text"
                  name="slogan"
                  value={businessInfo.slogan}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Su eslogan o descripción corta"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RNC / Identificación Fiscal
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <Hash size={16} />
                  </span>
                  <input
                    type="text"
                    name="rnc"
                    value={businessInfo.rnc}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="000-00000-0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Símbolo de Moneda
                </label>
                <select
                  name="currency"
                  value={businessInfo.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RD$">RD$ - Peso Dominicano</option>
                  <option value="$">$ - Dólar</option>
                  <option value="€">€ - Euro</option>
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <Phone size={16} />
                  </span>
                  <input
                    type="text"
                    name="phone"
                    value={businessInfo.phone}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="(000) 000-0000"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <Mail size={16} />
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={businessInfo.email}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="correo@sunegocio.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <MapPin size={16} />
                  </span>
                  <input
                    type="text"
                    name="address"
                    value={businessInfo.address}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Dirección del negocio"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <Globe size={16} />
                  </span>
                  <input
                    type="text"
                    name="website"
                    value={businessInfo.website}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="www.sunegocio.com"
                  />
                </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje de Pie de Página
                </label>
                <textarea
                  name="footer"
                  value={businessInfo.footer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mensaje que aparecerá al final de la factura"
                  rows="2"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario Adicional
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                    <MessageCircle size={16} />
                  </span>
                  <textarea
                    name="additionalComment"
                    value={businessInfo.additionalComment}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Texto adicional que aparecerá debajo del pie de página (ej: políticas de devolución, información legal, etc.)"
                    rows="3"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Este texto aparecerá como un comentario adicional en la parte inferior de la factura.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Save size={18} className="mr-2" />
              Guardar Información
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

BusinessInfoSettings.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func
};

export default BusinessInfoSettings;