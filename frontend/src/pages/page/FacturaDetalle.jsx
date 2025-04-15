import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvoiceById, processFiscalInvoice, cancelInvoice, addPayment } from '../../services/invoiceService';
import { motion } from 'framer-motion';
import { Button } from '@mui/material';
import { FaCreditCard, FaReceipt } from 'react-icons/fa';

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
        setInvoice(response.data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar la factura');
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
      <div className="flex justify-between items-center mb-6">
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
              <button
                onClick={() => navigate('/dashboard/facturas')}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Volver
              </button>
            </>
          )}
          <button
            onClick={() => window.print()}
            className="bg-gray-500 text-white px-4 py-2 rounded"
          >
            Imprimir
          </button>
          <Button
            color="primary"
            className="flex items-center"
            onClick={() => navigate(`/dashboard/crear-nota-credito/${id}`)}
          >
            <FaCreditCard className="mr-2" /> Crear Nota Crédito
          </Button>
          {invoice.status === 'completed' && (
            <Button
              color="warning"
              className="flex items-center"
              onClick={() => navigate(`/dashboard/crear-retencion/${id}`)}
            >
              <FaReceipt className="mr-2" /> Crear Retención
            </Button>
          )}
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold mb-2">Información General</h2>
            <p><strong>Fecha:</strong> {new Date(invoice.dateTime).toLocaleDateString()}</p>
            <p><strong>Estado:</strong> {invoice.status}</p>
            <p><strong>Estado de Pago:</strong> {invoice.paymentStatus}</p>
            <p><strong>Método de Pago:</strong> {invoice.paymentMethod}</p>
            {invoice.isFiscal && (
              <p><strong>Estado Fiscal:</strong> {invoice.fiscalStatus}</p>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold mb-2">Cliente</h2>
            <p><strong>Nombre:</strong> {invoice.customer.name}</p>
            {invoice.customer.email && <p><strong>Email:</strong> {invoice.customer.email}</p>}
            {invoice.customer.phone && <p><strong>Teléfono:</strong> {invoice.customer.phone}</p>}
            {invoice.customer.address && <p><strong>Dirección:</strong> {invoice.customer.address}</p>}
            {invoice.customer.taxId && <p><strong>RUC/Cédula:</strong> {invoice.customer.taxId}</p>}
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-2">Productos</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 text-left">Producto</th>
                <th className="py-2 px-4 text-right">Cantidad</th>
                <th className="py-2 px-4 text-right">Precio</th>
                <th className="py-2 px-4 text-right">Descuento</th>
                <th className="py-2 px-4 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 px-4">{item.product.name}</td>
                  <td className="py-2 px-4 text-right">{item.quantity}</td>
                  <td className="py-2 px-4 text-right">${item.price.toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">${(item.discount || 0).toFixed(2)}</td>
                  <td className="py-2 px-4 text-right">${item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-right">
          <p><strong>Subtotal:</strong> ${invoice.subtotal.toFixed(2)}</p>
          {invoice.discountAmount > 0 && (
            <p><strong>Descuento Total:</strong> ${invoice.discountAmount.toFixed(2)}</p>
          )}
          {invoice.taxes && invoice.taxes.map((tax, index) => (
            <p key={index}>
              <strong>{tax.name} ({tax.rate}%):</strong> ${tax.amount.toFixed(2)}
            </p>
          ))}
          <p className="text-xl font-bold mt-2">
            <strong>Total:</strong> ${invoice.total.toFixed(2)}
          </p>
          {invoice.paymentStatus !== 'paid' && (
            <p className="text-red-500">
              <strong>Pendiente:</strong> ${(invoice.total - (invoice.paidAmount || 0)).toFixed(2)}
            </p>
          )}
        </div>

        {invoice.notes && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Notas</h2>
            <p className="whitespace-pre-line">{invoice.notes}</p>
          </div>
        )}
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
    </motion.div>
  );
};

export default FacturaDetalle; 