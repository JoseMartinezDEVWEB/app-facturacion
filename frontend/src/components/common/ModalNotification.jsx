import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import { FaCheck, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ModalNotification = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'info',
  onConfirm = null
}) => {
  // Set icon and colors based on notification type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <FaCheck className="text-2xl" />,
          bgColor: 'bg-green-100',
          iconBg: 'bg-green-500',
          textColor: 'text-green-800',
          buttonColor: 'bg-green-600 hover:bg-green-700'
        };
      case 'error':
        return {
          icon: <FaExclamationTriangle className="text-2xl" />,
          bgColor: 'bg-red-100',
          iconBg: 'bg-red-500',
          textColor: 'text-red-800',
          buttonColor: 'bg-red-600 hover:bg-red-700'
        };
      case 'warning':
        return {
          icon: <FaExclamationTriangle className="text-2xl" />,
          bgColor: 'bg-yellow-100',
          iconBg: 'bg-yellow-500',
          textColor: 'text-yellow-800',
          buttonColor: 'bg-yellow-600 hover:bg-yellow-700'
        };
      default:
        return {
          icon: <FaInfoCircle className="text-2xl" />,
          bgColor: 'bg-blue-100',
          iconBg: 'bg-blue-500',
          textColor: 'text-blue-800',
          buttonColor: 'bg-blue-600 hover:bg-blue-700'
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50"
          >
            <div className={`${typeStyles.bgColor} rounded-lg shadow-xl overflow-hidden max-w-md w-full`}>
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className={`${typeStyles.iconBg} text-white p-2 rounded-full`}>
                    {typeStyles.icon}
                  </div>
                  <h3 className={`text-lg font-medium ${typeStyles.textColor}`}>{title}</h3>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-gray-500 hover:text-gray-700 transition-colors focus:outline-none"
                >
                  <IoMdClose size={24} />
                </button>
              </div>
              
              {/* Body */}
              <div className="p-6">
                <p className={`${typeStyles.textColor} text-sm`}>{message}</p>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-3 bg-gray-50 flex justify-end space-x-3">
                {onConfirm && (
                  <button
                    onClick={onConfirm}
                    className={`px-4 py-2 rounded-md text-white ${typeStyles.buttonColor} transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${type}-500`}
                  >
                    Confirmar
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ModalNotification; 