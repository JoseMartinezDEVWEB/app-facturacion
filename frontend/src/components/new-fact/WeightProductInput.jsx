import { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Scale } from 'lucide-react';

const WeightProductInput = ({ product, onAddToCart }) => {
  const [weight, setWeight] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const [error, setError] = useState('');
  const weightInputRef = useRef(null);

  // Determinar el peso mínimo de venta (independiente del peso del paquete)
  const minSellWeight = product.minWeight || 0.01;
  
  // Determinar el precio por unidad de peso
  const hasPackageWeight = product.packageWeight && product.packageWeight > 0;
  const pricePerUnit = product.pricePerUnit || 
    (hasPackageWeight ? product.salePrice / product.packageWeight : product.salePrice);

  // Enfocar el campo de peso cuando el componente se monta
  useEffect(() => {
    if (weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, []);

  // Actualizar precio total cuando cambia el peso
  useEffect(() => {
    if (!weight || isNaN(parseFloat(weight))) {
      setTotalPrice(0);
      return;
    }
    
    const weightValue = parseFloat(weight);
    const calculatedPrice = weightValue * pricePerUnit;
    setTotalPrice(calculatedPrice);
    
    // Validar contra el peso mínimo de venta
    if (weightValue < minSellWeight) {
      setError(`Peso mínimo: ${minSellWeight} ${product.weightUnit || 'kg'}`);
    } else {
      setError('');
    }
  }, [weight, pricePerUnit, minSellWeight, product.weightUnit]);

  // Manejar teclas para interacciones
  const handleKeyDown = useCallback((e) => {
    // Si se presiona Enter, agregar al carrito (si no hay error)
    if (e.key === 'Enter' && !error && weight) {
      addProductToCart();
    }
    
    // Si se presiona Escape, cerrar el componente
    if (e.key === 'Escape') {
      // Aquí podríamos usar una prop como onClose si fuera necesario
      // Por ahora simplemente limpiamos los estados
      setWeight('');
      setTotalPrice(0);
      setError('');
    }
  }, [weight, error, product]);

  // Añadir event listener para teclas
  useEffect(() => {
    const input = weightInputRef.current;
    if (input) {
      input.addEventListener('keydown', handleKeyDown);
    }
    
    return () => {
      if (input) {
        input.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [handleKeyDown]);

  const handleWeightChange = (e) => {
    const inputValue = e.target.value;
    
    // Permitir entrada vacía, números y punto decimal
    if (inputValue === '' || /^\d*\.?\d*$/.test(inputValue)) {
      setWeight(inputValue);
    }
  };

  const addProductToCart = () => {
    const weightValue = parseFloat(weight);
    
    // Validaciones
    if (!weight || isNaN(weightValue)) {
      setError('Ingrese un peso válido');
      return;
    }
    
    if (weightValue < minSellWeight) {
      setError(`Peso mínimo: ${minSellWeight} ${product.weightUnit || 'kg'}`);
      return;
    }
    
    // Crear objeto para el carrito
    const cartItem = {
      ...product,
      weightInfo: {
        value: weightValue,
        unit: product.weightUnit || 'kg',
        pricePerUnit
      },
      calculatedPrice: totalPrice // Precio total para este ítem
    };
    
    onAddToCart(cartItem);
    
    // Limpiar después de añadir
    setWeight('');
    setTotalPrice(0);
    setError('');
  };

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center gap-2 mb-2">
        <Scale size={18} className="text-blue-500" />
        <span className="font-medium">Producto por peso</span>
      </div>
      
      <p className="text-gray-700 mb-2">
        Precio: ${pricePerUnit.toFixed(2)} por {product.weightUnit || 'kg'}
      </p>
      
      <div className="flex flex-col gap-3">
        <div>
          <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
            Peso ({product.weightUnit || 'kg'})
          </label>
          <div className="flex items-center gap-2">
            <input
              id="weight"
              type="text"
              className={`flex-grow p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
              value={weight}
              onChange={handleWeightChange}
              placeholder={`Mínimo: ${minSellWeight} ${product.weightUnit || 'kg'}`}
              ref={weightInputRef}
            />
            <span className="text-gray-500">{product.weightUnit || 'kg'}</span>
          </div>
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>
        
        <div className="flex justify-between items-center">
          <div className="font-bold">
            Total: ${totalPrice.toFixed(2)}
          </div>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            onClick={addProductToCart}
            disabled={!weight || isNaN(parseFloat(weight)) || parseFloat(weight) < minSellWeight}
          >
            Agregar al carrito
          </button>
        </div>
        
        {hasPackageWeight && (
          <div className="mt-2 p-3 bg-amber-50 rounded-md border border-amber-200">
            <p className="text-sm text-amber-800 mb-2">
              <span className="font-medium">También disponible en paquetes:</span> {product.packageWeight} {product.weightUnit || 'kg'} a ${product.salePrice.toFixed(2)}
            </p>
            <button 
              className="w-full p-1.5 bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
              onClick={() => {
                // Crear un objeto para paquete completo
                const packageItem = {
                  ...product,
                  weightInfo: {
                    value: product.packageWeight,
                    unit: product.weightUnit || 'kg',
                    pricePerUnit,
                    isFullPackage: true
                  },
                  calculatedPrice: product.salePrice
                };
                onAddToCart(packageItem);
              }}
            >
              Agregar paquete completo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

WeightProductInput.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    salePrice: PropTypes.number.isRequired,
    weightUnit: PropTypes.string,
    minWeight: PropTypes.number,
    packageWeight: PropTypes.number,
    pricePerUnit: PropTypes.number,
    unitType: PropTypes.string.isRequired
  }).isRequired,
  onAddToCart: PropTypes.func.isRequired
};

export default WeightProductInput;