
/* eslint-disable react/prop-types */

import { motion, AnimatePresence } from 'framer-motion';
import Pagination from './Pagination';

// Variantes para animaciones
const tableVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { type: "spring", stiffness: 100 }
  },
  exit: { 
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
};

export const ProductTable = ({ 
  products = [], 
  onEdit, 
  onDelete,
  currentPage,
  pageSize,
  onPageChange
}) => {
  // Validación de datos antes de renderizar
  const validProducts = Array.isArray(products) ? products : [];
  
  // Calcular productos para la página actual
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = validProducts.slice(startIndex, startIndex + pageSize);
  const totalProducts = validProducts.length;
  
  // Si no hay productos, mostrar mensaje
  if (validProducts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-200"
      >
        <svg 
          className="mx-auto h-12 w-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
          />
        </svg>
        <p className="mt-2 text-lg">No hay productos disponibles</p>
        <p className="text-sm">Intenta crear un nuevo producto o cambiar los filtros</p>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        layout
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={tableVariants}
        className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm"
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Precio Venta
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <AnimatePresence>
              {paginatedProducts.map((product) => (
                <motion.tr
                  key={product._id || product.id || `product-${Math.random()}`}
                  variants={rowVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                    {product.barcode && (
                      <div className="text-sm text-gray-500">
                        {product.barcode}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {product.category?.name || 'Sin categoría'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`text-sm ${
                        (product.quantity <= product.minStock) ? 'text-red-600 font-medium' : 'text-gray-900'
                      }`}>
                        {product.quantity} {product.unitType || 'unidad'}
                      </span>
                      {(product.quantity <= product.minStock) && (
                        <motion.span
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-2 text-red-600"
                        >
                          ⚠️
                        </motion.span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      ${(product.salePrice || 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Compra: ${(product.purchasePrice || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onEdit(product)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Editar
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onDelete(product)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        
        {/* Info de paginación */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
          Mostrando {Math.min(startIndex + 1, totalProducts)} a {Math.min(startIndex + pageSize, totalProducts)} de {totalProducts} productos
        </div>
      </motion.div>
      
      {/* Controles de paginación */}
      <Pagination 
        currentPage={currentPage}
        totalItems={totalProducts}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </>
  );
};

export default ProductTable;