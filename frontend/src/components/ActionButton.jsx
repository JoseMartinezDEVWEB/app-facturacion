import { motion } from 'framer-motion';

export const ActionButton = ({ onClick, variant = 'primary', children, disabled }) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700',
    secondary: 'bg-gray-600 hover:bg-gray-700',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50`}
    >
      {children}
    </motion.button>
  );
};