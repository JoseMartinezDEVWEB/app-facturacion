import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { FaArrowLeft, FaFileUpload } from 'react-icons/fa';
import { IoClose } from 'react-icons/io5';

// Servicios y utilidades
import { createSupplier } from '../../services/supplierService';
import { SUPPLIER_STATUS, ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from '../../config/constants';

const CrearProveedor = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  
  const [supplierData, setSupplierData] = useState({
    name: '',
    taxId: '',
    status: SUPPLIER_STATUS.ACTIVE,
    category: 'General',
    address: '',
    phone: '',
    email: '',
    website: '',
    contactPerson: '',
    paymentTerms: 30,
    notes: ''
  });
  
  const [documents, setDocuments] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupplierData({
      ...supplierData,
      [name]: value
    });
    
    // Limpiar error de validación si existe
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: null
      });
    }
  };
  
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validar tipos de archivo permitidos
    const allowedTypes = [...ALLOWED_FILE_TYPES.IMAGES, ...ALLOWED_FILE_TYPES.DOCUMENTS];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos PDF, imágenes y documentos Office');
      return;
    }
    
    // Validar tamaño máximo
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`El tamaño máximo por archivo es de ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }
    
    setDocuments([...documents, ...files]);
    e.target.value = null; // Limpiar input para permitir subir el mismo archivo
  };
  
  const handleRemoveDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!supplierData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!supplierData.taxId.trim()) errors.taxId = 'El RUC/ID fiscal es obligatorio';
    
    // Validar email si fue ingresado
    if (supplierData.email && !/^\S+@\S+\.\S+$/.test(supplierData.email)) {
      errors.email = 'Formato de email inválido';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Por favor, corrija los errores del formulario');
      return;
    }
    
    try {
      setSaving(true);
      const result = await createSupplier(supplierData, documents);
      
      toast.success('Proveedor creado con éxito');
      navigate(`/dashboard/proveedores/${result._id}`);
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      toast.error('Error al crear el proveedor. Por favor, intente nuevamente.');
      setSaving(false);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Nuevo Proveedor</h2>
        <button
          onClick={() => navigate('/dashboard/proveedores')}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <FaArrowLeft className="mr-2" /> Volver
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Básica */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={supplierData.name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 ${
                  validationErrors.name ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.name && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                RUC/ID Fiscal <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="taxId"
                value={supplierData.taxId}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 ${
                  validationErrors.taxId ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.taxId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.taxId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select
                name="category"
                value={supplierData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              >
                <option value="General">General</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Materiales">Materiales</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Servicios">Servicios</option>
                <option value="Logística">Logística</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Estado
              </label>
              <select
                name="status"
                value={supplierData.status}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              >
                <option value={SUPPLIER_STATUS.ACTIVE}>Activo</option>
                <option value={SUPPLIER_STATUS.INACTIVE}>Inactivo</option>
                <option value={SUPPLIER_STATUS.PENDING}>Pendiente</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Información de Contacto */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Dirección
              </label>
              <input
                type="text"
                name="address"
                value={supplierData.address}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="text"
                name="phone"
                value={supplierData.phone}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={supplierData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300 ${
                  validationErrors.email ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Sitio Web
              </label>
              <input
                type="text"
                name="website"
                value={supplierData.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Persona de Contacto
              </label>
              <input
                type="text"
                name="contactPerson"
                value={supplierData.contactPerson}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Términos de Pago (días)
              </label>
              <input
                type="number"
                name="paymentTerms"
                value={supplierData.paymentTerms}
                onChange={handleChange}
                min="0"
                className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              />
            </div>
          </div>
        </div>
        
        {/* Documentos */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos</h3>
          
          {/* Documentos seleccionados */}
          {documents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Documentos a subir</h4>
              <ul className="space-y-2">
                {documents.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm truncate flex-1">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <IoClose size={20} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Subir nuevos documentos */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subir documentos
            </label>
            <div className="flex items-center">
              <label className="cursor-pointer bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none">
                <FaFileUpload className="mr-2 inline" />
                Seleccionar archivos
                <input
                  type="file"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                />
              </label>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Formatos permitidos: PDF, JPEG, PNG, DOC, DOCX. Tamaño máximo: 5MB por archivo.
            </p>
          </div>
        </div>
        
        {/* Notas */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Notas</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notas o comentarios
            </label>
            <textarea
              name="notes"
              value={supplierData.notes}
              onChange={handleChange}
              rows={4}
              className="mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm border-gray-300"
              placeholder="Añade cualquier nota relevante sobre este proveedor..."
            />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/dashboard/proveedores')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none disabled:opacity-50"
            disabled={saving}
          >
            {saving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </span>
            ) : (
              'Guardar Proveedor'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CrearProveedor; 