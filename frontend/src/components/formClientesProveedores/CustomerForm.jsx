/* eslint-disable react/prop-types */
// src/components/customers/CustomerForm.jsx
import  { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// Componente para el formulario de clientes
const CustomerForm = ({ editCustomer = null, onSuccess }) => {
  // Estado inicial del formulario
  const initialFormState = {
    name: '',
    email: '',
    phone: '',
    role: 'cliente', // Por defecto es cliente
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    credito: 0,
    // Campos específicos para clientes
    tipoCliente: 'regular', // regular, frecuente, vip
    identificacion: '',
    fechaNacimiento: '',
    referidoPor: '',
    notasAdicionales: ''
  };

  // Estado para los datos del formulario
  const [formData, setFormData] = useState(initialFormState);
  
  // Estado para controlar la visibilidad de secciones
  const [showAddressSection, setShowAddressSection] = useState(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  
  // Estados para manejar la carga y mensajes
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Efecto para cargar los datos del cliente si estamos editando
  useEffect(() => {
    if (editCustomer) {
      const formattedData = {
        name: editCustomer.name || '',
        email: editCustomer.email || '',
        phone: editCustomer.phone || '',
        role: editCustomer.role || 'cliente',
        address: {
          street: editCustomer.address?.street || '',
          city: editCustomer.address?.city || '',
          state: editCustomer.address?.state || '',
          zipCode: editCustomer.address?.zipCode || '',
          country: editCustomer.address?.country || ''
        },
        credito: editCustomer.credito || 0,
        tipoCliente: editCustomer.tipoCliente || 'regular',
        identificacion: editCustomer.identificacion || '',
        fechaNacimiento: editCustomer.fechaNacimiento ? editCustomer.fechaNacimiento.slice(0, 10) : '',
        referidoPor: editCustomer.referidoPor || '',
        notasAdicionales: editCustomer.notasAdicionales || ''
      };

      setFormData(formattedData);
      
      // Mostrar sección de dirección si hay algún dato
      if (editCustomer.address && Object.values(editCustomer.address).some(val => val)) {
        setShowAddressSection(true);
      }
      
      // Mostrar información adicional si hay algún dato en esos campos
      if (editCustomer.identificacion || editCustomer.fechaNacimiento || editCustomer.referidoPor) {
        setShowAdditionalInfo(true);
      }
    }
  }, [editCustomer]);

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

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      let response;
      const endpoint = '/api/clientes'; // Asegúrate de que esta ruta coincida con tu backend

      // Determinar si estamos creando o actualizando
      if (editCustomer) {
        // Actualizar cliente existente
        response = await axios.put(`${endpoint}/${editCustomer._id}`, formData);
        setMessage({ 
          text: '¡Cliente actualizado exitosamente!', 
          type: 'success' 
        });
      } else {
        // Crear nuevo cliente
        response = await axios.post(endpoint, formData);
        setMessage({ 
          text: '¡Cliente creado exitosamente!', 
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
        text: error.response?.data?.message || 'Error al procesar el cliente', 
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
        {editCustomer ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
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
                  Nombre Completo <span className="text-red-500">*</span>
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

              {/* Tipo de Cliente */}
              <motion.div variants={itemVariants}>
                <label htmlFor="tipoCliente" className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cliente
                </label>
                <select
                  id="tipoCliente"
                  name="tipoCliente"
                  value={formData.tipoCliente}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="regular">Regular</option>
                  <option value="frecuente">Frecuente</option>
                  <option value="vip">VIP</option>
                </select>
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

              {/* Crédito */}
              <motion.div variants={itemVariants}>
                <label htmlFor="credito" className="block text-sm font-medium text-gray-700 mb-1">
                  Crédito Disponible (RD$)
                </label>
                <input
                  type="number"
                  id="credito"
                  name="credito"
                  value={formData.credito}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
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

          {/* Botón para mostrar/ocultar información adicional */}
          <motion.button
            type="button"
            onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-2"
            variants={itemVariants}
          >
            <span>{showAdditionalInfo ? 'Ocultar información adicional' : 'Agregar información adicional'}</span>
            <svg
              className={`ml-1 w-5 h-5 transform transition-transform ${showAdditionalInfo ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </motion.button>

          {/* Información adicional (expandible) */}
          {showAdditionalInfo && (
            <motion.div
              className="bg-gray-50 p-4 rounded-md mb-6"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h3 className="font-medium text-gray-700 mb-3">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Identificación */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="identificacion" className="block text-sm font-medium text-gray-700 mb-1">
                    Cédula/RNC
                  </label>
                  <input
                    type="text"
                    id="identificacion"
                    name="identificacion"
                    value={formData.identificacion}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </motion.div>

                {/* Fecha de Nacimiento */}
                <motion.div variants={itemVariants}>
                  <label htmlFor="fechaNacimiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    id="fechaNacimiento"
                    name="fechaNacimiento"
                    value={formData.fechaNacimiento}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </motion.div>

                {/* Referido Por */}
                <motion.div variants={itemVariants} className="md:col-span-2">
                  <label htmlFor="referidoPor" className="block text-sm font-medium text-gray-700 mb-1">
                    Referido Por
                  </label>
                  <input
                    type="text"
                    id="referidoPor"
                    name="referidoPor"
                    value={formData.referidoPor}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Nombre de quien refirió a este cliente"
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
              placeholder="Información adicional importante sobre el cliente"
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
              ) : editCustomer ? 'Actualizar Cliente' : 'Registrar Cliente'}
            </motion.button>
          </div>
        </div>
      </form>
    </motion.div>
  );
};

export default CustomerForm;