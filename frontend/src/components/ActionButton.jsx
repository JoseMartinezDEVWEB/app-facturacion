import { motion } from 'framer-motion';

export const ActionButton = ({ 
  onClick, 
  variant = 'primary', 
  children, 
  disabled, 
  fullWidth = false,
  size = 'md',
  type = 'button',
  className = '' 
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-gray-600 hover:bg-gray-700 active:bg-gray-800',
    success: 'bg-green-600 hover:bg-green-700 active:bg-green-800',
    danger: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
    warning: 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700',
    info: 'bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700',
    light: 'bg-gray-200 hover:bg-gray-300 active:bg-gray-400 text-gray-800',
    dark: 'bg-gray-800 hover:bg-gray-900 active:bg-black',
    link: 'bg-transparent text-blue-600 hover:text-blue-800 p-0 underline hover:no-underline'
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs sm:text-sm',
    md: 'px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base',
    lg: 'px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg'
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={`
        ${variants[variant]} 
        ${sizes[size]} 
        ${fullWidth ? 'w-full' : ''}
        text-white rounded-md transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50
        ${variant === 'link' ? '' : 'shadow-sm'}
        ${variant === 'light' ? 'text-gray-800' : 'text-white'}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
};