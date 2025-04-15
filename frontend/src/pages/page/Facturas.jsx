import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvoices } from '../../services/invoiceService';
import { motion, AnimatePresence } from 'framer-motion';
import Factur from '../../components/new-fact/Factur';

const Facturas = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showNewInvoice, setShowNewInvoice] = useState(false);
  
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
    fetchInvoices();
  }, [currentPage]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await getInvoices({
        ...filters,
        page: currentPage,
        limit: 10
      });
      
      setInvoices(response.data);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar las facturas');
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
    setCurrentPage(1); // Resetear a la primera página
    fetchInvoices();
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
    setCurrentPage(1);
    fetchInvoices();
  };

  const handleViewInvoice = (id) => {
    navigate(`/dashboard/facturas/${id}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Facturas</h1>
        <button 
          onClick={() => setShowNewInvoice(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Nueva Factura
        </button>
      </div>

      {/* Modal de Nueva Factura */}
      <AnimatePresence>
        {showNewInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto"
            >
              <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold">Nueva Factura</h2>
                <button
                  onClick={() => setShowNewInvoice(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <Factur onClose={() => {
                  setShowNewInvoice(false);
                  fetchInvoices(); // Actualizar la lista después de crear una factura
                }} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* Lista de facturas */}
      {loading ? (
        <div className="text-center p-4">Cargando...</div>
      ) : error ? (
        <div className="text-center text-red-500 p-4">{error}</div>
      ) : (
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
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {invoices.length > 0 ? (
                    invoices.map((invoice) => (
                      <tr key={invoice._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-6 text-left font-medium">
                          {invoice.receiptNumber}
                          {invoice.isFiscal && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Fiscal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-left">{invoice.customer.name}</td>
                        <td className="py-3 px-6 text-left">
                          {new Date(invoice.dateTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-right font-medium">
                          ${invoice.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(invoice.status)}`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusBadgeClass(invoice.paymentStatus)}`}>
                            {invoice.paymentStatus}
                          </span>
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="py-3 px-6 text-center">
                        No se encontraron facturas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded ${
                    currentPage === 1 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  Anterior
                </button>
                
                <span className="px-3 py-1 bg-gray-100">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded ${
                    currentPage === totalPages ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                >
                  Siguiente
                </button>
              </nav>
    </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Facturas;