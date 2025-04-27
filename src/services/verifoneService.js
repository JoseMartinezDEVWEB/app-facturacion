/**
 * Servicio para interactuar con terminales de pago Verifone
 * Permite detección de dispositivos, conexión y procesamiento de pagos
 */

import { message } from 'antd';

// Configuración para los terminales Verifone
const config = {
  apiUrl: process.env.REACT_APP_VERIFONE_API_URL || 'https://api.verifone.com/v1',
  apiKey: process.env.REACT_APP_VERIFONE_API_KEY || 'test_api_key',
  merchantId: process.env.REACT_APP_VERIFONE_MERCHANT_ID || 'test_merchant',
  terminalId: process.env.REACT_APP_VERIFONE_TERMINAL_ID || 'test_terminal',
};

// Tipos de conexión soportados
export const CONNECTION_TYPES = {
  USB: 'USB',
  BLUETOOTH: 'BLUETOOTH',
  NETWORK: 'NETWORK',
  SIMULATION: 'SIMULATION',
};

// Tipos de dispositivos soportados
export const DEVICE_TYPES = {
  P400: 'P400',
  VX520: 'VX520',
  CARBON: 'CARBON',
  M400: 'M400',
  P200: 'P200',
  P300: 'P300',
  E355: 'E355',
  GENERIC: 'GENERIC',
  SIMULATION: 'SIMULATION',
};

// Definición de IDs de vendedor y producto conocidos para terminales Verifone
const VERIFONE_VENDOR_IDS = {
  MAIN: 0x11CA,        // ID de fabricante principal de Verifone
  SECONDARY: 0x0B00    // ID de fabricante secundario (algunos modelos)
};

const VERIFONE_PRODUCT_IDS = {
  P400: [0x0300, 0x0301],
  CARBON: [0x0302],
  VX520: [0x0200, 0x0201],
  M400: [0x0303],
  E355: [0x0304]
};

// Mapeo de IDs a modelos
const PRODUCT_ID_TO_MODEL = {
  '0x0300': DEVICE_TYPES.P400,
  '0x0301': DEVICE_TYPES.P400,
  '0x0302': DEVICE_TYPES.CARBON,
  '0x0200': DEVICE_TYPES.VX520,
  '0x0201': DEVICE_TYPES.VX520,
  '0x0303': DEVICE_TYPES.M400,
  '0x0304': DEVICE_TYPES.E355
};

// Filtros USB para buscar dispositivos
const USB_FILTERS = [
  // Verifone P400
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0300 },
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0301 },
  // Verifone Carbon
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0302 },
  // Verifone VX520
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0200 },
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0201 },
  // Verifone M400
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0303 },
  // Verifone E355
  { vendorId: VERIFONE_VENDOR_IDS.MAIN, productId: 0x0304 },
  // IDs secundarios (algunos modelos más antiguos)
  { vendorId: VERIFONE_VENDOR_IDS.SECONDARY, productId: 0x0001 }
];

// UUID del servicio Bluetooth para terminales Verifone
const VERIFONE_BLUETOOTH_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';

// Clase para manejar los terminales Verifone
class VerifoneService {
  constructor() {
    // Estado interno
    this.detectedDevices = [];
    this.activeDevice = null;
    this.currentTransaction = null;
    this.webUsbSupported = typeof navigator !== 'undefined' && 
                          navigator.usb !== undefined;
    
    // Callbacks por defecto (pueden ser sobrescritos)
    this.callbacks = {
      onDeviceDetected: (device) => console.log('Dispositivo detectado:', device),
      onDeviceConnected: (device) => console.log('Dispositivo conectado:', device),
      onDeviceDisconnected: (device) => console.log('Dispositivo desconectado:', device),
      onTransactionUpdate: (update) => console.log('Actualización de transacción:', update),
      onTransactionComplete: (result) => console.log('Transacción completada:', result),
      onError: (error) => console.error('Error en VerifoneService:', error)
    };
    
    // Inicializar el servicio
    this._initialize();
  }
  
  /**
   * Inicializa el servicio y configura listeners
   * @private
   */
  _initialize() {
    // Verificar si el navegador soporta WebUSB
    if (!this.webUsbSupported) {
      console.warn('WebUSB no está soportado en este navegador');
      return;
    }
    
    // Configurar los listeners de eventos USB
    this._setupUsbListeners();
    
    // Buscar dispositivos previamente autorizados
    this._findUsbDevices()
      .then(devices => {
        console.log(`Se encontraron ${devices.length} dispositivos Verifone autorizados`);
      })
      .catch(error => {
        console.error('Error al buscar dispositivos USB:', error);
      });
  }
  
  /**
   * Configura los listeners para eventos de dispositivos USB
   * @private
   */
  _setupUsbListeners() {
    if (!this.webUsbSupported) return;
    
    // Evento: dispositivo conectado
    navigator.usb.addEventListener('connect', event => {
      console.log('Evento USB connect:', event.device);
      
      if (this._isVerifoneDevice(event.device)) {
        this._handleUsbDeviceConnected(event.device);
        message.success(`Terminal Verifone conectado`);
      }
    });
    
    // Evento: dispositivo desconectado
    navigator.usb.addEventListener('disconnect', event => {
      console.log('Evento USB disconnect:', event.device);
      
      // Buscar el dispositivo en nuestra lista
      const deviceIndex = this.detectedDevices.findIndex(
        device => device.rawDevice === event.device
      );
      
      if (deviceIndex >= 0) {
        const device = this.detectedDevices[deviceIndex];
        
        // Actualizar estado
        device.connected = false;
        device.lastDisconnected = new Date();
        
        // Notificar desconexión
        message.warning(`Terminal ${device.name} desconectado`);
        this.callbacks.onDeviceDisconnected(device);
      }
    });
    
    console.log('Listeners de eventos USB configurados');
  }
  
  /**
   * Evalúa si el navegador soporta la API Web USB
   * @returns {boolean} True si el navegador soporta Web USB
   */
  _isWebUsbSupported() {
    return !!navigator.usb;
  }
  
  /**
   * Evalúa si el navegador soporta la API Web Bluetooth
   * @returns {boolean} True si el navegador soporta Web Bluetooth
   */
  _isWebBluetoothSupported() {
    return !!navigator.bluetooth;
  }
  
  /**
   * Verifica si el navegador soporta detección de hardware físico
   * @returns {boolean} True si el navegador soporta al menos un método de detección
   */
  canDetectHardware() {
    return this.webUsbSupported || this._isWebBluetoothSupported();
  }
  
  /**
   * Inicializa la detección de dispositivos
   * @private
   */
  _initDeviceDetection() {
    // Registrar eventos para detección de dispositivos USB
    if (this.webUsbSupported) {
      // Escuchar eventos de conexión/desconexión
      navigator.usb.addEventListener('connect', (event) => {
        console.log('Dispositivo USB conectado', event);
        this._handleUsbDeviceConnected(event.device);
      });
      
      navigator.usb.addEventListener('disconnect', (event) => {
        console.log('Dispositivo USB desconectado', event);
        this._handleUsbDeviceDisconnected(event.device);
      });
    }
    
    // Añadir un dispositivo de simulación siempre disponible
    this.detectedDevices.push({
      id: 'simulation-device-1',
      name: 'Verifone Simulador',
      model: 'P400',
      type: CONNECTION_TYPES.SIMULATION,
      connected: false,
      deviceType: DEVICE_TYPES.P400,
    });
  }
  
  /**
   * Maneja la conexión de un dispositivo USB
   * @param {USBDevice} device - Dispositivo USB conectado
   * @private
   */
  _handleUsbDeviceConnected(device) {
    if (!device) return;
    
    // Verificar si ya tenemos este dispositivo en la lista
    const existingDeviceIndex = this.detectedDevices.findIndex(
      d => d.rawDevice === device
    );
    
    if (existingDeviceIndex >= 0) {
      // Actualizar el dispositivo existente
      this.detectedDevices[existingDeviceIndex].rawDevice = device;
      this.detectedDevices[existingDeviceIndex].lastDetected = new Date();
      console.log('Dispositivo actualizado:', this.detectedDevices[existingDeviceIndex]);
      return;
    }
    
    // Crear objeto de dispositivo
    const deviceModel = this._determineDeviceModel(device);
    const newDevice = {
      id: device.serialNumber || `verifone-${Date.now()}`,
      type: CONNECTION_TYPES.USB,
      name: deviceModel || 'Terminal Verifone',
      model: deviceModel,
      rawDevice: device,
      connected: false,
      lastDetected: new Date()
    };
    
    // Agregar a la lista de dispositivos
    this.detectedDevices.push(newDevice);
    
    // Notificar nuevo dispositivo
    console.log('Nuevo dispositivo Verifone detectado:', newDevice);
    this.callbacks.onDeviceDetected(newDevice);
  }
  
  /**
   * Maneja la desconexión de un dispositivo USB
   * @param {USBDevice} device - Dispositivo USB desconectado
   * @private
   */
  _handleUsbDeviceDisconnected(device) {
    const deviceId = `usb-${device.serialNumber || device.productId}`;
    
    // Actualizar la lista de dispositivos
    const deviceIndex = this.detectedDevices.findIndex(d => d.id === deviceId);
    if (deviceIndex !== -1) {
      this.detectedDevices.splice(deviceIndex, 1);
      
      // Notificar a los listeners
      this.callbacks.onDeviceDetected(this.detectedDevices);
      
      // Si es el dispositivo actual, desconectar
      if (this.activeDevice && this.activeDevice.id === deviceId) {
        this.disconnectDevice().catch(console.error);
      }
    }
  }
  
  /**
   * Maneja dispositivos Bluetooth detectados
   * @param {BluetoothDevice} device - Dispositivo Bluetooth detectado
   * @private 
   */
  _handleBluetoothDeviceDetected(device) {
    const deviceId = `bt-${device.id}`;
    
    // Verificar si ya conocemos este dispositivo
    if (!this.detectedDevices.find(d => d.id === deviceId)) {
      // Determinar tipo de dispositivo basado en el nombre
      const deviceType = this._determineBluetoothDeviceType(device);
      
      const newDevice = {
        id: deviceId,
        name: device.name || 'Terminal Bluetooth',
        model: this._determineBluetoothDeviceModel(device),
        type: CONNECTION_TYPES.BLUETOOTH,
        connected: false,
        deviceType,
        rawDevice: device, // Guardar el objeto de dispositivo original
      };
      
      this.detectedDevices.push(newDevice);
      
      // Notificar a los listeners
      this.callbacks.onDeviceDetected(this.detectedDevices);
    }
  }
  
  /**
   * Determina el tipo de dispositivo Bluetooth basado en su nombre
   * @param {BluetoothDevice} device - Dispositivo Bluetooth
   * @returns {string} Tipo de dispositivo
   * @private
   */
  _determineBluetoothDeviceType(device) {
    const name = (device.name || '').toUpperCase();
    
    if (name.includes('P400')) return DEVICE_TYPES.P400;
    if (name.includes('M400')) return DEVICE_TYPES.M400;
    if (name.includes('P200')) return DEVICE_TYPES.P200;
    if (name.includes('P300')) return DEVICE_TYPES.P300;
    if (name.includes('VX520')) return DEVICE_TYPES.VX520;
    if (name.includes('CARBON')) return DEVICE_TYPES.CARBON;
    if (name.includes('E355')) return DEVICE_TYPES.E355;
    
    return DEVICE_TYPES.GENERIC;
  }
  
  /**
   * Determina el modelo del dispositivo Bluetooth
   * @param {BluetoothDevice} device - Dispositivo Bluetooth
   * @returns {string} Modelo del dispositivo
   * @private
   */
  _determineBluetoothDeviceModel(device) {
    const deviceType = this._determineBluetoothDeviceType(device);
    return deviceType !== DEVICE_TYPES.GENERIC ? deviceType : 'Generic Terminal';
  }
  
  /**
   * Determina si un dispositivo USB es un terminal Verifone
   * @param {USBDevice} device - Dispositivo USB
   * @returns {boolean} True si es un dispositivo Verifone
   * @private
   */
  _isVerifoneDevice(device) {
    if (!device) return false;
    
    // Verificar por vendorId
    if (device.vendorId === VERIFONE_VENDOR_IDS.MAIN) {
      return true;
    }
    
    // Verificar coincidencia con algún filtro
    return USB_FILTERS.some(filter => 
      filter.vendorId === device.vendorId && 
      (!filter.productId || filter.productId === device.productId)
    );
  }
  
  /**
   * Determina el modelo del dispositivo basado en sus características
   * @param {USBDevice} device - Dispositivo USB
   * @returns {string} Modelo del dispositivo
   * @private
   */
  _determineDeviceModel(device) {
    if (!device) return null;
    
    // Extraer los identificadores
    const vendorId = device.vendorId;
    const productId = device.productId;
    
    // Buscar en el mapeo de IDs de producto
    if (PRODUCT_ID_TO_MODEL[productId]) {
      return PRODUCT_ID_TO_MODEL[productId];
    }
    
    // Si no encontramos una coincidencia exacta, verificar por vendorId
    if (vendorId === VERIFONE_VENDOR_IDS.MAIN) {
      return 'Verifone Terminal';
    }
    
    return null;
  }
  
  /**
   * Determina el tipo de dispositivo basado en el modelo
   * @param {USBDevice} device - Dispositivo USB
   * @returns {string} Tipo de dispositivo
   * @private
   */
  _determineDeviceType(device) {
    const model = this._determineDeviceModel(device);
    
    switch (model) {
      case 'P400':
        return DEVICE_TYPES.P400;
      case 'P200':
        return DEVICE_TYPES.P200;
      case 'P300':
        return DEVICE_TYPES.P300;
      case 'M400':
        return DEVICE_TYPES.M400;
      case 'Carbon':
        return DEVICE_TYPES.CARBON;
      case 'VX520':
        return DEVICE_TYPES.VX520;
      case 'E355':
        return DEVICE_TYPES.E355;
      default:
        return DEVICE_TYPES.GENERIC;
    }
  }
  
  /**
   * Busca dispositivos conectados
   * @returns {Promise<Array>} Lista de dispositivos detectados
   */
  async findConnectedDevices() {
    this.callbacks.onStatusChange(TRANSACTION_STATUS.DEVICE_DETECTION);
    
    try {
      // Limpiar dispositivos que no sean de simulación
      this.detectedDevices = this.detectedDevices.filter(device => 
        device.type === CONNECTION_TYPES.SIMULATION
      );
      
      // Buscar dispositivos USB si está soportado
      if (this.webUsbSupported) {
        await this._findUsbDevices();
      }
      
      // Notificar a los listeners
      this.callbacks.onDeviceDetected(this.detectedDevices);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.READY);
      
      return this.detectedDevices;
    } catch (error) {
      console.error('Error detectando dispositivos', error);
      this.callbacks.onError('Error al detectar dispositivos: ' + error.message);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.ERROR);
      throw error;
    }
  }
  
  /**
   * Busca dispositivos USB Verifone previamente autorizados
   * @private
   * @returns {Promise<Array>} Lista de dispositivos encontrados
   */
  async _findUsbDevices() {
    if (!this.webUsbSupported) {
      return [];
    }
    
    try {
      // Obtener dispositivos USB previamente autorizados
      const devices = await navigator.usb.getDevices();
      console.log('Dispositivos USB autorizados:', devices);
      
      // Filtrar dispositivos Verifone
      const verifoneDevices = devices.filter(device => this._isVerifoneDevice(device));
      
      // Agregar dispositivos a la lista
      for (const device of verifoneDevices) {
        await this._handleUsbDeviceConnected(device);
      }
      
      return this.detectedDevices.filter(d => d.type === CONNECTION_TYPES.USB);
    } catch (error) {
      console.error('Error al buscar dispositivos USB:', error);
      return [];
    }
  }
  
  /**
   * Solicita permiso para acceder a un dispositivo USB Verifone
   * @returns {Promise<Object>} Dispositivo conectado
   */
  async requestUsbDevice() {
    if (!this.webUsbSupported) {
      throw new Error('WebUSB no está soportado en este navegador');
    }
    
    try {
      // Solicitar dispositivo al usuario con los filtros de Verifone
      const filters = USB_FILTERS;
      
      message.info('Seleccione su terminal de pago Verifone');
      const device = await navigator.usb.requestDevice({ filters });
      
      // Verificar si es un dispositivo Verifone válido
      if (!this._isVerifoneDevice(device)) {
        throw new Error('El dispositivo seleccionado no es un terminal Verifone compatible');
      }
      
      // Agregar a la lista de dispositivos
      await this._handleUsbDeviceConnected(device);
      
      // Devolver el dispositivo agregado
      return this.detectedDevices.find(d => d.rawDevice === device);
    } catch (error) {
      // Si el usuario cancela, se lanza un error DOMException
      if (error.name === 'NotFoundError') {
        message.warning('No se seleccionó ningún dispositivo');
        return null;
      }
      
      // Otros errores
      message.error(`Error al solicitar dispositivo USB: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Solicita acceso a dispositivos Bluetooth
   * @returns {Promise<Array>} Lista de dispositivos detectados
   */
  async requestBluetoothDevices() {
    if (!this._isWebBluetoothSupported()) {
      throw new Error('Web Bluetooth no soportado en este navegador');
    }
    
    try {
      this.callbacks.onStatusChange(TRANSACTION_STATUS.DEVICE_DETECTION);
      
      // Solicitar dispositivo Bluetooth
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [VERIFONE_BLUETOOTH_SERVICE_UUID] },
          { namePrefix: 'Verifone' },
          { namePrefix: 'PAX' } // Algunos terminales Verifone usan este prefijo
        ],
        optionalServices: ['battery_service', 'device_information']
      });
      
      console.log('Dispositivo Bluetooth autorizado:', device);
      
      // Procesar el dispositivo detectado
      this._handleBluetoothDeviceDetected(device);
      
      this.callbacks.onStatusChange(TRANSACTION_STATUS.READY);
      return this.detectedDevices;
    } catch (error) {
      // Si el usuario cancela, no es realmente un error
      if (error.name === 'NotFoundError') {
        this.callbacks.onStatusChange(TRANSACTION_STATUS.READY);
        return this.detectedDevices;
      }
      
      console.error('Error solicitando dispositivos Bluetooth', error);
      this.callbacks.onError('Error al solicitar dispositivos Bluetooth: ' + error.message);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.ERROR);
      throw error;
    }
  }
  
  /**
   * Conecta con un dispositivo específico
   * @param {string} deviceId - ID del dispositivo
   * @returns {Promise<Object>} Dispositivo conectado
   */
  async connectToDevice(deviceId) {
    try {
      this.callbacks.onStatusChange(TRANSACTION_STATUS.CONNECTING);
      
      // Buscar el dispositivo en la lista
      const device = this.detectedDevices.find(d => d.id === deviceId);
      if (!device) {
        throw new Error(`Dispositivo ${deviceId} no encontrado`);
      }
      
      console.log('Conectando a dispositivo:', device);
      
      // Para dispositivos reales, establecer la conexión física
      if (device.type === CONNECTION_TYPES.USB) {
        await this._connectToUsbDevice(device);
      } else if (device.type === CONNECTION_TYPES.BLUETOOTH) {
        await this._connectToBluetoothDevice(device);
      } else if (device.type === CONNECTION_TYPES.NETWORK) {
        await this._connectToNetworkDevice(device);
      }
      
      // Marcar como conectado
      device.connected = true;
      this.activeDevice = device;
      
      // Notificar conexión exitosa
      this.callbacks.onStatusChange(TRANSACTION_STATUS.CONNECTED);
      
      return device;
    } catch (error) {
      console.error('Error conectando con dispositivo', error);
      this.callbacks.onError('Error al conectar con el dispositivo: ' + error.message);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.ERROR);
      throw error;
    }
  }
  
  /**
   * Conecta con un dispositivo USB
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<boolean>} - Resultado de la conexión
   * @private
   */
  async _connectToUsbDevice(device) {
    if (!device || !device.rawDevice) {
      throw new Error('Dispositivo USB no válido');
    }

    try {
      const usbDevice = device.rawDevice;
      
      // Verificar si ya está abierto
      if (usbDevice.opened) {
        console.log('El dispositivo ya está abierto');
        return true;
      }
      
      // Abrir conexión con el dispositivo
      await usbDevice.open();
      
      // Reclamar la interfaz 0 (típica para terminales de pago)
      // Nota: Puede necesitar ajustes según el modelo específico
      if (usbDevice.configuration === null) {
        await usbDevice.selectConfiguration(1);
      }
      
      try {
        await usbDevice.claimInterface(0);
        console.log('Interfaz reclamada correctamente');
      } catch (error) {
        console.warn('Error al reclamar interfaz:', error);
        // Algunos dispositivos pueden requerir una interfaz diferente
        // o pueden estar ya reclamados, continuar de todos modos
      }
      
      // Actualizar estado del dispositivo
      device.connected = true;
      message.success(`Conectado a terminal ${device.name}`);
      
      // Llamar a callback de cambio de estado
      this.callbacks.onStatusChange({
        status: 'connected',
        device: device
      });
      
      return true;
    } catch (error) {
      console.error('Error al conectar con dispositivo USB:', error);
      message.error(`Error al conectar con terminal: ${error.message}`);
      
      // Notificar error
      this.callbacks.onError({
        message: `Error de conexión: ${error.message}`,
        device: device,
        error: error
      });
      
      return false;
    }
  }
  
  /**
   * Conecta con un dispositivo Bluetooth
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<void>}
   * @private
   */
  async _connectToBluetoothDevice(device) {
    if (!device.rawDevice) {
      throw new Error('Información del dispositivo Bluetooth no disponible');
    }
    
    try {
      const btDevice = device.rawDevice;
      
      // Conectar al GATT server
      const server = await btDevice.gatt.connect();
      
      // Almacenar para uso posterior
      device.gattServer = server;
      
      console.log('Dispositivo Bluetooth conectado exitosamente', server);
    } catch (error) {
      console.error('Error conectando dispositivo Bluetooth', error);
      throw new Error(`Error al conectar Bluetooth: ${error.message}`);
    }
  }
  
  /**
   * Conecta con un dispositivo de red
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<void>}
   * @private
   */
  async _connectToNetworkDevice(device) {
    // Implementación para dispositivos de red IP
    console.log('Conexión a dispositivo de red simulada');
    // Aquí iría la lógica real de conexión por socket/API
  }
  
  /**
   * Desconecta el dispositivo actual
   * @returns {Promise<void>}
   */
  async disconnectDevice() {
    if (!this.activeDevice) {
      return;
    }
    
    try {
      const device = this.activeDevice;
      
      // Desconectar según el tipo de dispositivo
      if (device.type === CONNECTION_TYPES.USB && device.rawDevice) {
        await this._disconnectUsbDevice(device);
      } else if (device.type === CONNECTION_TYPES.BLUETOOTH && device.rawDevice) {
        await this._disconnectBluetoothDevice(device);
      } else if (device.type === CONNECTION_TYPES.NETWORK) {
        await this._disconnectNetworkDevice(device);
      }
      
      // Actualizar estado
      this.activeDevice.connected = false;
      this.activeDevice = null;
      
      // Notificar desconexión
      this.callbacks.onStatusChange(TRANSACTION_STATUS.READY);
    } catch (error) {
      console.error('Error desconectando dispositivo', error);
      this.callbacks.onError('Error al desconectar el dispositivo: ' + error.message);
      
      // Resetear estado a pesar del error
      if (this.activeDevice) {
        this.activeDevice.connected = false;
        this.activeDevice = null;
      }
      
      this.callbacks.onStatusChange(TRANSACTION_STATUS.READY);
    }
  }
  
  /**
   * Desconecta un dispositivo USB
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<void>}
   * @private
   */
  async _disconnectUsbDevice(device) {
    if (!device || !device.rawDevice) {
      return;
    }
    
    const usbDevice = device.rawDevice;
    
    try {
      // Solo intentar cerrar si está abierto
      if (usbDevice.opened) {
        // Liberar interfaces
        for (let i = 0; i < usbDevice.configuration.interfaces.length; i++) {
          try {
            await usbDevice.releaseInterface(i);
          } catch (err) {
            console.warn(`No se pudo liberar interfaz ${i}:`, err);
          }
        }
        
        // Cerrar dispositivo
        await usbDevice.close();
      }
    } catch (error) {
      console.error('Error al desconectar dispositivo USB:', error);
      // No relanzar el error, mejor manejar la desconexión de forma silenciosa
    }
  }
  
  /**
   * Desconecta un dispositivo Bluetooth
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<void>}
   * @private
   */
  async _disconnectBluetoothDevice(device) {
    try {
      const btDevice = device.rawDevice;
      
      // Desconectar GATT
      if (btDevice.gatt && btDevice.gatt.connected) {
        btDevice.gatt.disconnect();
      }
      
      console.log('Dispositivo Bluetooth desconectado exitosamente');
    } catch (error) {
      console.error('Error desconectando dispositivo Bluetooth', error);
      throw error;
    }
  }
  
  /**
   * Desconecta un dispositivo de red
   * @param {Object} device - Objeto de dispositivo
   * @returns {Promise<void>}
   * @private
   */
  async _disconnectNetworkDevice(device) {
    console.log('Desconexión de dispositivo de red simulada');
    // Aquí iría la lógica real de desconexión por socket/API
  }
  
  /**
   * Procesa un pago con el dispositivo conectado
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} Resultado de la transacción
   */
  async processPayment(paymentData) {
    if (!this.activeDevice) {
      throw new Error('No hay dispositivo conectado');
    }
    
    try {
      this.callbacks.onStatusChange(TRANSACTION_STATUS.PROCESSING);
      
      // Preparar datos de transacción
      const transactionData = {
        amount: paymentData.amount,
        reference: paymentData.reference || this._generateTransactionId(),
        timestamp: new Date().toISOString(),
        deviceId: this.activeDevice.id,
        deviceName: this.activeDevice.name,
        deviceType: this.activeDevice.deviceType,
      };
      
      // Procesar según tipo de dispositivo
      let result;
      
      if (this.activeDevice.type === CONNECTION_TYPES.SIMULATION) {
        // Usar flujo simulado
        result = await this._simulatePaymentFlow();
      } else {
        // Usar flujo para dispositivo real
        result = await this._processRealPayment(transactionData);
      }
      
      // Guardar transacción y notificar éxito
      this.currentTransaction = result;
      this.callbacks.onSuccess(result);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.COMPLETED);
      
      return result;
    } catch (error) {
      console.error('Error procesando pago', error);
      this.callbacks.onError('Error al procesar el pago: ' + error.message);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.ERROR);
      throw error;
    }
  }
  
  /**
   * Procesa un pago en un dispositivo real
   * @param {Object} transactionData - Datos de la transacción
   * @returns {Promise<Object>} Resultado de la transacción
   * @private
   */
  async _processRealPayment(transactionData) {
    const device = this.activeDevice;
    
    // Por ahora, simular el flujo pero con tiempos más realistas
    // para un dispositivo real físico
    return this._simulatePaymentFlow(true);
    
    // NOTA: Aquí iría la implementación real que comunicaría
    // con el dispositivo físico usando USB, Bluetooth o red
  }
  
  /**
   * Simula un flujo de pago
   * @param {boolean} isRealDevice - Si es un dispositivo real o simulado
   * @returns {Promise<Object>} Resultado simulado
   * @private
   */
  async _simulatePaymentFlow(isRealDevice = false) {
    // Definir tiempos de espera variables según si es dispositivo real o simulación
    const waitTimes = isRealDevice
      ? {
          waitCard: 1000 + Math.random() * 2000,
          readCard: 2000 + Math.random() * 1000,
          authorize: 3000 + Math.random() * 2000
        }
      : {
          waitCard: 500 + Math.random() * 1000,
          readCard: 800 + Math.random() * 800,
          authorize: 1000 + Math.random() * 1500
        };
    
    // Simular espera de tarjeta
    this.callbacks.onStatusChange(TRANSACTION_STATUS.WAITING_CARD);
    await new Promise(resolve => setTimeout(resolve, waitTimes.waitCard));
    
    // Simular lectura de tarjeta
    this.callbacks.onStatusChange(TRANSACTION_STATUS.CARD_READ);
    await new Promise(resolve => setTimeout(resolve, waitTimes.readCard));
    
    // Simular autorización
    this.callbacks.onStatusChange(TRANSACTION_STATUS.AUTHORIZING);
    await new Promise(resolve => setTimeout(resolve, waitTimes.authorize));
    
    // Generar resultado
    return {
      transactionId: this._generateTransactionId(),
      authCode: this._getRandomAuthCode(),
      timestamp: new Date().toISOString(),
      amount: 100.00, // Monto de ejemplo
      reference: 'REF' + this._getRandomDigits(6),
      last4: this._getRandomDigits(4),
      cardType: ['VISA', 'MASTERCARD', 'AMEX'][Math.floor(Math.random() * 3)],
      status: 'APPROVED'
    };
  }
  
  /**
   * Cancela la transacción en curso
   * @returns {Promise<void>}
   */
  async cancelTransaction() {
    if (!this.activeDevice) {
      throw new Error('No hay dispositivo conectado');
    }
    
    try {
      // Verificar si hay una transacción en curso
      if (![
        TRANSACTION_STATUS.PROCESSING,
        TRANSACTION_STATUS.WAITING_CARD,
        TRANSACTION_STATUS.CARD_READ,
        TRANSACTION_STATUS.AUTHORIZING
      ].includes(this.callbacks.onStatusChange.currentStatus)) {
        throw new Error('No hay transacción activa para cancelar');
      }
      
      // Enviar comando de cancelación al dispositivo
      if (this.activeDevice.type === CONNECTION_TYPES.USB) {
        await this._cancelUsbTransaction();
      } else if (this.activeDevice.type === CONNECTION_TYPES.BLUETOOTH) {
        await this._cancelBluetoothTransaction();
      } else if (this.activeDevice.type === CONNECTION_TYPES.NETWORK) {
        await this._cancelNetworkTransaction();
      }
      
      // Actualizar estado
      this.callbacks.onStatusChange(TRANSACTION_STATUS.CANCELLED);
    } catch (error) {
      console.error('Error cancelando transacción', error);
      this.callbacks.onError('Error al cancelar la transacción: ' + error.message);
      this.callbacks.onStatusChange(TRANSACTION_STATUS.ERROR);
      throw error;
    }
  }
  
  /**
   * Cancela una transacción en dispositivo USB
   * @returns {Promise<void>}
   * @private
   */
  async _cancelUsbTransaction() {
    // Implementación para cancelación en USB
    console.log('Cancelación de transacción USB');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Cancela una transacción en dispositivo Bluetooth
   * @returns {Promise<void>}
   * @private
   */
  async _cancelBluetoothTransaction() {
    // Implementación para cancelación en Bluetooth
    console.log('Cancelación de transacción Bluetooth');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Cancela una transacción en dispositivo de red
   * @returns {Promise<void>}
   * @private
   */
  async _cancelNetworkTransaction() {
    // Implementación para cancelación en red
    console.log('Cancelación de transacción de red');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Genera un ID de transacción único
   * @returns {string} ID de transacción
   * @private
   */
  _generateTransactionId() {
    const timestamp = Date.now().toString(36);
    const randomChars = Math.random().toString(36).substring(2, 8);
    return `TX-${timestamp}-${randomChars}`.toUpperCase();
  }
  
  /**
   * Genera una cadena de dígitos aleatorios
   * @param {number} length - Longitud de la cadena
   * @returns {string} Cadena de dígitos
   * @private
   */
  _getRandomDigits(length) {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += Math.floor(Math.random() * 10).toString();
    }
    return result;
  }
  
  /**
   * Genera un código de autorización aleatorio
   * @returns {string} Código de autorización
   * @private
   */
  _getRandomAuthCode() {
    // Formato típico: 6 caracteres alfanuméricos
    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Exportar instancia única del servicio
const verifoneService = new VerifoneService();
export default verifoneService; 