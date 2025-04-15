import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getQuoteById, approveQuote, rejectQuote, convertToInvoice } from '../../services/quoteService';
import Swal from 'sweetalert2';

const CotizacionDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        setLoading(true);
        const data = await getQuoteById(id);
        setQuote(data);
        setError(null);
      } catch (err) {
        setError('Error al cargar la cotización: ' + (err.response?.data?.message || err.message));
        console.error('Error fetching quote:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchQuote();
    }
  }, [id]);

  const handleApprove = async () => {
    try {
      Swal.fire({
        title: '¿Aprobar cotización?',
        text: 'Esta acción no se puede deshacer',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, aprobar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLoading(true);
          await approveQuote(id);
          const updatedData = await getQuoteById(id);
          setQuote(updatedData);
          Swal.fire('¡Aprobada!', 'La cotización ha sido aprobada.', 'success');
        }
      });
    } catch (err) {
      setError('Error al aprobar: ' + (err.response?.data?.message || err.message));
      Swal.fire('Error', 'No se pudo aprobar la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      const { value: reason, isConfirmed } = await Swal.fire({
        title: 'Rechazar cotización',
        input: 'textarea',
        inputLabel: 'Motivo del rechazo',
        inputPlaceholder: 'Ingrese el motivo del rechazo...',
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar'
      });

      if (isConfirmed && reason) {
        setLoading(true);
        await rejectQuote(id, { reason });
        const updatedData = await getQuoteById(id);
        setQuote(updatedData);
        Swal.fire('¡Rechazada!', 'La cotización ha sido rechazada.', 'success');
      }
    } catch (err) {
      setError('Error al rechazar: ' + (err.response?.data?.message || err.message));
      Swal.fire('Error', 'No se pudo rechazar la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async () => {
    try {
      Swal.fire({
        title: '¿Convertir a factura?',
        text: 'Se creará una factura basada en esta cotización',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, convertir',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLoading(true);
          const result = await convertToInvoice(id);
          Swal.fire('¡Convertida!', 'La cotización ha sido convertida a factura.', 'success');
          navigate(`/dashboard/facturas/${result.invoiceId}`);
        }
      });
    } catch (err) {
      setError('Error al convertir: ' + (err.response?.data?.message || err.message));
      Swal.fire('Error', 'No se pudo convertir la cotización', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Función para determinar la clase CSS del estado de la cotización
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'converted':
        return 'bg-blue-100 text-blue-800';
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
          onClick={() => navigate('/dashboard/cotizaciones')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver a Cotizaciones
        </button>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-gray-500 text-xl mb-4">No se encontró la cotización</div>
        <button 
          onClick={() => navigate('/dashboard/cotizaciones')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver a Cotizaciones
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
        <h1 className="text-2xl font-bold">Cotización #{quote.quoteNumber}</h1>
        <div className="flex space-x-2">
          {quote.status === 'pending' && (
            <>
              <button
                onClick={handleApprove}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                disabled={loading}
              >
                Aprobar
              </button>
              <button
                onClick={handleReject}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                disabled={loading}
              >
                Rechazar
              </button>
            </>
          )}
          {quote.status === 'approved' && !quote.convertedToInvoice && (
            <button
              onClick={handleConvert}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              disabled={loading}
            >
              Convertir a Factura
            </button>
          )}
          <button
            onClick={handlePrint}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            Imprimir
          </button>
          <button
            onClick={() => navigate('/dashboard/cotizaciones')}
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
              <p><span className="font-medium">Fecha:</span> {new Date(quote.date).toLocaleDateString()}</p>
              <p><span className="font-medium">Validez:</span> {new Date(quote.validUntil).toLocaleDateString()}</p>
              <p><span className="font-medium">Estado:</span> 
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${getStatusClass(quote.status)}`}>
                  {quote.status === 'pending' ? 'PENDIENTE' :
                   quote.status === 'approved' ? 'APROBADA' :
                   quote.status === 'rejected' ? 'RECHAZADA' :
                   quote.status === 'expired' ? 'EXPIRADA' :
                   quote.status === 'converted' ? 'CONVERTIDA' : quote.status.toUpperCase()}
                </span>
              </p>
              {quote.convertedToInvoice && (
                <p><span className="font-medium">Factura:</span> #{quote.convertedToInvoice}</p>
              )}
              {quote.rejectionReason && (
                <p><span className="font-medium">Motivo de Rechazo:</span> {quote.rejectionReason}</p>
              )}
            </div>
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-3">Cliente</h2>
            {quote.customer && (
              <div className="space-y-2">
                <p><span className="font-medium">Nombre:</span> {quote.customer.name}</p>
                <p><span className="font-medium">Documento:</span> {quote.customer.identification}</p>
                <p><span className="font-medium">Dirección:</span> {quote.customer.address}</p>
                <p><span className="font-medium">Teléfono:</span> {quote.customer.phone}</p>
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
              {quote.items?.map((item, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">{item.product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${item.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    ${(item.quantity * item.price).toFixed(2)}
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
              <dd className="text-gray-900">${quote.subtotal?.toFixed(2) || '0.00'}</dd>
            </div>
            {quote.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="font-medium text-gray-500">Descuento:</dt>
                <dd className="text-gray-900">${quote.discountAmount?.toFixed(2) || '0.00'}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="font-medium text-gray-500">IVA ({quote.taxRate || 12}%):</dt>
              <dd className="text-gray-900">${quote.taxAmount?.toFixed(2) || '0.00'}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <dt className="font-medium text-gray-900">Total:</dt>
              <dd className="font-medium text-gray-900">${quote.total?.toFixed(2) || '0.00'}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Términos y condiciones */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold mb-3">Términos y Condiciones</h2>
        
        {quote.notes && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Notas</h3>
            <p className="text-gray-700">{quote.notes}</p>
          </div>
        )}
        
        {quote.paymentTerms && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Términos de Pago</h3>
            <p className="text-gray-700">{quote.paymentTerms}</p>
          </div>
        )}
        
        {quote.deliveryTerms && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Términos de Entrega</h3>
            <p className="text-gray-700">{quote.deliveryTerms}</p>
          </div>
        )}
        
        {quote.additionalConditions && quote.additionalConditions.length > 0 && (
          <div className="mb-4">
            <h3 className="text-md font-medium mb-2">Condiciones Adicionales</h3>
            <ul className="list-disc pl-5">
              {quote.additionalConditions.map((condition, index) => (
                <li key={index} className="text-gray-700 mb-1">
                  <span className="font-medium">{condition.title}:</span> {condition.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CotizacionDetalle; 