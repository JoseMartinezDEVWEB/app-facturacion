import { motion } from 'framer-motion';

export const FormField = ({ label, error, children }) => (
  <div className="mb-3 sm:mb-4">
    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">{label}</label>
    <div className="mt-1">{children}</div>
    {error && (
      <motion.span 
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="block text-xs sm:text-sm text-red-600 mt-1"
      >
        {error}
      </motion.span>
    )}
  </div>
);