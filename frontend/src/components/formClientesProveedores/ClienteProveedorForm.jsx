/* eslint-disable react/prop-types */
// src/components/forms/ClienteProveedorForm.jsx
import  { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clienteApi, providerApi } from '../../config/apis';

/**
 * Componente de formulario integrado para crear clientes y proveedores
 * Permite cambiar entre formulario de cliente y proveedor con una interfaz amigable
 * @param {Object} props - Propiedades del componente
 * @param {Object} props.editData - Datos para editar (cliente o proveedor)
 * @param {Function} props.onSuccess - Función que se ejecuta al guardar exitosamente
 * @param {Function} props.onCancel - Función que se ejecuta al cancelar
 */
const ClienteProveedorForm = ({ editData = null, onSuccess, onCancel }) => {
  // Estado para controlar si estamos en modo cliente o proveedor
  const [formType, setFormType] = useState(editData?.role === 'proveedor' ? 'proveedor' : 'cliente');
  
  // Estado inicial común para ambos tipos de formulario
  const commonInitialState = {
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: ''
    },
    credito: 0,
    notasAdicionales: ''
  };
  
  // Estado inicial específico para el formulario de cliente
  const clienteInitialState = {
    ...commonInitialState,
    role: 'cliente',
    identificacion: '',
    tipoCliente: 'regular'
  };
  
  // Estado inicial específico para el formulario de proveedor
  const proveedorInitialState = {
    ...commonInitialState,
    role: 'proveedor',
    rncCedula: '',
    tipoNegocio: '',
    condicionesPago: 'inmediato',
    contactoPrincipal: ''
  };
  
  // Estado para los datos del formulario, dependiendo del tipo seleccionado
  const [formData, setFormData] = useState(
    formType === 'cliente' ? clienteInitialState : proveedorInitialState
  );
  
  // Estados para manejar la carga y mensajes
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Efecto para cargar los datos si estamos editando
  useEffect(() => {
    if (editData) {
      // Determinar el tipo de formulario basado en el rol
      const isProveedor = editData.role === 'proveedor';
      setFormType(isProveedor ? 'proveedor' : 'cliente');
      
      // Preparar los datos según el tipo
      const preparedData = {
        name: editData.name || '',
        email: editData.email || '',
        phone: editData.phone || '',
        role: editData.role || (isProveedor ? 'proveedor' : 'cliente'),
        address: {
          street: editData.address?.street || '',
          city: editData.address?.city || '',
          state: editData.address?.state || ''
        },
        credito: editData.credito || 0,
        notasAdicionales: editData.notasAdicionales || ''
      };
      
      // Agregar campos específicos según el tipo
      if (isProveedor) {
        preparedData.rncCedula = editData.rncCedula || '';
        preparedData.tipoNegocio = editData.tipoNegocio || '';
        preparedData.condicionesPago = editData.condicionesPago || 'inmediato';
        preparedData.contactoPrincipal = editData.contactoPrincipal || '';
      } else {
        preparedData.identificacion = editData.identificacion || '';
        preparedData.tipoCliente = editData.tipoCliente || 'regular';
      }
      
      // Actualizar el estado del formulario
      setFormData(preparedData);
    }
  }, [editData]);

  // Efecto para reiniciar el formulario cuando cambia el tipo
  useEffect(() => {
    // Solo reiniciar si no estamos editando
    if (!editData) {
      setFormData(formType === 'cliente' ? clienteInitialState : proveedorInitialState);
    }
  }, [formType]);

  /**
   * Maneja los cambios en los campos del formulario
   * @param {Object} e - Evento de cambio
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Manejar campos anidados (dirección)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === 'credito') {
      // Convertir a número para el campo de crédito
      setFormData(prev => ({
        ...prev,
        [name]: parseFloat(value) || 0
      }));
    } else {
      // Campos normales
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  /**
   * Maneja el envío del formulario
   * @param {Object} e - Evento de envío
   */
  // Reemplaza la función handleSubmit por esta:
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });
  
    try {
      let responseData;
      // Determinar la API a usar según el tipo
      const isProveedor = formType === 'proveedor';
      
      if (editData) {
        // Actualizar existente
        if (isProveedor) {
          responseData = await providerApi.update(editData._id, formData);
        } else {
          responseData = await clienteApi.update(editData._id, formData);
        }
      } else {
        // Crear nuevo
        if (isProveedor) {
          responseData = await providerApi.create(formData);
        } else {
          responseData = await clienteApi.create(formData);
        }
      }
  
      // Mostrar mensaje de éxito
      setMessage({ 
        text: `¡${isProveedor ? 'Proveedor' : 'Cliente'} ${editData ? 'actualizado' : 'creado'} exitosamente!`, 
        type: 'success' 
      });
      
      // Limpiar formulario si es nuevo registro
      if (!editData) {
        setFormData(isProveedor ? proveedorInitialState : clienteInitialState);
      }
  
      // Llamar al callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess(responseData);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        text: error.response?.data?.message || `Error al procesar el ${formType}`, 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Cambia entre formulario de cliente y proveedor
   * @param {string} type - Tipo de formulario ('cliente' o 'proveedor')
   */
  const changeFormType = (type) => {
    // Solo permitir cambio si no estamos editando
    if (!editData) {
      setFormType(type);
    }
  };

  // Configuración de animaciones con Framer Motion
  const formVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.5,
        staggerChildren: 0.1 
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  const tabVariants = {
    inactive: { 
      backgroundColor: "#F3F4F6", 
      color: "#6B7280",
      boxShadow: "none" 
    },
    active: { 
      backgroundColor: "#4F46E5", 
      color: "#FFFFFF",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" 
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Selector de tipo de formulario */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <motion.button
            className={`px-4 py-2 rounded-md flex-1 ${formType === 'cliente' ? 'text-white font-medium' : 'text-gray-600'}`}
            disabled={loading || !!editData}
            onClick={() => changeFormType('cliente')}
            variants={tabVariants}
            animate={formType === 'cliente' ? 'active' : 'inactive'}
            whileHover={{ scale: formType !== 'cliente' && !editData ? 1.03 : 1 }}
            transition={{ duration: 0.2 }}
          >
            Cliente
          </motion.button>
          
          <motion.button
            className={`px-4 py-2 rounded-md flex-1 ${formType === 'proveedor' ? 'text-white font-medium' : 'text-gray-600'}`}
            disabled={loading || !!editData}
            onClick={() => changeFormType('proveedor')}
            variants={tabVariants}
            animate={formType === 'proveedor' ? 'active' : 'inactive'}
            whileHover={{ scale: formType !== 'proveedor' && !editData ? 1.03 : 1 }}
            transition={{ duration: 0.2 }}
          >
            Proveedor
          </motion.button>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editData 
          ? `Editar ${formType === 'proveedor' ? 'Proveedor' : 'Cliente'}`
          : `Registrar ${formType === 'proveedor' ? 'Proveedor' : 'Cliente'}`}
      </h2>

      {/* Mensajes de éxito o error */}
      {message.text && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Formulario */}
      <motion.form 
        onSubmit={handleSubmit}
        variants={formVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="space-y-4">
          {/* Información básica */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre {formType === 'proveedor' ? 'o Razón Social' : 'Completo'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Campo específico según tipo */}
              <motion.div variants={itemVariants}>
                <label htmlFor={formType === 'proveedor' ? 'rncCedula' : 'identificacion'} className="block text-sm font-medium text-gray-700 mb-1">
                  {formType === 'proveedor' ? 'RNC/Cédula' : 'Identificación/Cédula'}
                </label>
                <input
                  type="text"
                  id={formType === 'proveedor' ? 'rncCedula' : 'identificacion'}
                  name={formType === 'proveedor' ? 'rncCedula' : 'identificacion'}
                  value={formType === 'proveedor' ? formData.rncCedula || '' : formData.identificacion || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Teléfono */}
              <motion.div variants={itemVariants}>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Email */}
              <motion.div variants={itemVariants}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Crédito */}
              <motion.div variants={itemVariants}>
                <label htmlFor="credito" className="block text-sm font-medium text-gray-700 mb-1">
                  {formType === 'proveedor' ? 'Crédito Otorgado (RD$)' : 'Crédito Disponible (RD$)'}
                </label>
                <input
                  type="number"
                  id="credito"
                  name="credito"
                  value={formData.credito}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Campo específico según tipo */}
              {formType === 'proveedor' ? (
                <motion.div variants={itemVariants}>
                  <label htmlFor="condicionesPago" className="block text-sm font-medium text-gray-700 mb-1">
                    Condiciones de Pago
                  </label>
                  <select
                    id="condicionesPago"
                    name="condicionesPago"
                    value={formData.condicionesPago}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="inmediato">Pago Inmediato</option>
                    <option value="15dias">15 días</option>
                    <option value="30dias">30 días</option>
                    <option value="45dias">45 días</option>
                    <option value="60dias">60 días</option>
                    <option value="otro">Otro</option>
                  </select>
                </motion.div>
              ) : (
                <motion.div variants={itemVariants}>
                  <label htmlFor="tipoCliente" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    id="tipoCliente"
                    name="tipoCliente"
                    value={formData.tipoCliente || 'regular'}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="regular">Regular</option>
                    <option value="frecuente">Frecuente</option>
                    <option value="vip">VIP</option>
                  </select>
                </motion.div>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Dirección</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Calle */}
              <motion.div variants={itemVariants} className="md:col-span-2">
                <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
                  Calle y Número
                </label>
                <input
                  type="text"
                  id="address.street"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Ciudad */}
              <motion.div variants={itemVariants}>
                <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
                  Ciudad
                </label>
                <input
                  type="text"
                  id="address.city"
                  name="address.city"
                  value={formData.address.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>

              {/* Estado/Provincia */}
              <motion.div variants={itemVariants}>
                <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
                  Estado/Provincia
                </label>
                <input
                  type="text"
                  id="address.state"
                  name="address.state"
                  value={formData.address.state}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </motion.div>
            </div>
          </div>

          {/* Información adicional específica según tipo solo para proveedores */}
          {formType === 'proveedor' && (
            <div className="bg-gray-50 p-4 rounded-md mb-6">
              <h3 className="font-medium text-gray-700 mb-3">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div variants={itemVariants}>
                  <label htmlFor="tipoNegocio" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Negocio
                  </label>
                  <input
                    type="text"
                    id="tipoNegocio"
                    name="tipoNegocio"
                    value={formData.tipoNegocio || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Ej: Distribuidor, Fabricante, Mayorista"
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label htmlFor="contactoPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    id="contactoPrincipal"
                    name="contactoPrincipal"
                    value={formData.contactoPrincipal || ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Nombre del contacto principal"
                  />
                </motion.div>
              </div>
            </div>
          )}

          {/* Notas adicionales */}
          <motion.div variants={itemVariants}>
            <label htmlFor="notasAdicionales" className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              id="notasAdicionales"
              name="notasAdicionales"
              value={formData.notasAdicionales || ''}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder={`Información adicional importante sobre el ${formType}`}
            ></textarea>
          </motion.div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <motion.button
              type="button"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  setFormData(formType === 'cliente' ? clienteInitialState : proveedorInitialState);
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancelar
            </motion.button>
            <motion.button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-indigo-300"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Procesando...</span>
                </div>
              ) : editData 
                ? `Actualizar ${formType === 'proveedor' ? 'Proveedor' : 'Cliente'}`
                : `Registrar ${formType === 'proveedor' ? 'Proveedor' : 'Cliente'}`
              }
            </motion.button>
          </div>
        </div>
      </motion.form>
    </div>
  );
};

export default ClienteProveedorForm;