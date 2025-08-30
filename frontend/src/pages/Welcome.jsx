import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            Sistema de Facturación Electrónica
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Bienvenido a tu plataforma de gestión de facturas
          </p>
        </div>
        <div className="flex justify-center">
          <button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
          >
            Iniciar Sesión
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Welcome;