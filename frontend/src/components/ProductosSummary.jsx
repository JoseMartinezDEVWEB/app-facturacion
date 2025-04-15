/* eslint-disable react/prop-types */
import { useMemo } from 'react';
import { motion } from 'framer-motion';

const ProductosSummary = ({ products }) => {
  // Calcular estadísticas usando useMemo para evitar recálculos innecesarios
  const stats = useMemo(() => {
    // Valor por defecto si no hay productos
    if (!Array.isArray(products) || products.length === 0) {
      return {
        totalProducts: 0,
        totalValue: 0,
        totalItems: 0,
        lowStockCount: 0
      };
    }

    // Calcular estadísticas
    return products.reduce((acc, product) => {
      // Contar producto
      acc.totalProducts += 1;
      
      // Sumar el valor de inventario (precio de compra * cantidad)
      const purchasePrice = parseFloat(product.purchasePrice || 0);
      const quantity = parseInt(product.quantity || 0);
      acc.totalValue += purchasePrice * quantity;
      
      // Contar unidades totales
      acc.totalItems += quantity;
      
      // Contar productos con stock bajo
      if (quantity <= (product.minStock || 0)) {
        acc.lowStockCount += 1;
      }
      
      return acc;
    }, {
      totalProducts: 0,
      totalValue: 0,
      totalItems: 0,
      lowStockCount: 0
    });
  }, [products]);
  
  // Formateador de moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <motion.div 
      className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row justify-between gap-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex-1 border-r pr-4">
        <h3 className="text-lg font-semibold text-gray-700">Inventario Total</h3>
        <div className="flex items-baseline mt-2">
          <span className="text-3xl font-bold text-blue-600">{stats.totalProducts}</span>
          <span className="ml-2 text-gray-500">productos diferentes</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {stats.totalItems} unidades en total
        </div>
      </div>
      
      <div className="flex-1 border-r px-4">
        <h3 className="text-lg font-semibold text-gray-700">Valor del Inventario</h3>
        <div className="flex items-baseline mt-2">
          <span className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalValue)}</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Basado en precios de compra
        </div>
      </div>
      
      <div className="flex-1 pl-4">
        <h3 className="text-lg font-semibold text-gray-700">Estado del Stock</h3>
        <div className="flex items-baseline mt-2">
          <span className={`text-3xl font-bold ${stats.lowStockCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {stats.lowStockCount}
          </span>
          <span className="ml-2 text-gray-500">productos con stock bajo</span>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {Math.round((stats.lowStockCount / Math.max(stats.totalProducts, 1)) * 100)}% del inventario
        </div>
      </div>
    </motion.div>
  );
};

export default ProductosSummary;