/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Componente para el formulario de proveedores
const ProviderForm = ({ editProvider = null, onSuccess }) => {
  // Estado inicial del formulario
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    rncCedula: '',
    tipoNegocio: '',
    condicionesPago: 'inmediato',
    contactoPrincipal: '',
    notasAdicionales: ''
  };

  // Estado para los datos del formulario
  const [formData, setFormData] = useState(initialFormState);
  
  // Estado para controlar la visibilidad de la sección de dirección
  const [showAddressSection, setShowAddressSection] = useState(false);
  
  // Estados para manejar la carga y mensajes
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Efecto para cargar los datos del proveedor si estamos editando
  useEffect(() => {
    if (editProvider) {
      setFormData({
        name: editProvider.name || '',
        email: editProvider.email || '',
        phone: editProvider.phone || '',
        address: {
          street: editProvider.address?.street || '',
          city: editProvider.address?.city || '',
          state: editProvider.address?.state || '',
          zipCode: editProvider.address?.zipCode || '',
          country: editProvider.address?.country || ''
        },
        rncCedula: editProvider.rncCedula || '',
        tipoNegocio: editProvider.tipoNegocio || '',
        condicionesPago: editProvider.condicionesPago || 'inmediato',
        contactoPrincipal: editProvider.contactoPrincipal || '',
        notasAdicionales: editProvider.notasAdicionales || ''
      });
      
      // Mostrar sección de dirección si hay algún dato
      if (editProvider.address && Object.values(editProvider.address).some(val => val)) {
        setShowAddressSection(true);
      }
    }
  }, [editProvider]);

  // Manejar cambios en los campos del formulario
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
    } else {
      // Campos normales
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      let response;

      // Determinar si estamos creando o actualizando
      if (editProvider) {
        // Actualizar proveedor existente
        response = await axios.put(`/api/providers/${editProvider._id}`, formData);
        setMessage({ 
          text: '¡Proveedor actualizado exitosamente!', 
          type: 'success' 
        });
      } else {
        // Crear nuevo proveedor
        response = await axios.post('/api/providers', formData);
        setMessage({ 
          text: '¡Proveedor creado exitosamente!', 
          type: 'success' 
        });
        // Limpiar formulario después de crear
        setFormData(initialFormState);
      }

      // Llamar al callback de éxito si se proporciona
      if (onSuccess) {
        onSuccess(response.data.data);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage({ 
        text: error.response?.data?.message || 'Error al procesar el proveedor', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Animaciones con Framer Motion
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

  return (
    <motion.div
      className="bg-white rounded-lg shadow-md p-6"
      initial="hidden"
      animate="visible"
      variants={formVariants}
    >
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {editProvider ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
      </h2>

      {/* Mensajes de éxito o error */}
      {message.text && (
        <div className={`p-4 mb-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Información básica */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <motion.div variants={itemVariants}>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre o Razón Social <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </motion.div>

              {/* RNC/Cédula */}
              <motion.div variants={itemVariants}>
                <label htmlFor="rncCedula" className="block text-sm font-medium text-gray-700 mb-1">
                  RNC/Cédula
                </label>
                <input
                  type="text"
                  id="rncCedula"
                  name="rncCedula"
                  value={formData.rncCedula}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </motion.div>

              {/* Tipo de Negocio */}
              <motion.div variants={itemVariants}>
                <label htmlFor="tipoNegocio" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Negocio
                </label>
                <input
                  type="text"
                  id="tipoNegocio"
                  name="tipoNegocio"
                  value={formData.tipoNegocio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Ej: Distribuidor, Fabricante, Mayorista"
                />
              </motion.div>

              {/* Condiciones de Pago */}
              <motion.div variants={itemVariants}>
                <label htmlFor="condicionesPago" className="block text-sm font-medium text-gray-700 mb-1">
                  Condiciones de Pago
                </label>
                <select
                  id="condicionesPago"
                  name="condicionesPago"
                  value={formData.condicionesPago}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="inmediato">Pago Inmediato</option>
                  <option value="15dias">15 días</option>
                  <option value="30dias">30 días</option>
                  <option value="45dias">45 días</option>
                  <option value="60dias">60 días</option>
                  <option value="otro">Otro</option>
                </select>
              </motion.div>
            </div>
          </div>

          {/* Información de contacto */}
          <div className="bg-gray-50 p-4 rounded-md mb-6">
            <h3 className="font-medium text-gray-700 mb-3">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </motion.div>

              {/* Contacto Principal */}
              <motion.div variants={itemVariants} className="md:col-span-2">
                <label htmlFor="contactoPrincipal" className="block text-sm font-medium text-gray-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  id="contactoPrincipal"
                  name="contactoPrincipal"
                  value={formData.contactoPrincipal}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Nombre de la persona de contacto"
                />
              </motion.div>
            </div>
          </div>

          {/* Botón para mostrar/ocultar sección de dirección */}
          <motion.button
            type="button"
            onClick={() => setShowAddressSection(!showAddressSection)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-2"
            variants={itemVariants}
          >
            <span>{showAddressSection ? 'Ocultar dirección' : 'Agregar dirección'}</span>
            <svg
              className={`ml-1 w-5 h-5 transform transition-transform ${showAddressSection ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </motion.button>

          {/* Sección de dirección (expandible) */}
          {showAddressSection && (
            <motion.div
              className="bg-gray-50 p-4 rounded-md mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </motion.div>

                {/* Código Postal */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    id="address.zipCode"
                    name="address.zipCode"
                    value={formData.address.zipCode}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </motion.div>

                {/* País */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
                    País
                  </label>
                  <input
                    type="text"
                    id="address.country"
                    name="address.country"
                    value={formData.address.country}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* Notas adicionales */}
          <motion.div variants={itemVariants}>
            <label htmlFor="notasAdicionales" className="block text-sm font-medium text-gray-700 mb-1">
              Notas Adicionales
            </label>
            <textarea
              id="notasAdicionales"
              name="notasAdicionales"
              value={formData.notasAdicionales}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Información adicional importante"
            ></textarea>
          </motion.div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3 pt-4">
            <motion.button
              type="button"
              onClick={() => {
                setFormData(initialFormState);
                if (onSuccess) onSuccess(null);
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
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300"
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
              ) : editProvider ? 'Actualizar Proveedor' : 'Registrar Proveedor'}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default ProviderForm;