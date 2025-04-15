import { useState, useEffect, useRef } from 'react';
import { Scale, Package, ShoppingCart } from 'lucide-react';
import PropTypes from 'prop-types';

const ProductWeightDisplay = ({ product, onAddToCart }) => {
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const weightInputRef = useRef(null);
  
  // Determinar si el producto se vende en paquetes/sacos completos
  const hasPackageWeight = product.packageWeight && product.packageWeight > 0;
  
  // Determinar el peso mínimo de venta (independiente del peso del paquete)
  const minSellWeight = product.minWeight || 0.01;
  
  // Determinar el precio por unidad de peso (por libra, kg, etc.)
  const pricePerUnit = product.pricePerUnit || 
    (hasPackageWeight ? product.salePrice / product.packageWeight : product.salePrice);
  
  // Enfocar el campo de peso al montar el componente
  useEffect(() => {
    if (weightInputRef.current) {
      weightInputRef.current.focus();
    }
  }, []);
  
  // Manejar atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Si se presiona Enter y hay un peso válido, agregar al carrito
      if (e.key === 'Enter' && weight && parseFloat(weight) >= minSellWeight) {
        handleAddToCart();
      }
      
      // Si se presiona Escape, limpiar la selección
      if (e.key === 'Escape') {
        setWeight('');
        setCalculatedPrice(0);
        setError('');
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [weight, minSellWeight]);
  
  // Manejar cambio de peso
  const handleWeightChange = (e) => {
    const value = e.target.value;
    
    // Validar que solo se ingresen números y punto decimal
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWeight(value);
      setError('');
      
      // Calcular precio si hay un valor válido
      if (value && !isNaN(parseFloat(value))) {
        const weightValue = parseFloat(value);
        
        // Validar contra el peso mínimo de venta
        if (weightValue < minSellWeight) {
          setError(`El peso mínimo es ${minSellWeight} ${product.weightUnit}`);
        }
        
        // Calcular precio basado en el precio por unidad
        const price = weightValue * pricePerUnit;
        setCalculatedPrice(price);
      } else {
        setCalculatedPrice(0);
      }
    }
  };
  
  // Manejar la adición al carrito
  const handleAddToCart = () => {
    if (!weight || isNaN(parseFloat(weight))) {
      setError('Ingrese un peso válido');
      return;
    }
    
    const weightValue = parseFloat(weight);
    
    // Validar contra el peso mínimo de venta
    if (weightValue < minSellWeight) {
      setError(`El peso mínimo es ${minSellWeight} ${product.weightUnit}`);
      return;
    }
    
    setIsAdding(true);
    
    // Preparar el producto para el carrito
    const cartItem = {
      ...product,
      weightInfo: {
        value: weightValue,
        unit: product.weightUnit,
        pricePerUnit
      },
      calculatedPrice: parseFloat((weightValue * pricePerUnit).toFixed(2))
    };
    
    // Llamar a la función de agregar al carrito
    if (onAddToCart) {
      onAddToCart(cartItem);
      
      // Resetear el estado
      setWeight('');
      setCalculatedPrice(0);
      setIsAdding(false);
      
      // Intentar enfocar de nuevo el input para continuar agregando
      setTimeout(() => {
        if (weightInputRef.current) {
          weightInputRef.current.focus();
        }
      }, 100);
    }
  };
  
  // Agregar un producto completo (paquete/saco)
  const handleAddFullPackage = () => {
    if (!hasPackageWeight) return;
    
    setIsAdding(true);
    
    // Preparar el producto para el carrito
    const cartItem = {
      ...product,
      weightInfo: {
        value: product.packageWeight,
        unit: product.weightUnit,
        pricePerUnit
      },
      calculatedPrice: product.salePrice,
      isFullPackage: true
    };
    
    // Llamar a la función de agregar al carrito
    if (onAddToCart) {
      onAddToCart(cartItem);
      setIsAdding(false);
    }
  };
  
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{product.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center">
              <Scale size={14} className="mr-1" />
              Peso
            </span>
            <span className="text-gray-500 text-sm">
              Unidad: {product.weightUnit}
            </span>
          </div>
        </div>
        
        {hasPackageWeight && (
          <div className="ml-4 flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs">
            <Package size={14} className="mr-1" />
            {product.packageWeight} {product.weightUnit}
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="text-gray-700">
            <div className="font-medium">Precio por {product.weightUnit}</div>
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold">${pricePerUnit.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="text-gray-700">
            <div className="font-medium">En inventario</div>
            <div className={product.quantity <= product.minStock ? "text-red-600" : ""}>
              {product.quantity} {product.weightUnit}
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección para comprar por peso */}
      <div className="border-t pt-4 mt-2">
        <h4 className="font-medium text-gray-700 mb-2 flex items-center">
          <Scale size={16} className="mr-2 text-blue-500" />
          Comprar por peso
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Cantidad ({product.weightUnit})
            </label>
            <input
              type="text"
              placeholder={`Mínimo: ${minSellWeight}`}
              value={weight}
              onChange={handleWeightChange}
              ref={weightInputRef}
              className={`w-full p-2 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          </div>
          
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Precio Calculado
            </label>
            <div className="p-2 bg-gray-100 rounded-md border border-gray-300 font-medium">
              ${calculatedPrice.toFixed(2)}
            </div>
          </div>
        </div>
        
        <button
          onClick={handleAddToCart}
          disabled={!weight || isNaN(parseFloat(weight)) || parseFloat(weight) < minSellWeight || isAdding}
          className="mt-3 w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <ShoppingCart size={18} className="mr-2" />
          Agregar {weight && !isNaN(parseFloat(weight)) ? `${weight} ${product.weightUnit}` : 'al carrito'}
        </button>
      </div>
      
      {/* Sección para comprar paquete completo (si aplica) */}
      {hasPackageWeight && (
        <div className="border-t pt-4 mt-4">
          <h4 className="font-medium text-gray-700 mb-2 flex items-center">
            <Package size={16} className="mr-2 text-amber-500" />
            Comprar paquete completo
          </h4>
          
          <div className="p-3 bg-amber-50 rounded-md border border-amber-200 mb-3">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{product.packageWeight} {product.weightUnit}</span>
                <span className="text-gray-600 text-sm ml-1">por paquete</span>
              </div>
              <div className="font-bold text-lg">
                ${product.salePrice.toFixed(2)}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleAddFullPackage}
            disabled={isAdding}
            className="w-full py-2 px-4 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Package size={18} className="mr-2" />
            Agregar paquete completo
          </button>
        </div>
      )}
    </div>
  );
};

ProductWeightDisplay.propTypes = {
  product: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    weightUnit: PropTypes.string.isRequired,
    salePrice: PropTypes.number.isRequired,
    minWeight: PropTypes.number,
    packageWeight: PropTypes.number,
    pricePerUnit: PropTypes.number,
    quantity: PropTypes.number.isRequired,
    minStock: PropTypes.number.isRequired,
  }).isRequired,
  onAddToCart: PropTypes.func,
};

export default ProductWeightDisplay;
