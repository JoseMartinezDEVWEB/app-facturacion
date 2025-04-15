import { motion } from 'framer-motion';

export const FormField = ({ label, error, children }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    {children}
    {error && <span className="text-sm text-red-600 mt-1">{error}</span>}
  </div>
);