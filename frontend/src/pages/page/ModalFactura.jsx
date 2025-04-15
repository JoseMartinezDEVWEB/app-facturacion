/* eslint-disable react/prop-types */

import { motion, AnimatePresence } from 'framer-motion';

const ModalFactura = ({ factura, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl"
        >
          <h2 className="text-2xl font-bold mb-4">Detalles de la Factura</h2>
          <div className="space-y-4">
            <p><strong>Cliente:</strong> {factura.cliente || 'Consumidor Final'}</p>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2">Producto</th>
                  <th className="p-2">Cantidad</th>
                  <th className="p-2">Precio</th>
                  <th className="p-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {factura.productos.map((producto) => (
                  <tr key={producto._id} className="border-b">
                    <td className="p-2">{producto.nombre}</td>
                    <td className="p-2">{producto.cantidad}</td>
                    <td className="p-2">${producto.precioVenta}</td>
                    <td className="p-2">${producto.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p><strong>Subtotal:</strong> ${factura.subtotal.toFixed(2)}</p>
            <p><strong>Impuestos (18%):</strong> ${factura.impuestos.toFixed(2)}</p>
            <p><strong>Total:</strong> ${factura.total.toFixed(2)}</p>
            <p><strong>Monto Recibido:</strong> ${factura.montoRecibido.toFixed(2)}</p>
            <p><strong>Cambio:</strong> ${factura.cambio.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
          >
            Cerrar
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModalFactura;