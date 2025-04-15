/* eslint-disable react/prop-types */
import { motion } from 'framer-motion';

const LoadingSpinner = ({ size = 'md', message = 'Cargando...' }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ 
          repeat: Infinity, 
          duration: 1, 
          ease: "linear" 
        }}
        className={`rounded-full border-t-4 border-blue-500 border-r-4 border-r-transparent ${sizeClasses[size]}`}
      />
      {message && <p className="mt-3 text-gray-600">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;