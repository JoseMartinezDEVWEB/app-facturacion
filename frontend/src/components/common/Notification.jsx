/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from 'framer-motion';

const Notification = ({ message, type }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 ${
            type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;