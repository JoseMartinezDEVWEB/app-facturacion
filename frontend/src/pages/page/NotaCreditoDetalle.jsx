import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCreditNoteById, processFiscalCreditNote, cancelCreditNote } from '../../services/creditNoteService';

const NotaCreditoDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [creditNote, setCreditNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchCreditNote = async () => {
      try {
        setLoading(true);
        const data = await getCreditNoteById(id);
        setCreditNote(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar la nota de crédito: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching credit note:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCreditNote();
    }
  }, [id]);

  const handleProcessFiscal = async () => {
    try {
      setLoading(true);
      await processFiscalCreditNote(id);
      // Recargar los datos actualizados
      const updatedData = await getCreditNoteById(id);
      setCreditNote(updatedData);
      alert('Nota de crédito procesada fiscalmente con éxito');
    } catch (err) {
      setError('Error al procesar fiscalmente: ' + (err.response?.data?.message || err.message));
      alert('Error al procesar fiscalmente la nota de crédito');
      console.error('Error processing credit note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Por favor, proporcione un motivo para la cancelación');
      return;
    }

    try {
      setLoading(true);
      await cancelCreditNote(id, cancelReason);
      // Recargar los datos actualizados
      const updatedData = await getCreditNoteById(id);
      setCreditNote(updatedData);
      setShowCancelModal(false);
      setCancelReason('');
      alert('Nota de crédito cancelada con éxito');
    } catch (err) {
      setError('Error al cancelar la nota de crédito: ' + (err.response?.data?.message || err.message));
      alert('Error al cancelar la nota de crédito');
      console.error('Error canceling credit note:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Función para determinar la clase CSS del estado de la nota de crédito
  const getStatusClass = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'procesada':
        return 'bg-green-100 text-green-800';
      case 'anulada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => navigate('/dashboard/notas-credito')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver a Notas de Crédito
        </button>
      </div>
    );
  }

  if (!creditNote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-500 text-xl mb-4">No se encontró la nota de crédito</div>
        <button 
          onClick={() => navigate('/dashboard/notas-credito')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver a Notas de Crédito
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container mx-auto px-4 py-8 max-w-4xl"
    >
      {/* Encabezado con acciones */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Nota de Crédito #{creditNote.numero}</h1>
        <div className="flex space-x-2">
          {creditNote.estado === 'pendiente' && (
            <>
              <button
                onClick={handleProcessFiscal}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={loading}
              >
                Procesar Fiscal
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                disabled={loading}
              >
                Anular
              </button>
            </>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Imprimir
          </button>
          <button
            onClick={() => navigate('/dashboard/notas-credito')}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
          >
            Volver
          </button>
        </div>
      </div>

      {/* Sección de información general */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg font-semibold mb-3">Información General</h2>
            <div className="space-y-2">
              <p><span className="font-medium">Fecha:</span> {new Date(creditNote.fecha).toLocaleDateString()}</p>
              <p><span className="font-medium">Estado:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusClass(creditNote.estado)}`}>
                  {creditNote.estado.toUpperCase()}
                </span>
              </p>
              <p><span className="font-medium">Factura Relacionada:</span> #{creditNote.facturaRelacionada?.numero || 'N/A'}</p>
              {creditNote.motivoAnulacion && (
                <p><span className="font-medium">Motivo de Anulación:</span> {creditNote.motivoAnulacion}</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">Cliente</h2>
            {creditNote.cliente && (
              <div className="space-y-2">
                <p><span className="font-medium">Nombre:</span> {creditNote.cliente.nombre}</p>
                <p><span className="font-medium">Documento:</span> {creditNote.cliente.documento}</p>
                <p><span className="font-medium">Dirección:</span> {creditNote.cliente.direccion}</p>
                <p><span className="font-medium">Teléfono:</span> {creditNote.cliente.telefono}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sección de productos */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Productos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {creditNote.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.producto.nombre}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.cantidad}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${item.precio.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${(item.cantidad * item.precio).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección de totales */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-end">
          <dl className="space-y-2 text-sm w-full max-w-xs">
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">Subtotal:</dt>
              <dd className="text-gray-900">${creditNote.subtotal?.toFixed(2) || '0.00'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">IVA ({creditNote.porcentajeIva || 19}%):</dt>
              <dd className="text-gray-900">${creditNote.iva?.toFixed(2) || '0.00'}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <dt className="font-bold text-gray-900">Total:</dt>
              <dd className="font-bold text-gray-900">${creditNote.total?.toFixed(2) || '0.00'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Sección de observaciones */}
      {creditNote.observaciones && (
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-3">Observaciones</h2>
          <p className="text-gray-700">{creditNote.observaciones}</p>
        </div>
      )}

      {/* Modal de cancelación */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Anular Nota de Crédito</h3>
            <p className="mb-4">Por favor, indique el motivo de la anulación:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded mb-4 h-32"
              placeholder="Motivo de anulación..."
            ></textarea>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                disabled={loading}
              >
                Anular Nota de Crédito
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default NotaCreditoDetalle; 