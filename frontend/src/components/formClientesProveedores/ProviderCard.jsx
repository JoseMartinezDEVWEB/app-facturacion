/* eslint-disable react/prop-types */
// src/components/providers/ProviderCard.jsx
import { motion } from 'framer-motion';

// Componente para mostrar la información de un proveedor en formato de tarjeta
const ProviderCard = ({ provider, onEdit, onDelete, onCreateOrder }) => {
  // Obtener la etiqueta para condiciones de pago
  const getCondicionesLabel = (condicion) => {
    switch (condicion) {
      case 'inmediato': return { text: 'Inmediato', color: 'bg-green-100 text-green-800' };
      case '15dias': return { text: '15 días', color: 'bg-blue-100 text-blue-800' };
      case '30dias': return { text: '30 días', color: 'bg-yellow-100 text-yellow-800' };
      case '45dias': return { text: '45 días', color: 'bg-orange-100 text-orange-800' };
      case '60dias': return { text: '60 días', color: 'bg-red-100 text-red-800' };
      default: return { text: 'Otro', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Obtener datos de las condiciones de pago
  const condicionesPago = getCondicionesLabel(provider.condicionesPago);

  // Animaciones
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    },
    hover: { 
      y: -5,
      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md overflow-hidden"
      variants={cardVariants}
      whileHover="hover"
    >
      <div className="p-5">
        {/* Cabecera con acciones */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">{provider.name}</h3>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${condicionesPago.color}`}>
              {condicionesPago.text}
            </span>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(provider)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Editar proveedor"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            
            <button
              onClick={() => onDelete(provider._id)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Eliminar proveedor"
            >
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Información de contacto */}
        <div className="space-y-2 mb-4">
          {/* Teléfono */}
          {provider.phone && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span>{provider.phone}</span>
            </div>
          )}
          
          {/* Email */}
          {provider.email && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span className="truncate">{provider.email}</span>
            </div>
          )}
          
          {/* RNC/Cédula */}
          {provider.rncCedula && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{provider.rncCedula}</span>
            </div>
          )}
          
          {/* Contacto Principal */}
          {provider.contactoPrincipal && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>{provider.contactoPrincipal}</span>
            </div>
          )}

          {/* Dirección (si tiene alguna parte de la dirección) */}
          {provider.address && (provider.address.street || provider.address.city) && (
            <div className="flex items-start text-sm">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                {provider.address.street && <p>{provider.address.street}</p>}
                {(provider.address.city || provider.address.state) && (
                  <p>
                    {[
                      provider.address.city,
                      provider.address.state
                    ].filter(Boolean).join(', ')}
                    {provider.address.zipCode && ` ${provider.address.zipCode}`}
                  </p>
                )}
                {provider.address.country && <p>{provider.address.country}</p>}
              </div>
            </div>
          )}
          
          {/* Tipo de Negocio */}
          {provider.tipoNegocio && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
              </svg>
              <span>{provider.tipoNegocio}</span>
            </div>
          )}
        </div>
        
        {/* Información financiera e interacciones */}
        <div className="flex flex-col space-y-3">
          {/* Cuentas pendientes */}
          {provider.cuentasPendientes > 0 && (
            <div className="rounded-md bg-amber-50 p-2">
              <p className="text-xs text-amber-600 font-medium">Pendiente por Pagar</p>
              <p className="text-lg font-bold text-amber-700">RD$ {provider.cuentasPendientes?.toFixed(2) || '0.00'}</p>
            </div>
          )}
          
          {/* Botón para crear nueva orden */}
          <motion.button
            onClick={() => onCreateOrder(provider)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md flex items-center justify-center"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
            <span>Nueva Orden de Compra</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default ProviderCard;