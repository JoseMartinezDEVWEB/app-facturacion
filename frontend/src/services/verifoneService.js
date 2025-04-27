/**
 * Servicio para manejar la comunicación con dispositivos de pago Verifone
 */

// Configuración de la conexión con Verifone
const VERIFONE_CONFIG = {
  apiUrl: process.env.REACT_APP_VERIFONE_API_URL || 'https://api.verifone.com',
  apiKey: process.env.REACT_APP_VERIFONE_API_KEY,
  merchantId: process.env.REACT_APP_VERIFONE_MERCHANT_ID,
  terminalId: process.env.REACT_APP_VERIFONE_TERMINAL_ID,
  timeout: 120000, // Tiempo de espera máximo en ms (2 minutos)
};

// Estados de la transacción
export const TRANSACTION_STATUS = {
  READY: 'ready',
  CONNECTING: 'connecting',
  PROCESSING: 'processing',
  WAITING_CARD: 'waiting_card',
  CARD_READ: 'card_read',
  AUTHORIZING: 'authorizing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  ERROR: 'error',
};

// Tipos de conexión soportados
export const CONNECTION_TYPES = {
  USB: 'usb',
  BLUETOOTH: 'bluetooth',
  NETWORK: 'network',
  CLOUD: 'cloud',
};

/**
 * Clase que maneja la comunicación con el dispositivo Verifone
 */
class VerifoneService {
  constructor() {
    this.status = TRANSACTION_STATUS.READY;
    this.device = null;
    this.connectionType = null;
    this.lastError = null;
    this.transactionId = null;
    this.callbacks = {
      onStatusChange: null,
      onError: null,
      onSuccess: null,
    };
  }

  /**
   * Inicializa la conexión con el dispositivo Verifone
   * @param {string} connectionType - Tipo de conexión (usb, bluetooth, network, cloud)
   * @returns {Promise<boolean>} - Éxito de la conexión
   */
  async initializeDevice(connectionType = CONNECTION_TYPES.USB) {
    try {
      this._updateStatus(TRANSACTION_STATUS.CONNECTING);
      
      // Simular conexión con el dispositivo
      await this._simulateConnection();
      
      this.connectionType = connectionType;
      this.device = {
        id: 'VFD-' + Math.floor(Math.random() * 10000),
        type: 'Verifone P400',
        connectionType: connectionType,
        status: 'connected',
      };
      
      this._updateStatus(TRANSACTION_STATUS.READY);
      return true;
    } catch (error) {
      this.lastError = error.message || 'Error al inicializar el dispositivo';
      this._updateStatus(TRANSACTION_STATUS.ERROR);
      this._notifyError(this.lastError);
      return false;
    }
  }

  /**
   * Procesa un pago con tarjeta a través del dispositivo Verifone
   * @param {Object} paymentData - Datos del pago
   * @param {number} paymentData.amount - Monto del pago en la moneda local
   * @param {string} paymentData.currency - Código de moneda (USD, EUR, etc.)
   * @param {string} paymentData.reference - Número de referencia o factura
   * @returns {Promise<Object>} - Resultado de la transacción
   */
  async processPayment(paymentData) {
    try {
      if (!this.device) {
        throw new Error('Dispositivo no inicializado. Llame a initializeDevice primero.');
      }
      
      // Validar datos mínimos
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new Error('El monto debe ser mayor a cero');
      }
      
      this._updateStatus(TRANSACTION_STATUS.PROCESSING);
      
      // Generar un ID de transacción único
      this.transactionId = Date.now().toString() + Math.floor(Math.random() * 1000);
      
      // Simular procesamiento de pago con tarjeta
      await this._simulateCardProcessing(paymentData);
      
      const result = {
        success: true,
        transactionId: this.transactionId,
        amount: paymentData.amount,
        currency: paymentData.currency || 'USD',
        cardType: 'VISA', // Simulado
        last4: '1234', // Simulado
        authCode: 'AUTH' + Math.floor(Math.random() * 100000),
        reference: paymentData.reference,
        timestamp: new Date().toISOString(),
      };
      
      this._updateStatus(TRANSACTION_STATUS.COMPLETED);
      this._notifySuccess(result);
      return result;
    } catch (error) {
      this.lastError = error.message || 'Error al procesar el pago';
      this._updateStatus(TRANSACTION_STATUS.ERROR);
      this._notifyError(this.lastError);
      throw error;
    }
  }

  /**
   * Cancela la transacción en progreso
   * @returns {Promise<boolean>} - Éxito de la cancelación
   */
  async cancelTransaction() {
    try {
      if (!this.device) {
        throw new Error('Dispositivo no inicializado');
      }
      
      this._updateStatus(TRANSACTION_STATUS.CANCELLED);
      return true;
    } catch (error) {
      this.lastError = error.message || 'Error al cancelar la transacción';
      this._notifyError(this.lastError);
      return false;
    }
  }

  /**
   * Registra callbacks para eventos
   * @param {Object} callbacks - Funciones de callback
   */
  registerCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Obtiene el estado actual del dispositivo
   * @returns {Object} - Estado del dispositivo y la transacción
   */
  getStatus() {
    return {
      transactionStatus: this.status,
      device: this.device,
      lastError: this.lastError,
      transactionId: this.transactionId,
    };
  }

  /**
   * Actualiza el estado y notifica a los listeners
   * @param {string} newStatus - Nuevo estado
   * @private
   */
  _updateStatus(newStatus) {
    this.status = newStatus;
    if (this.callbacks.onStatusChange) {
      this.callbacks.onStatusChange(newStatus);
    }
  }

  /**
   * Notifica un error a los listeners
   * @param {string} errorMessage - Mensaje de error
   * @private
   */
  _notifyError(errorMessage) {
    if (this.callbacks.onError) {
      this.callbacks.onError(errorMessage);
    }
  }

  /**
   * Notifica éxito a los listeners
   * @param {Object} result - Resultado de la transacción
   * @private
   */
  _notifySuccess(result) {
    if (this.callbacks.onSuccess) {
      this.callbacks.onSuccess(result);
    }
  }

  /**
   * Simula una conexión con el dispositivo
   * @private
   */
  async _simulateConnection() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1500);
    });
  }

  /**
   * Simula el procesamiento de pago con tarjeta
   * @param {Object} paymentData - Datos del pago
   * @private
   */
  async _simulateCardProcessing(paymentData) {
    this._updateStatus(TRANSACTION_STATUS.WAITING_CARD);
    
    // Simular espera de inserción de tarjeta
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    this._updateStatus(TRANSACTION_STATUS.CARD_READ);
    
    // Simular lectura de tarjeta
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    this._updateStatus(TRANSACTION_STATUS.AUTHORIZING);
    
    // Simular autorización
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}

// Crear instancia singleton
const verifoneService = new VerifoneService();

export default verifoneService; 