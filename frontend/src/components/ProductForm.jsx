/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Scale, ShoppingBag, CreditCard, Search, X } from 'lucide-react';
import ProviderForm from '../components/formClientesProveedores/ProviderForm';

// Constantes para los tipos de unidad
// eslint-disable-next-line no-unused-vars
const UNIT_TYPES = {
  UNIT: 'unidad',
  WEIGHT: 'peso',
  PACKAGE: 'paquete'
};

// eslint-disable-next-line no-unused-vars
const WEIGHT_UNITS = {
  KG: 'kg',
  G: 'g',
  LB: 'lb',
  OZ: 'oz'
};

const PAYMENT_TERMS = [
  { value: '15dias', label: '15 días' },
  { value: '30dias', label: '30 días' },
  { value: '45dias', label: '45 días' },
  { value: '60dias', label: '60 días' },
  { value: 'otro', label: 'Otro' },
];

const ProductForm = ({ onSubmit, initialData, categories, providers, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    barcode: '',
    unitType: 'unidad',
    quantity: 0,
    minStock: 10,
    purchasePrice: 0,
    salePrice: 0,
    category: '',
    description: '',
    // Campos adicionales para productos por peso
    weightUnit: 'lb',
    minWeight: 0.01,
    // Campo para saco de arroz (o productos similares)
    packageWeight: 0,
    pricePerUnit: 0,
    // Campos para proveedor y compra a crédito
    provider: '',
    creditPurchase: {
      isCredit: false,
      paymentTerm: '30dias',
      dueDate: null
    },
    ...initialData
  });

  const [errors, setErrors] = useState({});
  const [barcodeBuffer, setBarcodeBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(Date.now());
  const [isScanning, setIsScanning] = useState(false);
  const [isByWeight, setIsByWeight] = useState(initialData?.unitType === 'peso');
  const [hasBulkPackage, setHasBulkPackage] = useState(
    Boolean(initialData?.packageWeight && initialData?.packageWeight > 0)
  );
  const [isPricePerUnitMode, setIsPricePerUnitMode] = useState(false);
  const [isCreditPurchase, setIsCreditPurchase] = useState(
    initialData?.creditPurchase?.isCredit || false
  );

  const [isProvidedBySupplier, setIsProvidedBySupplier] = useState(
    Boolean(initialData?.provider) || false
  );



  // Detectar si es un producto por peso
  useEffect(() => {
    setIsByWeight(formData.unitType === 'peso');
  }, [formData.unitType]);

  // Manejar entrada del scanner
  useEffect(() => {
    let keypressTimer;
    const handleBarcodeScan = (event) => {
      // Ignorar teclas de control
      if (event.key.length > 1 && event.key !== 'Enter') return;
      
      const currentTime = Date.now();
      if (currentTime - lastKeyTime > 100) {
        setBarcodeBuffer('');
      }
      
      if (event.key === 'Enter') {
        if (barcodeBuffer) {
          setFormData(prev => ({ ...prev, barcode: barcodeBuffer }));
          setBarcodeBuffer('');
          setIsScanning(false);
        }
      } else {
        setBarcodeBuffer(prev => prev + event.key);
        setIsScanning(true);
        
        // Reiniciar el timer
        clearTimeout(keypressTimer);
        keypressTimer = setTimeout(() => {
          setIsScanning(false);
        }, 100);
      }
      
      setLastKeyTime(currentTime);
    };

    window.addEventListener('keydown', handleBarcodeScan);
    return () => {
      window.removeEventListener('keydown', handleBarcodeScan);
      clearTimeout(keypressTimer);
    };
  }, [barcodeBuffer, lastKeyTime]);

  // Calcular precio por unidad cuando cambia el precio total o el peso
  useEffect(() => {
    if (isPricePerUnitMode && isByWeight && hasBulkPackage) {
      // Si estamos en modo de precio por unidad, calculamos el precio total
      const pricePerUnit = parseFloat(formData.pricePerUnit) || 0;
      const packageWeight = parseFloat(formData.packageWeight) || 0;
      if (pricePerUnit > 0 && packageWeight > 0) {
        const totalPrice = pricePerUnit * packageWeight;
        setFormData(prev => ({
          ...prev,
          salePrice: parseFloat(totalPrice.toFixed(2))
        }));
      }
    } else if (isByWeight && hasBulkPackage) {
      // Si estamos en modo de precio total, calculamos el precio por unidad
      const totalPrice = parseFloat(formData.salePrice) || 0;
      const packageWeight = parseFloat(formData.packageWeight) || 0;
      if (totalPrice > 0 && packageWeight > 0) {
        const pricePerUnit = totalPrice / packageWeight;
        setFormData(prev => ({
          ...prev,
          pricePerUnit: parseFloat(pricePerUnit.toFixed(2))
        }));
      }
    }
  }, [formData.salePrice, formData.packageWeight, formData.pricePerUnit, isByWeight, hasBulkPackage, isPricePerUnitMode]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'El nombre es requerido';
    if (!formData.category) newErrors.category = 'La categoría es requerida';
    if (formData.quantity < 0) newErrors.quantity = 'La cantidad no puede ser negativa';
    if (formData.minStock < 0) newErrors.minStock = 'El stock mínimo no puede ser negativo';
    if (formData.purchasePrice < 0) newErrors.purchasePrice = 'El precio de compra no puede ser negativo';
    if (formData.salePrice < 0) newErrors.salePrice = 'El precio de venta no puede ser negativo';
    
    // Validaciones específicas para productos por peso
    if (formData.unitType === 'peso') {
      if (!formData.weightUnit) {
        newErrors.weightUnit = 'La unidad de peso es requerida';
      }
      
      if (hasBulkPackage && (formData.packageWeight <= 0 || !formData.packageWeight)) {
        newErrors.packageWeight = 'El peso del paquete debe ser mayor a 0';
      }
    }
  
    // Validaciones para compra a crédito y proveedor
    if (isProvidedBySupplier && isCreditPurchase) {
      if (!formData.creditPurchase.paymentTerm) {
        newErrors.paymentTerm = 'El término de pago es requerido para compras a crédito';
      }
      
      if (!selectedProvider) {
        newErrors.provider = 'Se requiere un proveedor para compras a crédito';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    // Para entrada manual de código de barras
    if (name === 'barcode') {
      setIsScanning(false);
      setBarcodeBuffer('');
    }
    
    // Manejar cambios en los diferentes tipos de campos
    let finalValue = value;
    if (type === 'number' || name === 'salePrice' || name === 'purchasePrice' || 
        name === 'quantity' || name === 'minStock' || name === 'packageWeight' || 
        name === 'pricePerUnit') {
      finalValue = value === '' ? '' : Number(value);
    } else if (type === 'checkbox') {
      finalValue = checked;
      
      // Actualizar el estado de hasBulkPackage si es el checkbox correspondiente
      if (name === 'hasBulkPackage') {
        setHasBulkPackage(checked);
        if (!checked) {
          // Resetear packageWeight si desmarcamos la opción
          setFormData(prev => ({ ...prev, packageWeight: 0 }));
        }
      }

      // Actualizar el estado de isCreditPurchase
      if (name === 'isCredit') {
        setIsCreditPurchase(checked);
        setFormData(prev => ({
          ...prev,
          creditPurchase: {
            ...prev.creditPurchase,
            isCredit: checked
          }
        }));
        return;
      }
    }

    // Manejar campos anidados de creditPurchase
    if (name.startsWith('creditPurchase.')) {
      const creditField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        creditPurchase: {
          ...prev.creditPurchase,
          [creditField]: finalValue
        }
      }));
    } else {
      // Para el resto de campos
      setFormData(prev => ({
        ...prev,
        [name]: finalValue
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación adicional para el proveedor
    if (isProvidedBySupplier && !selectedProvider && isCreditPurchase) {
      setErrors(prev => ({
        ...prev,
        provider: 'Se requiere un proveedor para compras a crédito'
      }));
      return;
    }
    
    if (validateForm()) {
      // Preparar datos para enviar al servidor
      const submitData = { ...formData };
      
      // Manejar información del proveedor
      if (!isProvidedBySupplier) {
        submitData.provider = '';
        submitData.creditPurchase = {
          isCredit: false
        };
      }
      
      // Si no es un producto por peso, eliminar campos relacionados
      if (submitData.unitType !== 'peso') {
        delete submitData.weightUnit;
        delete submitData.minWeight;
        delete submitData.packageWeight;
        delete submitData.pricePerUnit;
      }
      
      // Asegurarse de que los campos numéricos sean números
      ['purchasePrice', 'salePrice', 'quantity', 'minStock'].forEach(field => {
        if (submitData[field] !== undefined) {
          submitData[field] = Number(submitData[field]);
        }
      });
      
      // Si es un producto por peso, asegurarse de que los campos específicos sean números
      if (submitData.unitType === 'peso') {
        if (submitData.minWeight !== undefined) {
          submitData.minWeight = Number(submitData.minWeight);
        }
        
        if (hasBulkPackage && submitData.packageWeight !== undefined) {
          submitData.packageWeight = Number(submitData.packageWeight);
        } else {
          delete submitData.packageWeight;
        }
      }
  
      // Si no hay compra a crédito, limpiar esos campos
      if (!isCreditPurchase) {
        submitData.creditPurchase = {
          isCredit: false
        };
      } else {
        // Calcular fecha de vencimiento basada en el término de pago
        const dueDate = new Date();
        const term = submitData.creditPurchase.paymentTerm;
        
        if (term === '15dias') {
          dueDate.setDate(dueDate.getDate() + 15);
        } else if (term === '30dias') {
          dueDate.setDate(dueDate.getDate() + 30);
        } else if (term === '45dias') {
          dueDate.setDate(dueDate.getDate() + 45);
        } else if (term === '60dias') {
          dueDate.setDate(dueDate.getDate() + 60);
        }
        
        submitData.creditPurchase.dueDate = dueDate;
        submitData.creditPurchase.isPaid = false;
      }
      
      onSubmit(submitData);
    }
  };

  const handleTogglePriceMode = () => {
    setIsPricePerUnitMode(!isPricePerUnitMode);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Producto
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
        </div>

        <div className="mb-4 relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código de Barras {isScanning && <span className="text-blue-500 ml-2">Escaneando...</span>}
          </label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${isScanning ? 'border-blue-500' : 'border-gray-300'}`}
            placeholder="Escanee o ingrese código de barras"
            autoComplete="off"
          />
          {barcodeBuffer && (
            <div className="absolute -bottom-6 left-0 text-sm text-gray-500">
              Código detectado: {barcodeBuffer}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Unidad
          </label>
          <select
            name="unitType"
            value={formData.unitType}
            onChange={handleChange}
            className="w-full p-2 border rounded-md border-gray-300"
          >
            <option value="unidad">Unidad</option>
            <option value="peso">Peso</option>
            <option value="paquete">Paquete</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isByWeight 
              ? `Cantidad en Inventario (${formData.weightUnit || 'lb'})` 
              : 'Cantidad en Inventario'}
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            min="0"
            step={isByWeight ? "0.01" : "1"}
            className={`w-full p-2 border rounded-md ${errors.quantity ? 'border-red-500' : 'border-gray-300'}`}
            required
          />
          {errors.quantity && <span className="text-red-500 text-sm">{errors.quantity}</span>}
        </div>
      </div>

      {/* Campos específicos para productos por peso */}
      {isByWeight && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale size={18} className="text-blue-600" />
            <h3 className="font-medium text-blue-800">Configuración de Producto por Peso</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidad de Peso
              </label>
              <select
                name="weightUnit"
                value={formData.weightUnit || 'lb'}
                onChange={handleChange}
                className="w-full p-2 border rounded-md border-gray-300"
              >
                <option value="kg">Kilogramos (kg)</option>
                <option value="g">Gramos (g)</option>
                <option value="lb">Libras (lb)</option>
                <option value="oz">Onzas (oz)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Peso Mínimo
              </label>
              <input
                type="number"
                name="minWeight"
                value={formData.minWeight}
                onChange={handleChange}
                min="0.001"
                step="0.001"
                className="w-full p-2 border rounded-md border-gray-300"
              />
              <p className="text-xs text-gray-500 mt-1">
                Peso mínimo que se puede vender
              </p>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="hasBulkPackage"
                name="hasBulkPackage"
                checked={hasBulkPackage}
                onChange={handleChange}
                className="mr-2"
              />
              <label htmlFor="hasBulkPackage" className="text-sm font-medium cursor-pointer">
                Este producto se vende por paquete/saco con peso fijo
              </label>
            </div>
            
            {hasBulkPackage && (
              <div className="border border-blue-200 rounded-lg p-3 mt-2 bg-blue-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Peso del Paquete/Saco ({formData.weightUnit || 'lb'})
                    </label>
                    <input
                      type="number"
                      name="packageWeight"
                      value={formData.packageWeight}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      className={`w-full p-2 border rounded-md ${errors.packageWeight ? 'border-red-500' : 'border-gray-300'}`}
                      placeholder={`Ej: 100 ${formData.weightUnit || 'lb'}`}
                    />
                    {errors.packageWeight && <span className="text-red-500 text-sm">{errors.packageWeight}</span>}
                  </div>
                  
                  {/* Permitir cambiar entre precio total o precio por unidad */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm font-medium text-gray-700">
                        {isPricePerUnitMode 
                          ? `Precio por ${formData.weightUnit || 'lb'}` 
                          : 'Precio del Paquete Completo'}
                      </label>
                      <button
                        type="button"
                        onClick={handleTogglePriceMode}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Cambiar a {isPricePerUnitMode ? 'precio total' : 'precio por unidad'}
                      </button>
                    </div>
                    
                    {isPricePerUnitMode ? (
                      <div>
                        <input
                          type="number"
                          name="pricePerUnit"
                          value={formData.pricePerUnit}
                          onChange={handleChange}
                          min="0.01"
                          step="0.01"
                          className="w-full p-2 border rounded-md border-gray-300"
                          placeholder={`Precio por ${formData.weightUnit || 'lb'}`}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Precio total: ${formData.salePrice}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="number"
                          name="salePrice"
                          value={formData.salePrice}
                          onChange={handleChange}
                          min="0.01"
                          step="0.01"
                          className="w-full p-2 border rounded-md border-gray-300"
                          placeholder="Precio total del paquete"
                        />
                        {formData.packageWeight > 0 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Precio por {formData.weightUnit || 'lb'}: ${formData.pricePerUnit}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {formData.packageWeight > 0 && formData.salePrice > 0 && (
                  <div className="mt-3 p-2 bg-blue-200 rounded text-sm">
                    <p className="font-medium text-blue-800">
                      Un saco de {formData.packageWeight} {formData.weightUnit || 'lb'} 
                      se vende a ${formData.salePrice} 
                      (${formData.pricePerUnit} por {formData.weightUnit || 'lb'})
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock Mínimo
          </label>
          <input
            type="number"
            name="minStock"
            value={formData.minStock}
            onChange={handleChange}
            min="0"
            step={isByWeight ? "0.01" : "1"}
            className={`w-full p-2 border rounded-md ${errors.minStock ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.minStock && <span className="text-red-500 text-sm">{errors.minStock}</span>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={`w-full p-2 border rounded-md ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories?.map(cat => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.category && <span className="text-red-500 text-sm">{errors.category}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Precio de Compra
          </label>
          <div className="relative">
            <span className="absolute left-2 top-2">$</span>
            <input
              type="number"
              name="purchasePrice"
              value={formData.purchasePrice}
              onChange={handleChange}
              min="0"
              step="0.01"
              className={`w-full p-2 pl-6 border rounded-md ${errors.purchasePrice ? 'border-red-500' : 'border-gray-300'}`}
              required
            />
          </div>
          {errors.purchasePrice && <span className="text-red-500 text-sm">{errors.purchasePrice}</span>}
          
          {isCreditPurchase && (
            <p className="text-xs text-amber-600 mt-1 flex items-center">
              <CreditCard size={14} className="mr-1" />
              Compra a crédito con plazo de {
                formData.creditPurchase.paymentTerm === '15dias' ? '15 días' :
                formData.creditPurchase.paymentTerm === '30dias' ? '30 días' :
                formData.creditPurchase.paymentTerm === '45dias' ? '45 días' :
                formData.creditPurchase.paymentTerm === '60dias' ? '60 días' : 'plazo variable'
              }
            </p>
          )}
        </div>

        {/* Precio de venta (sólo se muestra si no es un producto por peso con paquete o si estamos en modo precio total) */}
        {(!isByWeight || !hasBulkPackage || !isPricePerUnitMode) && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isByWeight && !hasBulkPackage 
                ? `Precio de Venta (por ${formData.weightUnit || 'lb'})` 
                : 'Precio de Venta'}
            </label>
            <div className="relative">
              <span className="absolute left-2 top-2">$</span>
              <input
                type="number"
                name="salePrice"
                value={formData.salePrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full p-2 pl-6 border rounded-md ${errors.salePrice ? 'border-red-500' : 'border-gray-300'}`}
                required
              />
            </div>
            {errors.salePrice && <span className="text-red-500 text-sm">{errors.salePrice}</span>}
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="w-full p-2 border rounded-md border-gray-300"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <motion.button
          type="button"
          onClick={onClose}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {initialData ? 'Actualizar' : 'Guardar'}
        </motion.button>
      </div>
    </form>
  );
};

export default ProductForm;