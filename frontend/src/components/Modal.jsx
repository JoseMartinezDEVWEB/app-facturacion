import { motion, AnimatePresence } from 'framer-motion';
  
export const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl w-full max-w-lg"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">{title}</h2>
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);