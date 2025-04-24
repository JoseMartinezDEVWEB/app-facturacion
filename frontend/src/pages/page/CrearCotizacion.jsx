import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createQuote } from '../../services/quoteService';
import { getClients } from '../../services/clientService';
import { getProducts } from '../../services/productService';
import Swal from 'sweetalert2';

const CrearCotizacion = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [cotizacion, setCotizacion] = useState({
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 días
    items: [],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    discountAmount: 0,
    total: 0,
    notes: '',
    paymentTerms: '',
    deliveryTerms: '',
    additionalConditions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Cargar clientes
        const clientsData = await getClients();
        const loadedClients = clientsData.data || clientsData;
        setClients(loadedClients);
        setFilteredClients(loadedClients);
        
        // Cargar productos
        const productsData = await getProducts();
        // productsData may include { products: [], ... } or be array
        const loadedProducts = productsData.products || productsData.data || productsData;
        setProducts(loadedProducts);
        setFilteredProducts(loadedProducts);

        setLoading(false);
      } catch (error) {
        console.error('Error al cargar datos iniciales:', error);
        Swal.fire('Error', 'No se pudieron cargar los datos necesarios', 'error');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filtrar clientes basado en término de búsqueda
  useEffect(() => {
    if (clientSearchTerm.trim() === '') {
      setFilteredClients(clients);
    } else {
      const lower = clientSearchTerm.toLowerCase();
      setFilteredClients(
        clients.filter(client =>
          client.name.toLowerCase().includes(lower) ||
          client.identification?.toLowerCase().includes(lower) ||
          client.ruc?.toLowerCase().includes(lower)
        )
      );
    }
  }, [clientSearchTerm, clients]);

  // Filtrar productos basado en término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Función para calcular los totales
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const taxAmount = (subtotal - cotizacion.discountAmount) * (cotizacion.taxRate / 100);
    const total = subtotal - cotizacion.discountAmount + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  // Manejar cambio en campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'taxRate') {
      setCotizacion(prev => {
        const newState = { ...prev, [name]: parseFloat(value) || 0 };
        const { taxAmount, total } = calculateTotals(prev.items);
        return { ...newState, taxAmount, total };
      });
    } else if (name === 'discountAmount') {
      setCotizacion(prev => {
        const newState = { ...prev, [name]: parseFloat(value) || 0 };
        const { taxAmount, total } = calculateTotals(prev.items);
        return { ...newState, taxAmount, total };
      });
    } else {
      setCotizacion(prev => ({ ...prev, [name]: value }));
    }
  };

  // Agregar un producto a la cotización
  const handleAddProduct = () => {
    if (!selectedProduct) return;
    
    const product = products.find(p => p._id === selectedProduct);
    if (!product) return;
    
    const newItem = {
      product: product._id,
      productName: product.name,
      quantity: 1,
      price: parseFloat(product.salePrice) || 0,
      subtotal: parseFloat(product.salePrice) || 0
    };
    
    const newItems = [...cotizacion.items, newItem];
    const { subtotal, taxAmount, total } = calculateTotals(newItems);
    
    setCotizacion(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      taxAmount,
      total
    }));
    
    setSelectedProduct('');
    setSearchTerm('');
    // Volver el foco al campo de búsqueda
    document.getElementById('product-search').focus();
  };

  // Eliminar un producto de la cotización
  const handleRemoveProduct = (index) => {
    const newItems = cotizacion.items.filter((_, i) => i !== index);
    const { subtotal, taxAmount, total } = calculateTotals(newItems);
    
    setCotizacion(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      taxAmount,
      total
    }));
  };

  // Modificar cantidad o precio de un item
  const handleItemChange = (index, field, value) => {
    const newItems = [...cotizacion.items];
    newItems[index] = {
      ...newItems[index],
      [field]: parseFloat(value) || 0
    };
    
    // Actualizar subtotal del item
    newItems[index].subtotal = newItems[index].quantity * newItems[index].price;
    
    const { subtotal, taxAmount, total } = calculateTotals(newItems);
    
    setCotizacion(prev => ({
      ...prev,
      items: newItems,
      subtotal,
      taxAmount,
      total
    }));
  };

  // Agregar condición adicional
  const handleAddCondition = () => {
    setCotizacion(prev => ({
      ...prev,
      additionalConditions: [
        ...prev.additionalConditions,
        { title: '', description: '' }
      ]
    }));
  };

  // Modificar condición adicional
  const handleConditionChange = (index, field, value) => {
    const newConditions = [...cotizacion.additionalConditions];
    newConditions[index] = {
      ...newConditions[index],
      [field]: value
    };
    
    setCotizacion(prev => ({
      ...prev,
      additionalConditions: newConditions
    }));
  };

  // Eliminar condición adicional
  const handleRemoveCondition = (index) => {
    const newConditions = cotizacion.additionalConditions.filter((_, i) => i !== index);
    
    setCotizacion(prev => ({
      ...prev,
      additionalConditions: newConditions
    }));
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cotizacion.cliente) {
      Swal.fire('Error', 'Debe seleccionar un cliente', 'error');
      return;
    }
    
    if (cotizacion.items.length === 0) {
      Swal.fire('Error', 'Debe agregar al menos un producto', 'error');
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos para enviar
      const quoteData = {
        customer: cotizacion.cliente,
        date: cotizacion.fecha,
        validUntil: cotizacion.validUntil,
        items: cotizacion.items.map(item => ({
          product: item.product,
          quantity: item.quantity,
          price: item.price
        })),
        subtotal: cotizacion.subtotal,
        taxRate: cotizacion.taxRate,
        taxAmount: cotizacion.taxAmount,
        discountAmount: cotizacion.discountAmount,
        total: cotizacion.total,
        notes: cotizacion.notes,
        paymentTerms: cotizacion.paymentTerms,
        deliveryTerms: cotizacion.deliveryTerms,
        additionalConditions: cotizacion.additionalConditions
      };
      
      const result = await createQuote(quoteData);
      
      Swal.fire({
        icon: 'success',
        title: 'Cotización creada',
        text: `La cotización #${result.quoteNumber} ha sido creada exitosamente`,
        confirmButtonText: 'Ver cotización'
      }).then(() => {
        navigate(`/dashboard/cotizaciones/${result._id}`);
      });
    } catch (error) {
      console.error('Error al crear cotización:', error);
      Swal.fire('Error', 'No se pudo crear la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Agregar una función para manejar teclas en el campo de búsqueda
  // Función para manejar la tecla Enter en la búsqueda de productos
  const handleSearchKeyDown = (e) => {
    // Si presiona Enter y hay productos filtrados
    if (e.key === 'Enter' && filteredProducts.length > 0) {
      e.preventDefault();
      // Selecciona el primer producto de la lista
      if (filteredProducts.length > 0) {
        setSelectedProduct(filteredProducts[0]._id);
        // Espera un poco para que se actualice el estado
        setTimeout(() => {
          handleAddProduct();
        }, 50);
      }
    }
  };

  // Agregar código para el atajo de teclado global
  // Atajo de teclado global para el campo de búsqueda de productos
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt+P para ir al campo de búsqueda de productos
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nueva Cotización</h1>
        <button
          onClick={() => navigate('/dashboard/cotizaciones')}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Volver
        </button>
      </div>

      {loading ? (
        <div className="text-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6">
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block mb-2 font-medium">Cliente *</label>
              <input
                type="text"
                placeholder="Buscar cliente..."
                value={clientSearchTerm}
                onChange={e => setClientSearchTerm(e.target.value)}
                className="w-full border p-2 rounded mb-2"
              />
              <select
                name="cliente"
                value={cotizacion.cliente}
                onChange={e => { handleChange(e); setClientSearchTerm(''); }}
                className="w-full border p-2 rounded"
                required
              >
                <option value="">Seleccione un cliente</option>
                {filteredClients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name} - {client.identification || client.ruc || 'Sin documento'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2 font-medium">Fecha</label>
              <input
                type="date"
                name="fecha"
                value={cotizacion.fecha}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-2 font-medium">Válida hasta</label>
              <input
                type="date"
                name="validUntil"
                value={cotizacion.validUntil}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                required
              />
            </div>
          </div>

          {/* Agregar productos */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Productos</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <input
                  type="text"
                  id="product-search"
                  placeholder="Buscar producto... (Alt+P)"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full border p-2 rounded"
                />
              </div>
              <div>
                <select
                  value={selectedProduct}
                  onChange={e => setSelectedProduct(e.target.value)}
                  className="w-full border p-2 rounded"
                >
                  <option value="">Seleccione un producto</option>
                  {filteredProducts.map(product => (
                    <option key={product._id} value={product._id}>
                      {product.name} - ${parseFloat(product.salePrice) ? parseFloat(product.salePrice).toFixed(2) : '0.00'}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Agregar Producto
                </button>
              </div>
            </div>

            {/* Tabla de productos seleccionados */}
            {cotizacion.items.length === 0 ? (
              <div className="text-center p-6 bg-gray-50 rounded border">
                No hay productos seleccionados
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Precio</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cotizacion.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                          {item.productName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                            className="w-20 text-center border rounded p-1"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={item.price}
                            onChange={e => handleItemChange(index, 'price', e.target.value)}
                            className="w-24 text-center border rounded p-1"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${(item.quantity * item.price).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveProduct(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Totales */}
          <div className="mb-6">
            <div className="flex justify-end">
              <div className="w-full max-w-xs">
                <div className="flex justify-between mb-2">
                  <label className="font-medium">Subtotal:</label>
                  <span>${cotizacion.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium">Descuento:</label>
                  <input
                    type="number"
                    name="discountAmount"
                    min="0"
                    step="0.01"
                    value={cotizacion.discountAmount}
                    onChange={handleChange}
                    className="w-24 text-right border rounded p-1"
                  />
                </div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium">IVA (%):</label>
                  <input
                    type="number"
                    name="taxRate"
                    min="0"
                    step="0.01"
                    value={cotizacion.taxRate}
                    onChange={handleChange}
                    className="w-24 text-right border rounded p-1"
                  />
                </div>
                <div className="flex justify-between mb-2">
                  <label className="font-medium">Monto IVA:</label>
                  <span>${cotizacion.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t pt-2">
                  <label>Total:</label>
                  <span>${cotizacion.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Términos y condiciones */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-4">Términos y Condiciones</h2>
            
            <div className="mb-4">
              <label className="block mb-2 font-medium">Notas</label>
              <textarea
                name="notes"
                value={cotizacion.notes}
                onChange={handleChange}
                className="w-full border p-2 rounded h-20"
                placeholder="Notas o comentarios adicionales"
              ></textarea>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 font-medium">Términos de Pago</label>
                <textarea
                  name="paymentTerms"
                  value={cotizacion.paymentTerms}
                  onChange={handleChange}
                  className="w-full border p-2 rounded h-20"
                  placeholder="Ej: 50% de anticipo, 50% contra entrega"
                ></textarea>
              </div>
              <div>
                <label className="block mb-2 font-medium">Términos de Entrega</label>
                <textarea
                  name="deliveryTerms"
                  value={cotizacion.deliveryTerms}
                  onChange={handleChange}
                  className="w-full border p-2 rounded h-20"
                  placeholder="Ej: Entrega en 5 días hábiles"
                ></textarea>
              </div>
            </div>
            
            {/* Condiciones adicionales */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="font-medium">Condiciones Adicionales</label>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Agregar Condición
                </button>
              </div>
              
              {cotizacion.additionalConditions.length === 0 ? (
                <div className="text-center p-4 bg-gray-50 rounded border">
                  No hay condiciones adicionales
                </div>
              ) : (
                cotizacion.additionalConditions.map((condition, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-8 gap-2 mb-2 items-start">
                    <div className="md:col-span-2">
                      <input
                        type="text"
                        value={condition.title}
                        onChange={e => handleConditionChange(index, 'title', e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="Título"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <textarea
                        value={condition.description}
                        onChange={e => handleConditionChange(index, 'description', e.target.value)}
                        className="w-full border p-2 rounded"
                        placeholder="Descripción"
                      ></textarea>
                    </div>
                    <div className="md:col-span-1 flex justify-center items-center h-full">
                      <button
                        type="button"
                        onClick={() => handleRemoveCondition(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/dashboard/cotizaciones')}
              className="bg-gray-500 text-white px-4 py-2 mr-2 rounded hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? 'Guardando...' : 'Guardar Cotización'}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};

export default CrearCotizacion; 