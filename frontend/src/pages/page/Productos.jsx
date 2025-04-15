/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { productApi, categoryApi } from '../../config/apis';
import ProductForm from '../../components/ProductForm';
import { ProductTable } from '../../components/ProductoTable';
import ProductosSummary from '../../components/ProductosSummary';

const Productos = () => {
  // Estado principal
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  
  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Mostrar 10 productos por página
  
  // Estado de notificaciones
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  // Mostrar notificación con auto-cierre
  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false }), 3000);
  }, []);

  // Filtrar productos - usando useMemo para optimizar
  const filteredProducts = useMemo(() => {
    const filtered = products.filter(product => {
      const matchesSearch = !searchTerm || 
        (product.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = !selectedCategory || 
        product.category?._id === selectedCategory || 
        product.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
    
    // Resetear a la primera página cuando cambian los filtros
    if (currentPage !== 1 && filtered.length <= pageSize) {
      setCurrentPage(1);
    }
    
    return filtered;
  }, [products, searchTerm, selectedCategory, pageSize, currentPage]);

  // Manejar cambio de página
  const handlePageChange = (newPage) => {
    // Asegurarse de que la página está dentro de los límites válidos
    const maxPage = Math.ceil(filteredProducts.length / pageSize);
    const validPage = Math.max(1, Math.min(newPage, maxPage));
    
    setCurrentPage(validPage);
    
    // Opcional: hacer scroll hacia arriba de la tabla
    window.scrollTo({
      top: document.getElementById('products-table-top')?.offsetTop || 0,
      behavior: 'smooth'
    });
  };

  // Manejar cambio de elementos por página
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1); // Volver a la primera página al cambiar el tamaño
  };

  // Cargar datos - usando useCallback para optimizar
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Modificar la llamada API para obtener todos los productos
      // Si tu API soporta paginación en el servidor, podrías usarla aquí
      const [productsRes, categoriesRes] = await Promise.all([
        productApi.getAll(),
        categoryApi.getAll()
      ]);
  
      console.log('Products Response:', productsRes.data);
      
      // Normalizar datos para asegurar que siempre sean arrays
      const productsData = Array.isArray(productsRes.data) 
        ? productsRes.data 
        : Array.isArray(productsRes.data.products) 
          ? productsRes.data.products 
          : [];
          
      const categoriesData = Array.isArray(categoriesRes.data) 
        ? categoriesRes.data 
        : [];
  
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Resetear a la primera página cuando se cargan nuevos datos
      setCurrentPage(1);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      setProducts([]);
      setCategories([]);
      showNotification('Error al cargar datos', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handlers para acciones de productos
  const handleCreate = () => {
    setSelectedProduct(null);
    setModalOpen(true);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
  };

  const handleDelete = async (product) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      try {
        await productApi.delete(product._id);
        showNotification('Producto eliminado exitosamente');
        fetchData();
      } catch (error) {
        console.error('Error al eliminar producto:', error);
        showNotification('Error al eliminar el producto', 'error');
      }
    }
  };

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Formatear datos para asegurarnos que los números son números
      const formattedData = {
        ...data,
        purchasePrice: parseFloat(data.purchasePrice),
        salePrice: parseFloat(data.salePrice),
        quantity: parseFloat(data.quantity),
        minStock: parseFloat(data.minStock)
      };
      
      // Si es un producto por peso, asegurarse de enviar los campos específicos
      if (data.unitType === 'peso') {
        formattedData.weightUnit = data.weightUnit;
        formattedData.minWeight = parseFloat(data.minWeight);
        
        // Si tiene packageWeight (caso del saco de arroz)
        if (data.packageWeight) {
          formattedData.packageWeight = parseFloat(data.packageWeight);
          // También guardar el precio por unidad (precio por libra)
          if (data.pricePerUnit) {
            formattedData.pricePerUnit = parseFloat(data.pricePerUnit);
          } else if (data.salePrice && data.packageWeight) {
            // Calcular el precio por unidad si no se proporcionó directamente
            formattedData.pricePerUnit = parseFloat(
              (data.salePrice / data.packageWeight).toFixed(2)
            );
          }
        }
      }
      
      // Eliminar campos indefinidos o con valores vacíos
      Object.keys(formattedData).forEach(key => {
        if (
          formattedData[key] === undefined || 
          formattedData[key] === null || 
          formattedData[key] === ''
        ) {
          delete formattedData[key];
        }
      });
      
      console.log('Enviando datos:', formattedData);
      
      let response;
      if (selectedProduct) {
        response = await productApi.update(selectedProduct._id, formattedData);
        showNotification('Producto actualizado exitosamente');
      } else {
        response = await productApi.create(formattedData);
        showNotification('Producto creado exitosamente');
      }
      
      console.log('Respuesta del servidor:', response);
      setModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error al procesar operación:', error);
      
      // Mostrar mensaje de error más detallado
      let errorMessage = 'Error al procesar la operación';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Productos</h1>
        <motion.button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Crear Producto
        </motion.button>
      </div>

      {/* Resumen de productos */}
      <div className="mb-6">
        <ProductosSummary products={products} />
      </div>

      {/* Filtros y controles */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Volver a la primera página al buscar
            }}
            className="p-2 pl-10 border rounded-md w-full"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1); // Volver a la primera página al filtrar
          }}
          className="p-2 border rounded-md"
        >
          <option value="">Todas las categorías</option>
          {categories.map(category => (
            <option key={category._id} value={category._id}>
              {category.name}
            </option>
          ))}
        </select>
        
        {/* Selector de cantidad por página */}
        <select
          value={pageSize}
          onChange={handlePageSizeChange}
          className="p-2 border rounded-md"
        >
          <option value="5">5 por página</option>
          <option value="10">10 por página</option>
          <option value="20">20 por página</option>
          <option value="50">50 por página</option>
          <option value="100">100 por página</option>
        </select>
      </div>

      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-md shadow-lg z-50 ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ancla para scroll automático */}
      <div id="products-table-top"></div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <ProductTable
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
        />
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-lg"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedProduct ? 'Editar Producto' : 'Crear Producto'}
                </h2>
                <ProductForm
                  onSubmit={handleSubmit}
                  initialData={selectedProduct}
                  categories={categories}
                  onClose={() => setModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Productos;