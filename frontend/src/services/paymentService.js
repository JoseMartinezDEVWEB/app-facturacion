/**
 * Servicio para gestionar pagos con diferentes métodos
 */

// Mock de respuesta para simular la API de pagos
const mockProcessPayment = (paymentData) => {
  return new Promise((resolve, reject) => {
    // Simulamos un tiempo de procesamiento
    setTimeout(() => {
      // Simulamos un 90% de probabilidad de éxito
      const isSuccessful = Math.random() < 0.9;
      
      if (isSuccessful) {
        resolve({
          success: true,
          transactionId: 'TX' + Math.floor(Math.random() * 1000000).toString().padStart(8, '0'),
          paymentMethod: paymentData.paymentMethod,
          amount: paymentData.amount,
          date: new Date().toISOString(),
          paymentDetails: paymentData.paymentDetails
        });
      } else {
        reject({
          success: false,
          error: 'Error en el procesamiento del pago',
          errorCode: 'PAYMENT_ERROR',
          paymentMethod: paymentData.paymentMethod
        });
      }
    }, 2000);
  });
};

/**
 * Procesa un pago con tarjeta de crédito manual
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise} - Promesa con el resultado del pago
 */
const processCreditCardPayment = (paymentData) => {
  return mockProcessPayment({
    paymentMethod: 'credit_card',
    amount: paymentData.amount,
    paymentDetails: {
      cardNumber: paymentData.cardNumber.replace(/\s+/g, '').slice(-4),
      cardholderName: paymentData.cardholderName,
      expiryDate: paymentData.expiryDate
    }
  });
};

/**
 * Procesa un pago con terminal Verifone
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise} - Promesa con el resultado del pago
 */
const processTerminalPayment = (paymentData) => {
  return mockProcessPayment({
    paymentMethod: 'terminal',
    amount: paymentData.amount,
    paymentDetails: {
      terminalId: 'TERM001',
      referenceId: paymentData.referenceId,
      cardType: paymentData.cardBrand,
      last4: paymentData.last4
    }
  });
};

/**
 * Procesa un pago en efectivo
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise} - Promesa con el resultado del pago
 */
const processCashPayment = (paymentData) => {
  return mockProcessPayment({
    paymentMethod: 'cash',
    amount: paymentData.amount,
    paymentDetails: {
      cashAmount: paymentData.cashAmount,
      changeAmount: paymentData.cashAmount - paymentData.amount
    }
  });
};

/**
 * Procesa un pago por transferencia bancaria
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise} - Promesa con el resultado del pago
 */
const processTransferPayment = (paymentData) => {
  return mockProcessPayment({
    paymentMethod: 'transfer',
    amount: paymentData.amount,
    paymentDetails: {
      transferNumber: paymentData.transferNumber,
      transferAmount: paymentData.amount
    }
  });
};

const paymentService = {
  processCreditCardPayment,
  processTerminalPayment,
  processCashPayment,
  processTransferPayment
};

export default paymentService; 