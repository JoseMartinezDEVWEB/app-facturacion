/* eslint-disable react/prop-types */
// src/components/customers/CustomerCard.jsx

import { motion } from 'framer-motion';

// Componente para mostrar la información de un cliente en formato de tarjeta
const CustomerCard = ({ customer, onEdit, onDelete }) => {
  // Función para formatear fecha (si existe)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Obtener la etiqueta del tipo de cliente
  const getTipoClienteLabel = (tipo) => {
    switch (tipo) {
      case 'vip': return { text: 'VIP', color: 'bg-purple-100 text-purple-800' };
      case 'frecuente': return { text: 'Frecuente', color: 'bg-blue-100 text-blue-800' };
      default: return { text: 'Regular', color: 'bg-gray-100 text-gray-800' };
    }
  };

  // Obtener datos del tipo de cliente
  const tipoCliente = getTipoClienteLabel(customer.tipoCliente);

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
            <h3 className="text-lg font-semibold text-gray-800">{customer.name}</h3>
            <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${tipoCliente.color}`}>
              {tipoCliente.text}
            </span>
          </div>
          
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(customer)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Editar cliente"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
            </button>
            
            <button
              onClick={() => onDelete(customer._id)}
              className="p-1 rounded-full hover:bg-gray-100 transition-colors"
              title="Eliminar cliente"
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
          {customer.phone && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span>{customer.phone}</span>
            </div>
          )}
          
          {/* Email */}
          {customer.email && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span className="truncate">{customer.email}</span>
            </div>
          )}
          
          {/* Identificación */}
          {customer.identificacion && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
              </svg>
              <span>{customer.identificacion}</span>
            </div>
          )}

          {/* Dirección (si tiene alguna parte de la dirección) */}
          {customer.address && (customer.address.street || customer.address.city) && (
            <div className="flex items-start text-sm">
              <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <div>
                {customer.address.street && <p>{customer.address.street}</p>}
                {(customer.address.city || customer.address.state) && (
                  <p>
                    {[
                      customer.address.city,
                      customer.address.state
                    ].filter(Boolean).join(', ')}
                    {customer.address.zipCode && ` ${customer.address.zipCode}`}
                  </p>
                )}
                {customer.address.country && <p>{customer.address.country}</p>}
              </div>
            </div>
          )}
          
          {/* Fecha de nacimiento */}
          {customer.fechaNacimiento && (
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <span>{formatDate(customer.fechaNacimiento)}</span>
            </div>
          )}
        </div>
        
        {/* Información financiera */}
        <div className="flex flex-col md:flex-row gap-2">
          {/* Crédito disponible */}
          <div className="flex-1 rounded-md bg-green-50 p-2">
            <p className="text-xs text-green-600 font-medium">Crédito Disponible</p>
            <p className="text-lg font-bold text-green-700">RD$ {customer.credito?.toFixed(2) || '0.00'}</p>
          </div>
          
          {/* Cuentas pendientes */}
          {customer.cuentasPendientes > 0 && (
            <div className="flex-1 rounded-md bg-amber-50 p-2">
              <p className="text-xs text-amber-600 font-medium">Por Cobrar</p>
              <p className="text-lg font-bold text-amber-700">RD$ {customer.cuentasPendientes?.toFixed(2) || '0.00'}</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerCard;