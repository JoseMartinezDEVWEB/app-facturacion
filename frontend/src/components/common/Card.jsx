/* eslint-disable react/prop-types */
// src/components/common/Card.jsx
import { motion } from 'framer-motion';

const Card = ({ 
  title, 
  icon: Icon, 
  color = 'blue',
  children,
  className = ''
}) => {
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
      className={`rounded-lg shadow-lg ${colorClasses[color]} text-white p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-4">
        {Icon && <Icon className="w-6 h-6" />}
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
};

export default Card;