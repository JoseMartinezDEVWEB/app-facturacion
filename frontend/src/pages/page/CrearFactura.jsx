import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import POSSystem from '../../components/new-fact/Factur';

const CrearFactura = () => {
  const navigate = useNavigate();
  
  const handleClose = () => {
    navigate('/dashboard/facturas');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="bg-white rounded-lg shadow-xl w-full overflow-auto">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nueva Factura</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">
          <POSSystem onClose={handleClose} />
        </div>
      </div>
    </motion.div>
  );
};

export default CrearFactura; 