/* eslint-disable no-undef */
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Constants for payment methods and purchase types
const PAYMENT_METHODS = {
  CASH: 'CASH',
  CREDIT_CARD: 'CREDIT_CARD',
  BANK_TRANSFER: 'BANK_TRANSFER'
};

const PURCHASE_TYPES = {
  RETAIL: 'RETAIL',
  WHOLESALE: 'WHOLESALE'
};

const API_BASE_URL = 'http://localhost:4000/api';

// Animation variants for different components
const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const slideIn = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 }
};

const scaleIn = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 }
};

const Invoice = () => {
  // ... (previous state management code remains the same)

  const containerVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  return (
    <motion.div 
      className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6"
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      {/* Left Column - Invoice Input */}
      <motion.div className="space-y-6">
        {/* Search and Add Products Section */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={slideIn}
        >
          <h2 className="text-xl font-bold mb-4">Nueva Factura</h2>
          <motion.input
            type="text"
            placeholder="Buscar producto por nombre o código de barras"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleSearch}
            className="w-full p-2 border rounded mb-4 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            variants={fadeIn}
          />
          <AnimatePresence mode="wait">
            {currentProduct && (
              <motion.div 
                className="p-4 bg-gray-50 rounded mb-4"
                variants={scaleIn}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <p className="font-bold">{currentProduct.name}</p>
                <p>Precio: ${currentProduct.salePrice}</p>
                <motion.button
                  onClick={handleAddProduct}
                  className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-300"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Agregar a Factura
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Settings Section */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={slideIn}
        >
          <div className="space-y-4">
            <motion.div variants={fadeIn}>
              <label className="block mb-2">Tipo de Compra</label>
              <select
                value={purchaseType}
                onChange={(e) => setPurchaseType(e.target.value)}
                className="w-full p-2 border rounded transition-all duration-300 focus:ring-2 focus:ring-blue-500"
              >
                <option value={PURCHASE_TYPES.RETAIL}>Minorista</option>
                <option value={PURCHASE_TYPES.WHOLESALE}>Mayorista</option>
              </select>
            </motion.div>

            {/* ... (similar motion wrappers for other inputs) ... */}
          </div>
        </motion.div>

        {/* Payment Section */}
        <motion.div 
          className="bg-white p-6 rounded-lg shadow-lg"
          variants={slideIn}
        >
          {/* ... (previous payment section content with motion wrappers) ... */}
        </motion.div>

        {/* Action Button */}
        <motion.button
          onClick={handleSaveAndPrint}
          disabled={isProcessing}
          className={`w-full py-3 rounded-lg text-white text-lg font-semibold
            ${isProcessing ? 'bg-gray-400' : 'bg-green-500 hover:bg-green-600'}
            transition-all duration-300`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isProcessing ? (
            <motion.div
              className="flex items-center justify-center"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Procesando...
            </motion.div>
          ) : (
            'Guardar e Imprimir Factura'
          )}
        </motion.button>
      </motion.div>

      {/* Right Column - Invoice Preview */}
      <motion.div 
        className="bg-white p-6 rounded-lg shadow-lg"
        variants={slideIn}
      >
        <InvoicePreview
          items={items}
          customer={customer}
          paymentMethod={paymentMethod}
          paymentDetails={paymentDetails}
          purchaseType={purchaseType}
          isTaxEnabled={isTaxEnabled}
          isFiscal={isFiscal}
          cashReceived={cashReceived}
          totals={calculateTotals()}
          ref={printRef}
        />
      </motion.div>

      {/* Notifications */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded shadow-lg z-50 
              ${notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'}
              text-white`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Invoice;