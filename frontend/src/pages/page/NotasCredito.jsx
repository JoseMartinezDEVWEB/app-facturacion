import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCreditNotes, processFiscalCreditNote, cancelCreditNote, generateCreditNotePDF } from '../../services/creditNoteService';
import { motion } from 'framer-motion';

const NotasCredito = () => {
  const navigate = useNavigate();
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    invoiceId: '',
    startDate: '',
    endDate: '',
    status: '',
    refundMethod: '',
    isFiscal: '',
    minTotal: '',
    maxTotal: ''
  });

  useEffect(() => {
    fetchCreditNotes();
  }, [currentPage]);

  const fetchCreditNotes = async () => {
    try {
      setLoading(true);
      const response = await getCreditNotes({
        ...filters,
        page: currentPage,
        limit: 10
      });
      
      setCreditNotes(response.data);
      setTotalPages(response.totalPages || 1);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar las notas de crédito');
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
    setCurrentPage(1);
    fetchCreditNotes();
  };

  const handleClearFilters = () => {
    setFilters({
      invoiceId: '',
      startDate: '',
      endDate: '',
      status: '',
      refundMethod: '',
      isFiscal: '',
      minTotal: '',
      maxTotal: ''
    });
    setCurrentPage(1);
    fetchCreditNotes();
  };

  const handleViewCreditNote = (id) => {
    navigate(`/dashboard/notas-credito/${id}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'processed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
        <h1 className="text-2xl font-bold">Notas de Crédito</h1>
        <Link 
          to="/dashboard/facturas" 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Ir a Facturas
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <form onSubmit={handleApplyFilters} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">ID de Factura</label>
            <input
              type="text"
              name="invoiceId"
              value={filters.invoiceId}
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
              <option value="pending">Pendiente</option>
              <option value="processed">Procesada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="block mb-1">Método de Reembolso</label>
            <select
              name="refundMethod"
              value={filters.refundMethod}
              onChange={handleFilterChange}
              className="w-full border p-2 rounded"
            >
              <option value="">Todos</option>
              <option value="cash">Efectivo</option>
              <option value="credit_card">Tarjeta de Crédito</option>
              <option value="bank_transfer">Transferencia Bancaria</option>
              <option value="store_credit">Crédito en Tienda</option>
              <option value="replacement">Reemplazo</option>
              <option value="other">Otro</option>
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

      {/* Lista de notas de crédito */}
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
                    <th className="py-3 px-6 text-left">Nº Nota</th>
                    <th className="py-3 px-6 text-left">Factura</th>
                    <th className="py-3 px-6 text-left">Fecha</th>
                    <th className="py-3 px-6 text-left">Motivo</th>
                    <th className="py-3 px-6 text-right">Total</th>
                    <th className="py-3 px-6 text-center">Estado</th>
                    <th className="py-3 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="text-gray-600 text-sm">
                  {creditNotes.length > 0 ? (
                    creditNotes.map((note) => (
                      <tr key={note._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-6 text-left font-medium">
                          {note.creditNoteNumber}
                          {note.isFiscal && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                              Fiscal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {note.relatedInvoice?.receiptNumber || 'N/A'}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {new Date(note.dateTime).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-6 text-left">
                          {note.reason}
                        </td>
                        <td className="py-3 px-6 text-right font-medium">
                          ${note.total.toFixed(2)}
                        </td>
                        <td className="py-3 px-6 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(note.status)}`}>
                            {note.status}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-center">
                          <button
                            onClick={() => handleViewCreditNote(note._id)}
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
                        No se encontraron notas de crédito
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

export default NotasCredito; 