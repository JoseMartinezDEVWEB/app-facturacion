/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Minus, Plus, Trash2, Scale, User, Search, X, UserPlus } from 'lucide-react';
import PropTypes from 'prop-types';
import { clienteApi } from '../../config/apis';

// Componente para buscar clientes con props para searchTerm y setSearchTerm
const ClienteSearch = ({ onSelect, onCreateNew, searchTerm, setSearchTerm }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const searchClientes = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setResults([]);
        return;
      }
    
      setLoading(true);
      try {
        // Usamos try-catch para capturar errores incluso en la búsqueda
        console.log('Buscando clientes con término:', searchTerm);
        
        // Opción 1: Usar el método search de clienteApi
        const response = await clienteApi.search(searchTerm);
        console.log('Respuesta de búsqueda:', response);
        
        // Si response.clientes no existe, ajustamos para usar el formato correcto
        const clientesEncontrados = response.clientes || response.data || response || [];
        setResults(Array.isArray(clientesEncontrados) ? clientesEncontrados : []);
        
      } catch (error) {
        console.error('Error al buscar clientes:', error);
        
        // Usar un enfoque alternativo si el endpoint search no existe
        try {
          console.log('Intentando búsqueda alternativa...');
          // Opción 2: Intentar obtener todos los clientes y filtrar en el frontend
          const allClientes = await clienteApi.getAll();
          console.log('Todos los clientes:', allClientes);
          
          // Obtenemos el array de clientes sea cual sea la estructura de respuesta
          const clientesList = allClientes.clientes || allClientes.data || allClientes || [];
          
          // Filtramos los clientes por el término de búsqueda
          const filtered = clientesList.filter(cliente => 
            cliente.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cliente.phone?.includes(searchTerm) ||
            cliente.rncCedula?.includes(searchTerm) ||
            cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
          );
          
          setResults(filtered);
        } catch (secondError) {
          console.error('Error en búsqueda alternativa:', secondError);
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    };

    // Usar debounce para evitar demasiadas peticiones
    const timeoutId = setTimeout(searchClientes, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return (
    <div className="mt-2">
      <div className="relative">
        <div className="flex items-center border rounded">
          <Search size={16} className="ml-2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 pl-2 outline-none"
            placeholder="Buscar cliente por nombre, teléfono o RNC/cédula..."
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="p-1 mr-1 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Resultados de búsqueda */}
        {searchTerm.length >= 2 && (
          <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-center text-gray-500">Buscando...</div>
            ) : results.length > 0 ? (
              <ul>
                {results.map(cliente => (
                  <li 
                    key={cliente._id} 
                    className="p-2 hover:bg-gray-100 cursor-pointer border-b"
                    onClick={() => {
                      onSelect(cliente);
                      setSearchTerm('');
                    }}
                  >
                    <div className="font-medium">{cliente.name}</div>
                    <div className="text-xs text-gray-500">
                      {cliente.phone} {cliente.rncCedula ? `• ${cliente.rncCedula}` : ''}
                    </div>
                    {cliente.credito > 0 && (
                      <div className="text-xs mt-1">
                        <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          Crédito disponible: RD$ {cliente.credito.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-3">
                <p className="text-gray-500 text-sm">No se encontraron clientes</p>
                <button 
                  onClick={onCreateNew}
                  className="mt-2 w-full p-1.5 bg-blue-50 text-blue-600 rounded border border-blue-200 flex items-center justify-center gap-1 text-sm"
                >
                  <UserPlus size={14} />
                  <span>Registrar nuevo cliente</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Modal para crear nuevo cliente
const NuevoClienteModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    rncCedula: '',
    address: { street: '', city: '' }
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Enviando datos para crear cliente:', formData);
      const response = await clienteApi.create(formData);
      console.log('Respuesta al crear cliente:', response);
      
      // Encontrar el cliente en la respuesta
      const clienteCreado = response.cliente || response.data || response;
      
      if (clienteCreado && (clienteCreado._id || clienteCreado.id)) {
        console.log('Cliente creado exitosamente:', clienteCreado);
        onSave(clienteCreado);
        onClose();
      } else {
        console.error('Respuesta sin datos de cliente:', response);
        setError('La respuesta del servidor no contiene datos del cliente');
        
        // Aún así, si recibimos código 200/201, asumimos éxito
        if (response.success || response.status === 'success') {
          setTimeout(() => onClose(), 1500);
        }
      }
    } catch (error) {
      console.error('Error al crear cliente:', error);
      
      // Si recibimos código 201 Created pero hay error de parsing
      if (error.response?.status === 201 || error.response?.status === 200) {
        const clienteInfo = error.response.data;
        console.log('Cliente posiblemente creado a pesar del error:', clienteInfo);
        
        // Intentamos extraer datos del cliente
        if (clienteInfo && (typeof clienteInfo === 'object')) {
          onSave(clienteInfo.cliente || clienteInfo);
          onClose();
          return;
        }
      }
      
      setError(error.response?.data?.message || 'Error al registrar cliente. Compruebe si se creó correctamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-semibold">Registrar Nuevo Cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mx-4 mt-4 p-2 bg-red-50 text-red-600 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono *</label>
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">RNC/Cédula</label>
              <input
                type="text"
                name="rncCedula"
                value={formData.rncCedula}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Dirección</label>
              <input
                type="text"
                name="address.street"
                placeholder="Calle, número, sector"
                value={formData.address.street}
                onChange={handleChange}
                className="w-full p-2 border rounded mb-2"
              />
              <input
                type="text"
                name="address.city"
                placeholder="Ciudad"
                value={formData.address.city}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            >
              {loading ? 'Guardando...' : 'Guardar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CarritoCompra = ({ 
  cart,
  updateQuantity,
  removeFromCart,
  applyTax,
  setApplyTax,
  paymentMethod,
  setPaymentMethod,
  cashReceived,
  setCashReceived,
  paymentDetails,
  setPaymentDetails,
  loading,
  processPayment
}) => {
  const [totals, setTotals] = useState({
    subtotal: 0,
    tax: 0,
    total: 0,
    change: 0
  });
  
  // Nuevos estados para la compra fiada
  const [isCredit, setIsCredit] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  // Añadido estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  // Efecto para limpiar estado cuando el carrito está vacío
  useEffect(() => {
    if (cart.length === 0 && selectedClient) {
      setSelectedClient(null);
      setIsCredit(false);
      setSearchTerm('');
    }
  }, [cart.length, selectedClient]);

  // Calcular totales cuando cambie el carrito o el impuesto
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => {
      if (item.weightInfo) {
        // Precio para productos por peso
        return sum + (item.weightInfo.value * item.weightInfo.pricePerUnit);
      } else {
        // Precio para productos normales
        const price = parseFloat(item.salePrice) || 0;
        return sum + (price * item.quantity);
      }
    }, 0);
    
    const tax = applyTax ? subtotal * 0.18 : 0; // ITBIS 18%
    const total = subtotal + tax;
    const change = cashReceived ? parseFloat(cashReceived) - total : 0;

    setTotals({ subtotal, tax, total, change });
  }, [cart, applyTax, cashReceived]);

  const handleDeleteItem = (productId) => {
    removeFromCart(productId);
  };

  const handlePaymentDetailsChange = (e) => {
    const { name, value } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Manejadores para la compra fiada
  const handleCreditToggle = (e) => {
    setIsCredit(e.target.checked);
    
    // Si se desmarca, limpiar el cliente seleccionado
    if (!e.target.checked) {
      setSelectedClient(null);
      setSearchTerm('');
    }
    
    // Si está marcado, cambiar método de pago a "credit"
    if (e.target.checked) {
      setPaymentMethod('credit');
    } else {
      // Volver a efectivo por defecto
      setPaymentMethod('cash');
    }
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    
    // Actualizar detalles de pago con la información del cliente
    setPaymentDetails(prev => ({
      ...prev,
      clientId: client._id,
      clientName: client.name
    }));
  };

  const handleProcessPayment = () => {
    // Validar que haya un cliente seleccionado si es compra fiada
    if (isCredit && !selectedClient) {
      alert('Debe seleccionar un cliente para procesar una compra fiada');
      return;
    }
    
    // Llamar a la función original de procesar pago
    processPayment();
  };

  return (
    <div className="border rounded p-4">
      <h2 className="text-xl font-bold mb-4">Carrito de Compra</h2>
      
      {cart.length === 0 ? (
        <div className="py-8 text-center text-gray-500">
          El carrito está vacío
        </div>
      ) : (
        <AnimatePresence>
          {cart.map((item) => (
            <motion.div
              key={item._id + (item.weightInfo ? `-${item.weightInfo.value}` : '')}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between p-2 border-b"
            >
              <div className="flex-grow">
                <h3 className="font-semibold">
                  {item.name}
                  {item.weightInfo && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded">
                      Por peso
                    </span>
                  )}
                  {item.weightInfo?.isFullPackage && (
                    <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1 py-0.5 rounded">
                      Paquete completo
                    </span>
                  )}
                </h3>
                {item.weightInfo ? (
                  <p className="text-sm text-gray-600">
                    {item.weightInfo.value} {item.weightInfo.unit} × ${item.weightInfo.pricePerUnit.toFixed(2)} por {item.weightInfo.unit}
                  </p>
                ) : (
                  <p className="text-sm text-gray-600">
                    ${parseFloat(item.salePrice || 0).toFixed(2)} c/u
                  </p>
                )}
              </div>
              
              {!item.weightInfo ? (
                // Solo mostrar controles de cantidad para productos normales (no por peso)
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ) : (
                // Para productos por peso, simplemente mostrar el peso
                <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-sm">
                  <Scale size={14} className="text-blue-500" />
                  <span>{item.weightInfo.value} {item.weightInfo.unit}</span>
                </div>
              )}
              
              <p className="font-semibold mx-4">
                {item.weightInfo 
                  ? `$${(item.weightInfo.value * item.weightInfo.pricePerUnit).toFixed(2)}`
                  : `$${(parseFloat(item.salePrice || 0) * item.quantity).toFixed(2)}`
                }
              </p>
              <button
                className="p-1 rounded-full text-red-500 hover:bg-red-50"
                onClick={() => handleDeleteItem(item._id)}
                title="Eliminar producto"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* Sección de totales y método de pago */}
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${totals.subtotal.toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={applyTax}
              onChange={(e) => setApplyTax(e.target.checked)}
              className="form-checkbox"
            />
            <span>Aplicar ITBIS (18%)</span>
          </label>
          <span>${totals.tax.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span>${totals.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Opción de compra fiada */}
      <div className="mt-4 border-t pt-4">
        <label className="flex items-center gap-2 font-medium">
          <input
            type="checkbox"
            checked={isCredit}
            onChange={handleCreditToggle}
            className="form-checkbox"
          />
          <span className="flex items-center gap-1">
            <User size={16} />
            Compra Fiada (A Crédito)
          </span>
        </label>
        
        {isCredit && (
          <div className="mt-3 p-3 border rounded bg-gray-50">
            {selectedClient ? (
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">{selectedClient.name}</div>
                  <div className="text-sm text-gray-600">{selectedClient.phone}</div>
                  {selectedClient.credito > 0 && (
                    <div className="text-xs mt-1">
                      <span className="bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                        Crédito disponible: RD$ {selectedClient.credito.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => setSelectedClient(null)} 
                  className="p-1 text-gray-500 hover:text-gray-700"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <ClienteSearch 
                onSelect={handleClientSelect} 
                onCreateNew={() => setShowNewClientModal(true)}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
              />
            )}
          </div>
        )}
      </div>

      {/* Sección de método de pago */}
      {!isCredit && (
        <div className="mt-4 space-y-4">
          <h3 className="font-semibold">Método de Pago</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              className={`p-2 border rounded flex items-center justify-center gap-2 ${
                paymentMethod === 'cash' ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setPaymentMethod('cash')}
            >
              <span>Efectivo</span>
            </button>
            <button
              className={`p-2 border rounded flex items-center justify-center gap-2 ${
                paymentMethod === 'card' ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setPaymentMethod('card')}
            >
              <span>Tarjeta</span>
            </button>
            <button
              className={`p-2 border rounded flex items-center justify-center gap-2 ${
                paymentMethod === 'transfer' ? 'bg-blue-50 border-blue-500' : ''
              }`}
              onClick={() => setPaymentMethod('transfer')}
            >
              <span>Transferencia</span>
            </button>
          </div>

          {paymentMethod === 'cash' && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">
                Monto Recibido
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
              />
              {parseFloat(cashReceived) >= totals.total && (
                <p className="mt-2">
                  Cambio a devolver: ${totals.change.toFixed(2)}
                </p>
              )}
            </div>
          )}

          {(paymentMethod === 'card' || paymentMethod === 'transfer') && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  {paymentMethod === 'card' ? 'Número de Tarjeta' : 'Número de Referencia'}
                </label>
                <input
                  type="text"
                  name="cardNumber"
                  className="w-full p-2 border rounded"
                  value={paymentDetails.cardNumber}
                  onChange={handlePaymentDetailsChange}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <button
        className={`w-full p-3 text-white rounded font-semibold mt-4 ${
          cart.length === 0 || loading || (isCredit && !selectedClient)
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        onClick={handleProcessPayment}
        disabled={cart.length === 0 || loading || (isCredit && !selectedClient)}
      >
        {loading ? 'Procesando...' : isCredit ? 'Procesar Compra Fiada' : 'Procesar Pago'}
      </button>

      {/* Modal para registrar nuevo cliente */}
      <NuevoClienteModal
        isOpen={showNewClientModal}
        onClose={() => setShowNewClientModal(false)}
        onSave={handleClientSelect}
      />
    </div>
  );
};

CarritoCompra.propTypes = {
  cart: PropTypes.array.isRequired,
  updateQuantity: PropTypes.func.isRequired,
  removeFromCart: PropTypes.func.isRequired,
  applyTax: PropTypes.bool.isRequired,
  setApplyTax: PropTypes.func.isRequired,
  paymentMethod: PropTypes.string.isRequired,
  setPaymentMethod: PropTypes.func.isRequired,
  cashReceived: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  setCashReceived: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  processPayment: PropTypes.func.isRequired,
  paymentDetails: PropTypes.object.isRequired,
  setPaymentDetails: PropTypes.func.isRequired
};

export default CarritoCompra;