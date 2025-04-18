import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, processFiscalInvoice, cancelInvoice, addPayment } from '../../services/invoiceService';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { FaCreditCard, FaReceipt, FaPrint, FaArrowLeft } from 'react-icons/fa';

const FacturaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para modales
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  
  // Estados para formularios
  const [paymentData, setPaymentData] = useState({
    amount: 0,
    paymentMethod: 'cash',
    paymentDetails: {}
  });
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await getInvoiceById(id);
        setInvoice(response);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar la factura');
        console.error('Error al cargar la factura:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const handleProcessFiscal = async () => {
    try {
      setLoading(true);
      const response = await processFiscalInvoice(id);
      setInvoice(response.data);
      alert('Factura fiscal procesada correctamente');
    } catch (err) {
      setError(err.message || 'Error al procesar la factura fiscal');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Debe proporcionar un motivo para la cancelación');
      return;
    }

    try {
      setLoading(true);
      const response = await cancelInvoice(id, cancelReason);
      setInvoice(response.data);
      setShowCancelModal(false);
      alert('Factura cancelada correctamente');
    } catch (err) {
      setError(err.message || 'Error al cancelar la factura');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPayment = async () => {
    if (paymentData.amount <= 0) {
      alert('El monto debe ser mayor a 0');
      return;
    }

    try {
      setLoading(true);
      const response = await addPayment(id, paymentData);
      setInvoice(response.data);
      setShowPaymentModal(false);
      alert('Pago registrado correctamente');
    } catch (err) {
      setError(err.message || 'Error al registrar el pago');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCreditNote = () => {
    navigate(`/dashboard/crear-nota-credito/${id}`);
  };

  // Función para obtener el estado de pago
  const getPaymentStatus = (invoice) => {
    if (invoice.paymentMethod === 'credit') {
      return invoice.creditStatus || 'pending';
    }
    // Para pagos que no son a crédito, asumimos que están pagados
    return 'paid';
  };

  // Función para traducir los estados
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

  // Función para traducir los métodos de pago
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-4 text-center">Cargando...</div>;
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;
  if (!invoice) return <div className="p-4 text-center">No se encontró la factura</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      {/* Barra de acciones - solo visible en pantalla */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <h1 className="text-2xl font-bold">Factura #{invoice.receiptNumber}</h1>
        <div className="flex space-x-2">
          {invoice.status !== 'cancelled' && (
            <>
              {invoice.paymentStatus !== 'paid' && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-green-500 text-white px-4 py-2 rounded"
                >
                  Registrar Pago
                </button>
              )}
              {invoice.isFiscal && invoice.fiscalStatus === 'pending' && (
                <button
                  onClick={handleProcessFiscal}
                  className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Procesar Fiscal
                </button>
              )}
              <button
                onClick={() => setShowCancelModal(true)}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
              <Button
                variant="outlined"
                startIcon={<FaArrowLeft />}
                onClick={() => navigate('/dashboard/facturas')}
              >
                Volver
              </Button>
            </>
          )}
          <Button
            variant="contained"
            color="primary"
            startIcon={<FaPrint />}
            onClick={handlePrint}
          >
            Imprimir
          </Button>
          {invoice.status === 'completed' && (
            <Button
              variant="contained"
              color="warning"
              startIcon={<FaCreditCard />}
              onClick={() => navigate(`/dashboard/crear-nota-credito/${id}`)}
            >
              Nota Crédito
            </Button>
          )}
          {invoice.status === 'completed' && (
            <Button
              variant="contained"
              color="info"
              startIcon={<FaReceipt />}
              onClick={() => navigate(`/dashboard/crear-retencion/${id}`)}
            >
              Retención
            </Button>
          )}
        </div>
      </div>

      {/* Contenido de la factura (visible tanto en pantalla como en impresión) */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 print:shadow-none print:p-0">
        {/* Cabecera de factura para impresión */}
        <div className="hidden print:block text-center mb-4">
          <h1 className="text-xl font-bold">Factura #{invoice.receiptNumber}</h1>
          <p className="text-sm">{new Date(invoice.createdAt || invoice.dateTime).toLocaleDateString()}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 print:text-sm">
          <div>
            <h2 className="text-lg font-semibold mb-2 print:text-base">Información General</h2>
            <p><strong>Fecha:</strong> {new Date(invoice.createdAt || invoice.dateTime).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> {getStatusTranslation(invoice.status)}</p>
            <p><strong>Estado de Pago:</strong> {getPaymentStatusTranslation(getPaymentStatus(invoice))}</p>
            <p><strong>Método de Pago:</strong> {getPaymentMethodTranslation(invoice.paymentMethod)}</p>
            {invoice.paymentDetails && invoice.paymentDetails.cardLastFour && (
              <p><strong>Tarjeta:</strong> **** **** **** {invoice.paymentDetails.cardLastFour}</p>
            )}
            {invoice.paymentMethod === 'credit' && invoice.isCredit && invoice.clientInfo && (
              <p><strong>Cliente de Crédito:</strong> {invoice.clientInfo.name}</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2 print:text-base">Cliente</h2>
            <p><strong>Nombre:</strong> {invoice.customer.name}</p>
            {invoice.customer.email && <p><strong>Email:</strong> {invoice.customer.email}</p>}
            {invoice.customer.phone && <p><strong>Teléfono:</strong> {invoice.customer.phone}</p>}
            {invoice.customer.address && <p><strong>Dirección:</strong> {invoice.customer.address}</p>}
            {invoice.customer.taxId && <p><strong>RUC/Cédula:</strong> {invoice.customer.taxId}</p>}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-2 print:text-base">Productos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white print:text-sm">
            <thead>
              <tr className="bg-gray-100 print:bg-white">
                <th className="py-2 px-4 text-left print:py-1 print:px-2">Producto</th>
                <th className="py-2 px-4 text-right print:py-1 print:px-2">Cantidad</th>
                <th className="py-2 px-4 text-right print:py-1 print:px-2">Precio</th>
                <th className="py-2 px-4 text-right print:py-1 print:px-2">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4 print:py-1 print:px-2">
                    {item.product.name || 'Producto'}
                    {item.weightInfo && (
                      <span className="text-sm text-gray-500 block print:text-xs">
                        {item.weightInfo.value} {item.weightInfo.unit} a ${item.weightInfo.pricePerUnit}/{item.weightInfo.unit}
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right print:py-1 print:px-2">{item.quantity}</td>
                  <td className="py-2 px-4 text-right print:py-1 print:px-2">${item.price.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right print:py-1 print:px-2">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t">
                <td colSpan="3" className="py-2 px-4 text-right font-semibold print:py-1 print:px-2">Subtotal:</td>
                <td className="py-2 px-4 text-right print:py-1 print:px-2">${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="py-2 px-4 text-right font-semibold print:py-1 print:px-2">Impuestos ({(invoice.taxRate * 100).toFixed(0)}%):</td>
                <td className="py-2 px-4 text-right print:py-1 print:px-2">${invoice.taxAmount.toFixed(2)}</td>
              </tr>
              <tr className="bg-gray-50 font-bold print:bg-white">
                <td colSpan="3" className="py-2 px-4 text-right print:py-1 print:px-2">Total:</td>
                <td className="py-2 px-4 text-right print:py-1 print:px-2">${invoice.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Información adicional del Cajero - opcional en impresión */}
        {invoice.cashier && (
          <div className="mt-6 print:mt-3 print:text-sm">
            <h2 className="text-lg font-semibold mb-2 print:text-base">Información del Cajero</h2>
            <p><strong>Nombre:</strong> {invoice.cashier.name || 'No disponible'}</p>
          </div>
        )}

        {/* Notas o comentarios - opcional en impresión */}
        {invoice.notes && (
          <div className="mt-6 print:mt-3 print:text-sm">
            <h2 className="text-lg font-semibold mb-2 print:text-base">Notas</h2>
            <p className="p-2 bg-gray-50 rounded print:bg-white print:p-0">{invoice.notes}</p>
          </div>
        )}
        
        {/* Pie de factura solo para impresión */}
        <div className="hidden print:block text-center mt-6 text-xs">
          <p>Gracias por su compra</p>
          <p>** Este documento es un comprobante válido de pago **</p>
        </div>
      </div>

      {/* Modal para registrar pago */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Registrar Pago</h2>
            <div className="mb-4">
              <label className="block mb-1">Monto</label>
              <input
                type="number"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}
                className="w-full border p-2 rounded"
                min="0"
                max={invoice.total - (invoice.paidAmount || 0)}
                step="0.01"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1">Método de Pago</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                className="w-full border p-2 rounded"
              >
                <option value="cash">Efectivo</option>
                <option value="credit_card">Tarjeta de Crédito</option>
                <option value="bank_transfer">Transferencia Bancaria</option>
                <option value="check">Cheque</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayment}
                className="px-4 py-2 bg-blue-500 text-white rounded"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para cancelar factura */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Cancelar Factura</h2>
            <div className="mb-4">
              <label className="block mb-1">Motivo de Cancelación</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border p-2 rounded"
                rows="3"
              ></textarea>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancelar
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-red-500 text-white rounded"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estilos de impresión */}
      <style jsx>{`
        @media print {
          button, .no-print {
            display: none !important;
          }
          body {
            font-size: 12pt;
            margin: 0;
            padding: 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          /* Ocultar elementos del navegador */
          @page {
            margin: 0.5cm;
            size: auto;
          }
          /* Elimina URLs, encabezados y pies de página del navegador */
          @page {
            margin: 1cm;
          }
          @page :first {
            margin-top: 1cm;
          }
          @page :left {
            margin-left: 1cm;
          }
          @page :right {
            margin-right: 1cm;
          }
          html {
            height: 100%;
          }
        }
      `}</style>

      {/* Script para limpiar la impresión */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function beforePrint() {
            // Crear un estilo temporal para la impresión
            const style = document.createElement('style');
            style.id = 'print-style';
            style.innerHTML = \`
              @media print {
                /* Ocultar URLs y otros elementos del navegador */
                @page { size: auto; margin: 0mm; }
                html, body { height: 99%; }
                /* Ocultar la URL que se muestra en el pie de página */
                body::after { display: none !important; content: none !important; }
              }
            \`;
            document.head.appendChild(style);
          }

          function afterPrint() {
            // Eliminar el estilo temporal
            const style = document.getElementById('print-style');
            if (style) style.remove();
          }

          // Agregar escuchadores de eventos de impresión
          window.addEventListener('beforeprint', beforePrint);
          window.addEventListener('afterprint', afterPrint);
        `
      }} />
    </motion.div>
  );
};

export default FacturaDetalle; 