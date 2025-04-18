import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BsArrowLeft, BsTrash, BsX } from 'react-icons/bs';
import { FaPlus, FaFileUpload } from 'react-icons/fa';

import { getSupplierById, updateSupplier, deleteDocument } from '../../services/supplierService';

const EditarProveedor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [supplierData, setSupplierData] = useState({
    name: '',
    taxId: '',
    supplierType: 'Productos',
    category: 'General',
    status: 'Activo',
    address: '',
    phone: '',
    email: '',
    contactPerson: '',
    website: '',
    fiscalId: '',
    fiscalRegime: '',
    vatCondition: '',
    preferredPaymentMethod: 'Efectivo',
    currency: 'USD',
    relationshipStartDate: new Date().toISOString().split('T')[0],
    paymentTerms: 30,
    notes: ''
  });
  
  const [existingDocuments, setExistingDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [documentsToRemove, setDocumentsToRemove] = useState([]);
  
  // Estados para validación
  const [validationErrors, setValidationErrors] = useState({});
  
  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true);
        const response = await getSupplierById(id);
        
        if (response && response.data) {
          const supplier = response.data;
          
          // Convertir fecha a formato YYYY-MM-DD para el input date
          const formattedDate = supplier.relationshipStartDate 
            ? new Date(supplier.relationshipStartDate).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0];
          
          setSupplierData({
            name: supplier.name || '',
            taxId: supplier.taxId || '',
            supplierType: supplier.supplierType || 'Productos',
            category: supplier.category || 'General',
            status: supplier.status || 'Activo',
            address: supplier.address || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            contactPerson: supplier.contactPerson || '',
            website: supplier.website || '',
            fiscalId: supplier.fiscalId || '',
            fiscalRegime: supplier.fiscalRegime || '',
            vatCondition: supplier.vatCondition || '',
            preferredPaymentMethod: supplier.preferredPaymentMethod || 'Efectivo',
            currency: supplier.currency || 'USD',
            relationshipStartDate: formattedDate,
            paymentTerms: supplier.paymentTerms || 30,
            notes: supplier.notes || ''
          });
          
          // Cargar documentos existentes
          if (supplier.documents && supplier.documents.length > 0) {
            setExistingDocuments(supplier.documents);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar los datos del proveedor:', error);
        setError('Error al cargar los datos del proveedor');
        setLoading(false);
        toast.error('Error al cargar los datos del proveedor');
      }
    };
    
    fetchSupplierData();
  }, [id]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupplierData({
      ...supplierData,
      [name]: value
    });
    
    // Borrar mensaje de error al editar el campo
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
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      toast.error('Solo se permiten archivos PDF, imágenes, DOC y DOCX');
      return;
    }
    
    // Validar tamaño máximo (5MB)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error('El tamaño máximo por archivo es de 5MB');
      return;
    }
    
    setNewDocuments([...newDocuments, ...files]);
    e.target.value = null; // Limpiar input para permitir subir el mismo archivo
  };
  
  const handleRemoveNewDocument = (index) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
  };
  
  const handleRemoveExistingDocument = (document) => {
    // Marcar el documento para eliminación en el backend
    setDocumentsToRemove([...documentsToRemove, document._id]);
    // Remover de la lista de visualización
    setExistingDocuments(existingDocuments.filter(doc => doc._id !== document._id));
    
    toast.info('El documento será eliminado al guardar los cambios');
  };
  
  const validateForm = () => {
    const errors = {};
    
    if (!supplierData.name.trim()) errors.name = 'El nombre es obligatorio';
    if (!supplierData.taxId.trim()) errors.taxId = 'El RUC/ID fiscal es obligatorio';
    
    // Validar formato de email
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
      
      // Añadir IDs de documentos a eliminar
      const dataToUpdate = {
        ...supplierData,
        documentsToRemove: documentsToRemove
      };
      
      await updateSupplier(id, dataToUpdate, newDocuments);
      
      toast.success('Proveedor actualizado con éxito');
      navigate(`/dashboard/proveedores/${id}`);
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      setError('Error al actualizar proveedor');
      toast.error('Error al actualizar el proveedor');
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
        <button 
          onClick={() => navigate('/dashboard/proveedores')} 
          className="mt-4 inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          <BsArrowLeft className="mr-2" /> Volver a Proveedores
        </button>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white rounded-lg shadow-md"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Editar Proveedor</h2>
        <button
          onClick={() => navigate(`/dashboard/proveedores/${id}`)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
        >
          <BsArrowLeft className="mr-2" /> Volver
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
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
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
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  validationErrors.taxId ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.taxId && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.taxId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Tipo de Proveedor
              </label>
              <select
                name="supplierType"
                value={supplierData.supplierType}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Productos">Productos</option>
                <option value="Servicios">Servicios</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Categoría
              </label>
              <select
                name="category"
                value={supplierData.category}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
                <option value="En evaluación">En evaluación</option>
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                  validationErrors.email ? 'border-red-500' : ''
                }`}
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Información Fiscal */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Fiscal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                ID Fiscal
              </label>
              <input
                type="text"
                name="fiscalId"
                value={supplierData.fiscalId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Régimen Fiscal
              </label>
              <input
                type="text"
                name="fiscalRegime"
                value={supplierData.fiscalRegime}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Condición frente al IVA
              </label>
              <input
                type="text"
                name="vatCondition"
                value={supplierData.vatCondition}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Información Comercial */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Información Comercial</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Método de Pago Preferido
              </label>
              <select
                name="preferredPaymentMethod"
                value={supplierData.preferredPaymentMethod}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="Efectivo">Efectivo</option>
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Cheque">Cheque</option>
                <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                <option value="PayPal">PayPal</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Moneda Preferida
              </label>
              <select
                name="currency"
                value={supplierData.currency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="USD">USD - Dólar Estadounidense</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Libra Esterlina</option>
                <option value="JPY">JPY - Yen Japonés</option>
                <option value="CAD">CAD - Dólar Canadiense</option>
                <option value="AUD">AUD - Dólar Australiano</option>
                <option value="MXN">MXN - Peso Mexicano</option>
                <option value="BRL">BRL - Real Brasileño</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Inicio de Relación
              </label>
              <input
                type="date"
                name="relationshipStartDate"
                value={supplierData.relationshipStartDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </div>
        
        {/* Documentos */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Documentos</h3>
          
          {/* Documentos existentes */}
          {existingDocuments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Documentos actuales</h4>
              <ul className="space-y-2">
                {existingDocuments.map((doc, index) => (
                  <li key={doc._id || index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm truncate flex-1">{doc.originalName || doc.name || `Documento ${index + 1}`}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingDocument(doc)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BsTrash />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Nuevos documentos */}
          {newDocuments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-800 mb-2">Nuevos documentos</h4>
              <ul className="space-y-2">
                {newDocuments.map((doc, index) => (
                  <li key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                    <span className="text-sm truncate flex-1">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewDocument(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <BsX />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Subir nuevos documentos */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subir nuevos documentos
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Añade cualquier nota relevante sobre este proveedor..."
            />
          </div>
        </div>
        
        {/* Botones de acción */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/proveedores/${id}`)}
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
              'Guardar Cambios'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default EditarProveedor; 