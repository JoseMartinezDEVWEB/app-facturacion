/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createExpense, updateExpense, getExpense } from '../../services/expenseService';

const GastoForm = ({ initialData, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    category: 'Otro',
    paymentMethod: 'Efectivo',
    deductFromSales: false,
    deductionPeriod: 'day',
    receipt: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Si hay datos iniciales (edición), actualizar el estado
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        amount: initialData.amount || '',
        category: initialData.category || 'Otro',
        paymentMethod: initialData.paymentMethod || 'Efectivo',
        deductFromSales: initialData.deductFromSales || false,
        deductionPeriod: initialData.deductionPeriod || 'day',
        receipt: initialData.receipt || null
      });
    }
  }, [initialData]);
  
  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    // Para checkbox usamos el valor de checked
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } 
    // Para archivos, guardamos el archivo
    else if (type === 'file') {
      setFormData(prev => ({
        ...prev,
        [name]: files[0] || null
      }));
    } 
    // Para otros tipos de campos, usamos value
    else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Limpiar error al editar el campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };
  
  // Validar el formulario
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'El monto es obligatorio';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'El monto debe ser un número positivo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsSubmitting(true);
      
      try {
        // Si hay un archivo, usamos FormData para la solicitud
        if (formData.receipt instanceof File) {
          const formDataToSend = new FormData();
          
          // Agregar todos los campos al FormData
          formDataToSend.append('name', formData.name);
          formDataToSend.append('description', formData.description);
          formDataToSend.append('amount', Number(formData.amount));
          formDataToSend.append('category', formData.category);
          formDataToSend.append('paymentMethod', formData.paymentMethod);
          formDataToSend.append('deductFromSales', formData.deductFromSales);
          formDataToSend.append('deductionPeriod', formData.deductionPeriod);
          formDataToSend.append('receipt', formData.receipt);
          
          if (initialData) {
            // Actualizar gasto existente con FormData
            await updateExpense(initialData._id, formDataToSend, true);
            // Obtener el gasto actualizado para pasarlo a onSuccess
            const updatedExpense = await getExpense(initialData._id);
            onSuccess(updatedExpense);
          } else {
            // Crear nuevo gasto con FormData
            const newExpense = await createExpense(formDataToSend, true);
            onSuccess(newExpense);
          }
        } else {
          // Si no hay archivo, enviamos el objeto JSON normal
          const expenseData = {
            ...formData,
            amount: Number(formData.amount)
          };
          
          if (initialData) {
            // Actualizar gasto existente
            await updateExpense(initialData._id, expenseData);
            // Obtener el gasto actualizado para pasarlo a onSuccess
            const updatedExpense = await getExpense(initialData._id);
            onSuccess(updatedExpense);
          } else {
            // Crear nuevo gasto
            const newExpense = await createExpense(expenseData);
            onSuccess(newExpense);
          }
        }
        
        // Resetear el formulario si es una creación
        if (!initialData) {
          setFormData({
            name: '',
            description: '',
            amount: '',
            category: 'Otro',
            paymentMethod: 'Efectivo',
            deductFromSales: false,
            deductionPeriod: 'day',
            receipt: null
          });
        }
      } catch (error) {
        console.error('Error al guardar el gasto:', error);
        
        // Manejar errores de validación desde el servidor
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else if (error.message && error.message.includes("Network Error")) {
          // Error de conexión al servidor
          setErrors({
            general: 'No se pudo conectar al servidor. Verifica tu conexión a Internet.'
          });
        } else {
          // Mostrar un error general
          console.log("Error completo:", error);
          setErrors({
            general: error.response?.data?.message || 'Error al guardar el gasto. Por favor, intenta de nuevo.'
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-lg shadow-md"
    >
      <h2 className="text-xl font-bold mb-4">
        {initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
      </h2>
      
      {errors.general && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{errors.general}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
            Nombre del Gasto *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
            }`}
            placeholder="Ej. Compra de suministros"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="description">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Detalles del gasto..."
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="amount">
            Monto *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <span className="text-gray-500">RD$</span>
            </div>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              disabled={isSubmitting}
              className={`w-full pl-12 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.amount ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-blue-200'
              }`}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>
          {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
        </div>
        
        {/* Opción para descontar de ventas */}
        <div className="mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="deductFromSales"
              name="deductFromSales"
              checked={formData.deductFromSales}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label className="ml-2 block text-gray-700" htmlFor="deductFromSales">
              Descontar de las ventas
            </label>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-6">
            Si activas esta opción, el monto del gasto se restará del total de ventas
          </p>
        </div>
        
        {/* Campo para elegir el periodo de descuento */}
        {formData.deductFromSales && (
          <div className="mb-4 ml-6">
            <label className="block text-gray-700 font-medium mb-2">
              Periodo para descontar
            </label>
            <div className="flex space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="deductionPeriodDay"
                  name="deductionPeriod"
                  value="day"
                  checked={formData.deductionPeriod === 'day'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-gray-700" htmlFor="deductionPeriodDay">
                  Descontar del día
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="deductionPeriodMonth"
                  name="deductionPeriod"
                  value="month"
                  checked={formData.deductionPeriod === 'month'}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <label className="ml-2 block text-gray-700" htmlFor="deductionPeriodMonth">
                  Descontar del mes
                </label>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="category">
              Categoría
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="Operativo">Operativo</option>
              <option value="Material">Material</option>
              <option value="Servicio">Servicio</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-gray-700 font-medium mb-2" htmlFor="paymentMethod">
              Método de Pago
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2" htmlFor="receipt">
            Comprobante (opcional)
          </label>
          <input
            type="file"
            id="receipt"
            name="receipt"
            onChange={handleChange}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            accept="image/*,.pdf"
          />
          <p className="text-gray-500 text-sm mt-1">Sube una imagen o PDF del comprobante del gasto</p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50 flex items-center"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Guardando...
              </>
            ) : (
              initialData ? 'Actualizar' : 'Guardar'
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default GastoForm;