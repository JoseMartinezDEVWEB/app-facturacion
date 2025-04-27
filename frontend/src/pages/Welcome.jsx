import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLoading } from '../context/LoadingContext';

const Welcome = () => {
  const navigate = useNavigate();
  const { showInitialLoader } = useLoading();

  useEffect(() => {
    // Mostrar la animación de carga inicial de 5 segundos
    showInitialLoader('Iniciando sistema de facturación...');
  }, [showInitialLoader]);

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg"
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="text-center">
          <motion.h1 
            className="text-3xl font-bold text-blue-600 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Sistema de Facturación Electrónica
          </motion.h1>
          <motion.p 
            className="text-lg text-gray-600 mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Bienvenido a tu plataforma de gestión de facturas
          </motion.p>
        </div>
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button 
            onClick={() => navigate('/login')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Iniciar Sesión
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default Welcome;