import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvoices } from '../../services/invoiceService';
import { motion } from 'framer-motion';

const Facturas = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('todos');
  const [invoicesByPaymentMethod, setInvoicesByPaymentMethod] = useState({
    todos: [],
    efectivo: [],
    tarjeta: [],
    transferencia: [],
    pendiente: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Paginación independiente para cada tipo
  const [pagination, setPagination] = useState({
    todos: { currentPage: 1, totalPages: 1 },
    efectivo: { currentPage: 1, totalPages: 1 },
    tarjeta: { currentPage: 1, totalPages: 1 },
    transferencia: { currentPage: 1, totalPages: 1 },
    pendiente: { currentPage: 1, totalPages: 1 }
  });
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    customer: '',
    startDate: '',
    endDate: '',
    status: '',
    paymentStatus: '',
    isFiscal: '',
    minTotal: '',
    maxTotal: ''
  });

  useEffect(() => {
    fetchInvoicesByPaymentMethod();
  }, [
    pagination.todos.currentPage,
    pagination.efectivo.currentPage,
    pagination.tarjeta.currentPage,
    pagination.transferencia.currentPage,
    pagination.pendiente.currentPage
  ]);

  const fetchInvoicesByPaymentMethod = async () => {
    try {
      setLoading(true);
      
      // Obtener todas las facturas (con filtros aplicados)
      const todosResponse = await getInvoices({
        ...filters,
        page: pagination.todos.currentPage,
        limit: 10
      });
      
      // Obtener facturas pagadas en efectivo
      const efectivoResponse = await getInvoices({
        ...filters,
        paymentMethod: 'cash',
        page: pagination.efectivo.currentPage,
        limit: 10
      });
      
      // Obtener facturas pagadas con tarjeta
      const tarjetaResponse = await getInvoices({
        ...filters,
        paymentMethod: 'credit_card',
        page: pagination.tarjeta.currentPage,
        limit: 10
      });
      
      // Obtener facturas pagadas con transferencia
      const transferenciaResponse = await getInvoices({
        ...filters,
        paymentMethod: 'bank_transfer',
        page: pagination.transferencia.currentPage,
        limit: 10
      });
      
      // Obtener facturas pendientes (crédito)
      const pendienteResponse = await getInvoices({
        ...filters,
        paymentMethod: 'credit',
        creditStatus: 'pending',
        page: pagination.pendiente.currentPage,
        limit: 10
      });
      
      setInvoicesByPaymentMethod({
        todos: todosResponse.data || [],
        efectivo: efectivoResponse.data || [],
        tarjeta: tarjetaResponse.data || [],
        transferencia: transferenciaResponse.data || [],
        pendiente: pendienteResponse.data || []
      });
      
      setPagination({
        todos: {
          ...pagination.todos,
          totalPages: todosResponse.totalPages || 1
        },
        efectivo: { 
          ...pagination.efectivo, 
          totalPages: efectivoResponse.totalPages || 1 
        },
        tarjeta: { 
          ...pagination.tarjeta, 
          totalPages: tarjetaResponse.totalPages || 1 
        },
        transferencia: { 
          ...pagination.transferencia, 
          totalPages: transferenciaResponse.totalPages || 1 
        },
        pendiente: { 
          ...pagination.pendiente, 
          totalPages: pendienteResponse.totalPages || 1 
        }
      });
      
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar las facturas');
      console.error('Error al cargar facturas:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setPagination({
      todos: { ...pagination.todos, currentPage: 1 },
      efectivo: { ...pagination.efectivo, currentPage: 1 },
      tarjeta: { ...pagination.tarjeta, currentPage: 1 },
      transferencia: { ...pagination.transferencia, currentPage: 1 },
      pendiente: { ...pagination.pendiente, currentPage: 1 }
    });
    fetchInvoicesByPaymentMethod();
  };

  const handleClearFilters = () => {
    setFilters({
      customer: '',
      startDate: '',
      endDate: '',
      status: '',
      paymentStatus: '',
      isFiscal: '',
      minTotal: '',
      maxTotal: ''
    });
    setPagination({
      todos: { ...pagination.todos, currentPage: 1 },
      efectivo: { ...pagination.efectivo, currentPage: 1 },
      tarjeta: { ...pagination.tarjeta, currentPage: 1 },
      transferencia: { ...pagination.transferencia, currentPage: 1 },
      pendiente: { ...pagination.pendiente, currentPage: 1 }
    });
    fetchInvoicesByPaymentMethod();
  };

  const handlePageChange = (type, newPage) => {
    setPagination(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        currentPage: newPage
      }
    }));
  };

  const handleViewInvoice = (id) => {
    console.log('Navegando a la factura con ID:', id);
    navigate(`/dashboard/facturas/${id}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-yellow-100 text-yellow-800';
      case 'partially_refunded': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodTranslation = (method) => {
    const methodTranslations = {
      'cash': 'Efectivo',
      'credit_card': 'Tarjeta',
      'bank_transfer': 'Transferencia',
      'credit': 'Crédito',
      'check': 'Cheque',
      'other': 'Otro'
    };
    return methodTranslations[method] || method;
  };

  const getStatusTranslation = (status) => {
    const statusTranslations = {
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'pending': 'Pendiente',
      'draft': 'Borrador',
      'refunded': 'Reembolsada',
      'partially_refunded': 'Reembolso Parcial'
    };
    return statusTranslations[status] || status;
  };

  const renderInvoiceTable = (invoices, paginationType) => {
    if (invoices.length === 0) {
      return (
        <div className="bg-white shadow-md rounded-lg p-4 text-center">
          No se encontraron facturas
        </div>
      );
    }

    // Función para obtener el estado de pago
    const getPaymentStatus = (invoice) => {
      if (invoice.paymentMethod === 'credit') {
        return invoice.creditStatus || 'pending';
      }
      // Para pagos que no son a crédito, asumimos que están pagados
      return 'paid';
    };

    // Función para traducir los estados de pago
    const getPaymentStatusTranslation = (status) => {
      const paymentStatusTranslations = {
        'paid': 'Pagada',
        'partial': 'Pago Parcial',
        'pending': 'Pendiente',
        'overdue': 'Vencida'
      };
      return paymentStatusTranslations[status] || status;
    };

    // Función para obtener la clase de badge para estado de pago
    const getPaymentStatusBadgeClass = (status) => {
      switch (status) {
        case 'paid': return 'bg-green-100 text-green-800';
        case 'partial': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-yellow-100 text-yellow-800';
        case 'overdue': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };

    return (
      <>
        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                  <th className="py-3 px-6 text-left">Nº Factura</th>
                  <th className="py-3 px-6 text-left">Cliente</th>
                  <th className="py-3 px-6 text-left">Fecha</th>
                  <th className="py-3 px-6 text-right">Total</th>
                  <th className="py-3 px-6 text-center">Estado</th>
                  <th className="py-3 px-6 text-center">Pago</th>
                  <th className="py-3 px-6 text-center">Método</th>
                  <th className="py-3 px-6 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {invoices.map((invoice) => (
                  <tr key={invoice._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6 text-left font-medium">
                      {invoice.receiptNumber}
                    </td>
                    <td className="py-3 px-6 text-left">{invoice.customer.name}</td>
                    <td className="py-3 px-6 text-left">
                      {new Date(invoice.createdAt || invoice.dateTime).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-6 text-right font-medium">
                      ${invoice.total.toFixed(2)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                        {getStatusTranslation(invoice.status)}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusBadgeClass(getPaymentStatus(invoice))}`}>
                        {getPaymentStatusTranslation(getPaymentStatus(invoice))}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-center">
                      {getPaymentMethodTranslation(invoice.paymentMethod)}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <button
                        onClick={() => handleViewInvoice(invoice._id)}
                        className="text-blue-500 hover:text-blue-700 mr-2"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        {pagination[paginationType].totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <nav className="flex space-x-2">
              <button
                onClick={() => handlePageChange(
                  paginationType, 
                  Math.max(pagination[paginationType].currentPage - 1, 1)
                )}
                disabled={pagination[paginationType].currentPage === 1}
                className={`px-3 py-1 rounded ${
                  pagination[paginationType].currentPage === 1 
                    ? 'bg-gray-200 cursor-not-allowed' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                Anterior
              </button>
              
              <span className="px-3 py-1 bg-gray-100">
                Página {pagination[paginationType].currentPage} de {pagination[paginationType].totalPages}
              </span>
              
              <button
                onClick={() => handlePageChange(
                  paginationType,
                  Math.min(
                    pagination[paginationType].currentPage + 1,
                    pagination[paginationType].totalPages
                  )
                )}
                disabled={pagination[paginationType].currentPage === pagination[paginationType].totalPages}
                className={`px-3 py-1 rounded ${
                  pagination[paginationType].currentPage === pagination[paginationType].totalPages 
                    ? 'bg-gray-200 cursor-not-allowed' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              >
                Siguiente
              </button>
            </nav>
          </div>
        )}
      </>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-red-500">Facturas</h1>
        <button
          onClick={() => navigate('/dashboard/facturas/crear')}
          className="bg-primary text-red-500 px-4 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Nueva Factura
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">Cliente</label>
            <input
              type="text"
              name="customer"
              value={filters.customer}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Fecha Desde</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Fecha Hasta</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            />
          </div>
          <div>
            <label className="block mb-1">Estado</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
              <option value="draft">Borrador</option>
              <option value="pending">Pendiente</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="refunded">Reembolsada</option>
              <option value="partially_refunded">Reembolso Parcial</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Estado de Pago</label>
            <select
              name="paymentStatus"
              value={filters.paymentStatus}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
              <option value="paid">Pagada</option>
              <option value="partial">Pago Parcial</option>
              <option value="pending">Pendiente</option>
              <option value="overdue">Vencida</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Tipo</label>
            <select
              name="isFiscal"
              value={filters.isFiscal}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
              <option value="true">Fiscal</option>
              <option value="false">No Fiscal</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Monto Mínimo</label>
            <input
              type="number"
              name="minTotal"
              value={filters.minTotal}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block mb-1">Monto Máximo</label>
            <input
              type="number"
              name="maxTotal"
              value={filters.maxTotal}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
              min="0"
              step="0.01"
            />
          </div>
          <div className="flex items-end space-x-2 md:col-span-3">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
            <button
              type="button"
              onClick={handleClearFilters}
              className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            >
              Limpiar Filtros
            </button>
          </div>
        </form>
      </div>

      {/* Pestañas para métodos de pago */}
      <div className="mb-6">
        <div className="flex border-b">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'todos' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => setActiveTab('todos')}
          >
            Todas las Facturas
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'efectivo' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => setActiveTab('efectivo')}
          >
            Pagadas en Efectivo
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'tarjeta' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => setActiveTab('tarjeta')}
          >
            Pagadas con Tarjeta
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'transferencia' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => setActiveTab('transferencia')}
          >
            Pagadas con Transferencia
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'pendiente' 
              ? 'text-blue-500 border-b-2 border-blue-500' 
              : 'text-gray-500 hover:text-blue-500'}`}
            onClick={() => setActiveTab('pendiente')}
          >
            Pendientes de Pago
          </button>
        </div>
      </div>

      {/* Lista de facturas por método de pago */}
      {loading ? (
        <div className="text-center p-4">Cargando...</div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : (
        <div>
          {activeTab === 'todos' && renderInvoiceTable(invoicesByPaymentMethod.todos, 'todos')}
          {activeTab === 'efectivo' && renderInvoiceTable(invoicesByPaymentMethod.efectivo, 'efectivo')}
          {activeTab === 'tarjeta' && renderInvoiceTable(invoicesByPaymentMethod.tarjeta, 'tarjeta')}
          {activeTab === 'transferencia' && renderInvoiceTable(invoicesByPaymentMethod.transferencia, 'transferencia')}
          {activeTab === 'pendiente' && renderInvoiceTable(invoicesByPaymentMethod.pendiente, 'pendiente')}
        </div>
      )}
    </motion.div>
  );
};

export default Facturas;