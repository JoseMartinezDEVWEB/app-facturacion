/* eslint-disable no-prototype-builtins */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CreditCard, DollarSign, ArrowRightLeft, Plus, Minus, X, AlertCircle, Scale } from 'lucide-react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import InvoicePrintTemplate from './InvoicePrintTemplate';
import CarritoCompra from './CarritoCompra';
import PrintConfirmationModal from './PrintConfirmationModal';
import WeightProductInput from './WeightProductInput';
import ProductWeightDisplay from './ProductWeightDisplay';
import { invoiceApi } from '../../config/apis';
import BuscarProduct from './BuscarProduct';
import InvoicePreviewModal from './InvoicePreviewModal';
import BusinessInfoSettings from './BusinessInfoSettings';

const API_URL = 'http://localhost:4000/api';

// Ajustar configuración de axios según las capacidades del backend
// Si el backend no soporta credenciales, no debemos habilitarlas
axios.defaults.withCredentials = false;

// Función mejorada para obtener token de autenticación
const getAuthToken = () => {
  // Intentar obtener el token con diferentes claves comunes
  const possibleKeys = ['auth_token', 'token', 'access_token', 'jwt_token', 'authToken'];
  let token = null;
  
  // Buscar en localStorage con diferentes claves
  for (const key of possibleKeys) {
    const storedToken = localStorage.getItem(key);
    if (storedToken) {
      console.log(`Token encontrado en localStorage con clave: ${key}`);
      token = storedToken;
      break;
    }
  }
  
  // Si no se encuentra en localStorage, intentar obtener desde sessionStorage
  if (!token) {
    for (const key of possibleKeys) {
      const storedToken = sessionStorage.getItem(key);
      if (storedToken) {
        console.log(`Token encontrado en sessionStorage con clave: ${key}`);
        token = storedToken;
        break;
      }
    }
  }
  
  // Si aún no hay token, verificar si hay cookies con el token
  if (!token && document.cookie) {
    console.log('Buscando token en cookies...');
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (possibleKeys.includes(name)) {
        console.log(`Token encontrado en cookies con nombre: ${name}`);
        token = decodeURIComponent(value);
        break;
      }
    }
  }
  
  if (!token) {
    // console.warn('No se encontró token de autenticación en ninguna ubicación común');
  } else {
    console.log('Token encontrado, formato:', token.substring(0, 15) + '...');
  }
  
  return token;
};

// Variables globales para el manejo de refreshing
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Función auxiliar para obtener valor de una cookie
function getCookieValue(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Configuración del cliente axios con interceptores mejorados
axios.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    // Formato correcto para enviar el token
    if (token.startsWith('Bearer ')) {
      config.headers.Authorization = token;
    } else if (token.startsWith('Basic ')) {
      config.headers.Authorization = token;
    } else if (token.startsWith('JWT ')) {
      config.headers.Authorization = token;
    } else {
      // Asumir que es un token JWT sin prefijo
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Token configurado en cabecera:', config.headers.Authorization.substring(0, 20) + '...');
  } else {
    // Verificar si el token está disponible en una cookie específica
    const cookieValue = getCookieValue('auth_token') || getCookieValue('token');
    if (cookieValue) {
      config.headers.Authorization = `Bearer ${cookieValue}`;
      console.log('Token configurado desde cookie:', config.headers.Authorization.substring(0, 20) + '...');
    }
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Interceptor de respuesta con manejo de refresh token
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config || {};
    const url = originalRequest.url || '';
    // No aplicar refresh token en endpoints de autenticación
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token') || url.includes('/auth/check-session')) {
      return Promise.reject(error);
    }
    
    // Solo intentar refresh si es error 401 y no hemos intentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya estamos en proceso de refresh, encolar esta petición
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return axios(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }
      
      // Marcar esta petición como retry y activar flag de refreshing
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        // Intentar obtener un nuevo token
        const refreshTokenValue = localStorage.getItem('refreshToken');
        if (!refreshTokenValue) {
          throw new Error('No hay refresh token disponible');
        }
        
        console.log('Intentando refrescar token...');
        const { data } = await axios.post(`${API_URL}/auth/refresh-token`, {
          refreshToken: refreshTokenValue
        }, {
          headers: {
            Authorization: null // No enviar el token expirado
          }
        });
        
        // Guardar nuevo token y actualizar configuración
        if (data && data.token) {
          console.log('Token refrescado exitosamente');
          localStorage.setItem('token', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          
          // Procesar cola con éxito
          processQueue(null, data.token);
          
          // Reintentar petición original con nuevo token
          originalRequest.headers['Authorization'] = `Bearer ${data.token}`;
          return axios(originalRequest);
        } else {
          throw new Error('Respuesta inválida al refrescar token');
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        
        // Limpiar tokens solo si hay un error real de autenticación
        if (refreshError.response?.status === 401 || 
            refreshError.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          
          // Procesar cola con error
          processQueue(refreshError, null);
          
          // Opcional: redirigir a login solo si es necesario
          console.warn('Sesión expirada. Considere iniciar sesión nuevamente.');
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    // Si no es 401 o ya intentamos refresh, simplemente rechazar
    return Promise.reject(error);
  }
);

// Custom hook para manejar productos
const useProducts = () => {
  const [productError, setProductError] = useState('');
  
  const fetchProductByBarcode = useCallback(async (barcode) => {
    try {
      if (!barcode?.trim()) return null;
      
      console.log('Buscando producto por código:', barcode);
      const { data } = await axios.get(`${API_URL}/products/barcode/${barcode}`);
      return data || null;
    } catch (error) {
      console.error('Error al buscar por código de barras:', error);
      setProductError(`No se pudo encontrar el producto: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }, []);

  // Función modificada para evitar el error 500
  const fetchProductByName = useCallback(async (name) => {
    try {
      if (!name?.trim()) return null;
      
      console.log('Buscando producto por nombre:', name);
      
      // SOLUCIÓN PARA EVITAR ERROR 500: Usar método alternativo en lugar del endpoint problemático
      try {
        // Obtener todos los productos y filtrar en el cliente
        const allProductsResponse = await axios.get(`${API_URL}/products`, {
          timeout: 15000, // Mayor timeout para obtener todos los productos
        });
        
        console.log('Obteniendo todos los productos para búsqueda local');
        
        // Extraer productos según la estructura de respuesta
        let allProducts = [];
        if (Array.isArray(allProductsResponse.data)) {
          allProducts = allProductsResponse.data;
        } else if (allProductsResponse.data && Array.isArray(allProductsResponse.data.products)) {
          allProducts = allProductsResponse.data.products;
        } else if (allProductsResponse.data && allProductsResponse.data.data && Array.isArray(allProductsResponse.data.data)) {
          allProducts = allProductsResponse.data.data;
        }
        
        // Filtrar productos localmente
        const searchTermLower = name.trim().toLowerCase();
        const filteredProducts = allProducts.filter(product => 
          product.name?.toLowerCase().includes(searchTermLower)
        );
        
        console.log(`Encontrados ${filteredProducts.length} productos mediante filtrado local`);
        
        // Devolver en formato adecuado para useProducts
        return { products: filteredProducts };
      } catch (err) {
        console.error('Error en búsqueda alternativa:', err);
        throw err; // Re-lanzar para manejo de errores principal
      }
    } catch (error) {
      console.error('Error al buscar por nombre:', error);
      setProductError(`No se pudo encontrar el producto: ${error.response?.data?.message || error.message}`);
      return null;
    }
  }, []);

  return { fetchProductByBarcode, fetchProductByName, productError };
};

const POSSystem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [applyTax, setApplyTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashReceived, setCashReceived] = useState('');
  const [currentProduct, setCurrentProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualQuantity, setManualQuantity] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [customer, setCustomer] = useState({
    name: 'Cliente General',
    email: '',
    phone: '',
    address: ''
  });

  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [businessInfo, setBusinessInfo] = useState(() => {
    // Intentar cargar la configuración guardada
    const savedConfig = localStorage.getItem('business_invoice_config');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error('Error al cargar configuración de negocio:', error);
      }
    }
    
    // Configuración por defecto
    return {
      name: "Mi Negocio",
      address: "Dirección del Negocio",
      phone: "123-456-7890",
      rnc: "123456789",
      slogan: "¡Calidad y servicio garantizado!",
      currency: "RD$",
      taxRate: 18,
      includeTax: true,
      footer: "¡Gracias por su compra!",
      additionalComment: ""
    };
  });

  // Cargar configuración de impresión desde localStorage
  const [printConfig, setPrintConfig] = useState(() => {
    // Intentar cargar la configuración guardada
    const savedConfig = localStorage.getItem('print_configuration_settings');
    if (savedConfig) {
      try {
        return JSON.parse(savedConfig);
      } catch (error) {
        console.error('Error al cargar configuración de impresión:', error);
      }
    }
    
    // Configuración por defecto
    return {
      paperSize: 'receipt',
      paperWidth: 80,
      paperHeight: 210,
      paperOrientation: 'portrait',
      includeTax: true,
      taxRate: 18,
      showCashier: true,
      printCopies: 1,
      marginTop: 5,
      marginRight: 5,
      marginBottom: 5,
      marginLeft: 5
    };
  });
  
  // Estado para el modal de impresión
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [printAttemptStatus, setPrintAttemptStatus] = useState('idle');
  
  const printRef = useRef();
  const { fetchProductByBarcode, fetchProductByName, productError } = useProducts();

   // Manejadores para los nuevos modales
  const handleOpenSettings = (type = 'business') => {
    if (type === 'business') {
      setSettingsModalOpen(true);
    } else if (type === 'print') {
      setConfigModalOpen(true);
    }
  };
  
  const handleSaveSettings = (newSettings) => {
    // Determinar qué tipo de configuración se está guardando
    if (newSettings.hasOwnProperty('paperSize')) {
      // Es configuración de impresión
      setPrintConfig(newSettings);
    } else if (newSettings.hasOwnProperty('name')) {
      // Es información del negocio
      setBusinessInfo(newSettings);
    }
    
    // En caso de configuraciones avanzadas, manejarlas aquí
  };
  
  const handleViewInvoice = () => {
    setPreviewModalOpen(true);
  };

  
  
  // Efecto inicial para verificar estado de auth y preparar sesión
  useEffect(() => {
    const verifyTokenAndPrepare = async () => {
      // Verificar si hay token y si parece válido
      const token = getAuthToken();
      
      if (token) {
        console.log('Token encontrado, intentando usarlo directamente');
        // En lugar de hacer una verificación que puede fallar, confiamos en el token existente
        setStatusMessage('Sesión activa');
        setTimeout(() => setStatusMessage(''), 2000);
      } else {
        console.warn('No se encontró token. Intentando estrategias alternativas...');
        
        // Intento 1: Buscar token en cookies específicas del backend
        const jwtFromCookie = getCookieValue('jwt') || getCookieValue('auth');
        if (jwtFromCookie) {
          console.log('Token encontrado en cookie, guardándolo en localStorage');
          localStorage.setItem('auth_token', jwtFromCookie);
          setStatusMessage('Sesión recuperada desde cookie');
          setTimeout(() => setStatusMessage(''), 2000);
          return;
        }
        
        // Intento 2: Verificar si hay una sesión activa mediante una petición al backend
        try {
          const response = await axios.get(`${API_URL}/auth/check-session`, {
            withCredentials: true // Importante para enviar cookies si existen
          });
          
          if (response.data && response.data.token) {
            console.log('Sesión verificada por el servidor, recibido nuevo token');
            localStorage.setItem('auth_token', response.data.token);
            if (response.data.refreshToken) {
              localStorage.setItem('refresh_token', response.data.refreshToken);
            }
            setStatusMessage('Sesión verificada con éxito');
            setTimeout(() => setStatusMessage(''), 2000);
          }
        } catch (error) {
          console.error('No se pudo verificar la sesión:', error);
          // No mostramos error al usuario para no interrumpir la experiencia
        }
      }
    };
    
    verifyTokenAndPrepare();
  }, []);
  
  // Actualizar error cuando cambia productError
  useEffect(() => {
    if (productError) {
      setError(productError);
    }
  }, [productError]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    onBeforeGetContent: () => {
      setPrintAttemptStatus('preparing');
      return new Promise(resolve => {
        setTimeout(resolve, 500);
      });
    },
    onPrintError: (error) => {
      console.error('Error durante la impresión:', error);
      setPrintAttemptStatus('error');
      setError('Error al imprimir. Por favor, verifique su impresora.');
    },
    onAfterPrint: () => {
      setPrintAttemptStatus('success');
      setStatusMessage('Factura impresa exitosamente');
      setTimeout(() => {
        // Cerrar el modal y limpiar todo
        setPrintModalOpen(false);
        setPrintAttemptStatus('idle');
        
        // Limpiar el carrito y los estados relacionados
        setCart([]);
        setPaymentMethod('');
        setCashReceived('');
        setCurrentProduct(null);
        setQuantity(1);
        setManualQuantity('');
        setSearchTerm('');
        
        // También resetear la selección de cliente fiado
        if (setSelectedClient) {
          setSelectedClient(null);
        }
        
        // Resetear los detalles de pago
        setPaymentDetails({
          cardNumber: '',
          authorizationCode: '',
          transactionId: '',
          clientId: null,
          clientName: null
        });
        
        // Resetear el estado de la factura actual
        setCurrentInvoice(null);
      }, 1500);
    }
  });

  const handleSearch = useCallback(async (event) => {
    if (event.key === 'Enter' && searchTerm) {
      setLoading(true);
      setError('');
      try {
        let product;
        
        // Si el input es solo números, buscar por código de barras
        if (/^\d+$/.test(searchTerm)) {
          product = await fetchProductByBarcode(searchTerm);
        } else {
          // Si es texto, buscar por nombre
          product = await fetchProductByName(searchTerm);
        }

        if (product) {
          setCurrentProduct(product);
          setQuantity(1);
          setManualQuantity('');
        } else {
          setError('Producto no encontrado');
        }
      } catch (err) {
        setError(`Error al buscar el producto: ${err.response?.data?.message || err.message}`);
      } finally {
        setSearchTerm('');
        setLoading(false);
      }
    }
  }, [searchTerm, fetchProductByBarcode, fetchProductByName]);

  const addToCart = useCallback((product, qty = 1) => {
    if (!product) return;
    
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item._id === product._id);
      if (existingItem) {
        // Solo incrementamos la cantidad si NO es un producto por peso
        if (product.unitType !== 'peso') {
          return prevCart.map(item =>
            item._id === product._id
              ? { 
                  ...item, 
                  quantity: item.quantity + qty,
                  subtotal: (item.quantity + qty) * item.salePrice 
                }
              : item
          );
        }
      }
      return [...prevCart, { 
        ...product, 
        quantity: qty,
        subtotal: qty * product.salePrice 
      }];
    });
    
    setCurrentProduct(null);
    setQuantity(1);
    setManualQuantity('');
    setSearchTerm('');
  }, []);

  const handleManualQuantityChange = (e) => {
    const value = e.target.value;
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) > 0)) {
      setManualQuantity(value);
      if (value !== '') {
        setQuantity(parseInt(value));
      }
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === 'Enter' && currentProduct && !event.shiftKey) {
        // Solo agregamos directamente productos que no son por peso
        if (currentProduct.unitType !== 'peso') {
          const qtyToAdd = manualQuantity ? parseInt(manualQuantity) : quantity;
          addToCart(currentProduct, qtyToAdd);
        }
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [currentProduct, quantity, manualQuantity, addToCart]);

  // Calcular totales del carrito
  const calculateTotals = useCallback(() => {
    const subtotal = cart.reduce((sum, item) => {
      if (item.weightInfo) {
        // Para productos por peso
        return sum + (item.weightInfo.value * item.weightInfo.pricePerUnit);
      } else {
        // Para productos normales
        const price = parseFloat(item.salePrice) || 0;
        return sum + (price * item.quantity);
      }
    }, 0);
    
    const tax = applyTax ? subtotal * 0.18 : 0; // ITBIS 18%
    const total = subtotal + tax;
    
    // Asegurar que cashReceived sea tratado como número
    const cashAmount = parseFloat(cashReceived) || 0;
    // Calcular el cambio correctamente
    const change = Math.max(0, cashAmount - total);
    
    // Debug para verificar los valores
    console.log('DEBUG Factur - calculateTotals:', { 
      subtotal, 
      tax, 
      total, 
      cashReceived, 
      cashAmount, 
      change 
    });

    return { 
      subtotal, 
      tax, 
      total, 
      change, 
      cashReceived: cashAmount 
    };
  }, [cart, applyTax, cashReceived]);

  const updateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity < 1) {
      setCart(prevCart => prevCart.filter(item => item._id !== productId));
    } else {
      setCart(prevCart => prevCart.map(item =>
        item._id === productId
          ? { 
              ...item, 
              quantity: newQuantity,
              subtotal: newQuantity * item.salePrice 
            }
          : item
      ));
    }
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart(prevCart => prevCart.filter(item => item._id !== productId));
  }, []);

  // Función para confirmar impresión desde el modal
  const confirmPrint = () => {
    handlePrint();
  };

  // Función para manejar la impresión con datos de la factura guardada
  const handlePrintInvoice = async (invoiceData) => {
    try {
      console.log('Preparando datos para impresión:', invoiceData);
      
      // Capturar el valor actual del efectivo
      const actualCashReceived = parseFloat(cashReceived) || 0;
      console.log('VALOR ACTUAL EFECTIVO:', actualCashReceived);
      
      // Determinar si es una compra fiada
      const isCredit = invoiceData.isCredit || 
                      invoiceData.paymentMethod === 'credit' || 
                      paymentMethod === 'credit';
      
      // Extraer o determinar el nombre del cliente para compras fiadas
      const clientName = invoiceData.clientName || 
                        (invoiceData.clientInfo?.name) ||
                        (isCredit && paymentDetails?.clientName) || null;
      
      // Obtener el número de recibo
      const receiptNumber = invoiceData.receiptNumber || 
                            `FAC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${(invoiceData._id || '').substring(0, 4)}`;
      
      // Añadir la fecha si no existe
      const currentDate = invoiceData.date || new Date().toISOString();
      
      // Importante: Asegurar que tengamos la información de pago correcta
      let paymentDetailsToUse = invoiceData.paymentDetails || {};
      let totalsToUse = { ...calculateTotals() };
      
      // CORRECCIÓN CRÍTICA: Si es compra fiada, no debe tener valores de efectivo
      if (isCredit) {
        // Asegurar que no hay valores de efectivo en compras fiadas
        paymentDetailsToUse = {
          clientId: paymentDetailsToUse.clientId || paymentDetails.clientId,
          clientName: paymentDetailsToUse.clientName || paymentDetails.clientName
          // No incluir received o change en compras a crédito
        };
        
        // Limpiar valores de efectivo en los totales
        totalsToUse.cashReceived = 0;
        totalsToUse.change = 0;
        
        console.log('FIADO - Sin valores de efectivo', totalsToUse);
      }
      // Si estamos creando una nueva factura de efectivo, usar los valores actuales
      else if (paymentMethod === 'cash' && !invoiceData.paymentDetails) {
        // Usar el valor actual del efectivo capturado
        paymentDetailsToUse = {
          received: actualCashReceived,
          change: totalsToUse.change
        };
        
        // Asegurar que los totales incluyen los montos correctos
        totalsToUse.cashReceived = actualCashReceived;
        totalsToUse.change = Math.max(0, actualCashReceived - totalsToUse.total);
        
        console.log('DATOS EFECTIVO CALCULADOS:', {
          efectivoRecibido: actualCashReceived,
          cambio: totalsToUse.change,
          total: totalsToUse.total
        });
      } else if (invoiceData.paymentDetails) {
        // Si ya tenemos detalles de pago en la factura, usarlos
        totalsToUse.cashReceived = invoiceData.paymentDetails.received;
        totalsToUse.change = invoiceData.paymentDetails.change;
      }
      
      // Configurar los datos completos para el modal de impresión
      const printData = {
        ...invoiceData,
        receiptNumber,
        isCredit,
        clientName,
        date: currentDate,
        // Asegurar que tenemos el método de pago correcto
        paymentMethod: invoiceData.paymentMethod || paymentMethod,
        // Añadir información del cajero actual si está disponible
        cashierName: localStorage.getItem('currentUser') 
          ? JSON.parse(localStorage.getItem('currentUser')).name 
          : 'No identificado',
        // Asegurar que la información de pago esté incluida
        paymentDetails: paymentDetailsToUse,
        // Incluir los totales correctos
        totals: totalsToUse,
        // Incluir directamente el monto de efectivo para evitar dependencias
        actualCashReceived: isCredit ? 0 : actualCashReceived
      };
      
      // Guardar los datos de la factura actual para el modal
      setCurrentInvoice(printData);
      
      // Para forzar un valor en el estado local y asegurar que se use en el componente de impresión
      // Solo actualizar el efectivo si no es una compra fiada
      if (!isCredit) {
        setCashReceived(actualCashReceived.toString());
      } else {
        // Para compras fiadas, limpiar cualquier valor de efectivo
        setCashReceived('');
      }
      
      // Registrar por consola los detalles relevantes
      console.log('Datos de impresión preparados:', {
        receiptNumber,
        isCredit,
        clientName,
        paymentMethod: printData.paymentMethod || paymentMethod,
        paymentDetails: printData.paymentDetails,
        totals: totalsToUse,
        actualCashReceived: isCredit ? 0 : actualCashReceived
      });
      
      // Comprobar configuración de impresión automática
      const shouldPrintAutomatically = printConfig.autoPrint;
      
      if (shouldPrintAutomatically) {
        // Abrir el modal de confirmación
        setPrintModalOpen(true);
      } else {
        // Ir directamente a la vista previa
        setPreviewModalOpen(true);
      }
      
      return true;
    } catch (error) {
      console.error('Error al preparar impresión:', error);
      setError('Error al preparar la impresión. Intente nuevamente.');
      return false;
    }
  };

  // Función para procesar el pago
  const processPayment = async () => {
    const { subtotal, tax, total, change, cashReceived: cashAmount } = calculateTotals();

    const isCredit = paymentMethod === 'credit';
    
    if (!paymentMethod && !isCredit) {
      setError('Seleccione un método de pago');
      return;
    }
    
    if (paymentMethod === 'cash' && cashAmount < total) {
      setError('El monto recibido es insuficiente');
      return;
    }

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    setLoading(true);
    setError('');
    setStatusMessage('');
    
    try {
      // Verificar token antes de continuar
      const token = getAuthToken();
      
      if (!token) {
        console.warn('Intentando procesar pago sin token explícito.');
      } else {
        console.log('Procesando pago con token:', token.substring(0, 15) + '...');
      }
      
      // Adaptar el formato de datos para que coincida con lo esperado por el backend
      const invoiceData = {
        customer: {
          name: customer.name,
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || ''
        },
        // Campos para compra fiada
        isCredit: isCredit,
        clienteId: isCredit ? paymentDetails.clientId : null,
        clientInfo: isCredit ? {
          id: paymentDetails.clientId,
          name: paymentDetails.clientName
        } : null,
        items: cart.map(item => {
          const itemData = {
            product: item._id,
            quantity: item.quantity,
            price: item.salePrice || item.price,
            name: item.name,
            subtotal: item.weightInfo 
              ? (item.weightInfo.value * item.weightInfo.pricePerUnit) 
              : (item.quantity * (item.salePrice || item.price))
          };

          // Si es un producto por peso, añadimos la información del peso
          if (item.weightInfo) {
            itemData.weightInfo = {
              value: item.weightInfo.value,
              unit: item.weightInfo.unit,
              pricePerUnit: item.weightInfo.pricePerUnit
            };
          }
          
          return itemData;
        }),
        paymentMethod: paymentMethod || 'credit', // Si no hay método, es porque es crédito
        
        // IMPORTANTE: Configurar correctamente los detalles de pago según el método
        paymentDetails: isCredit 
          ? { // Detalles para pago a crédito
              clientId: paymentDetails.clientId,
              clientName: paymentDetails.clientName,
              // No incluir received o change en compras a crédito
            } 
          : paymentMethod === 'cash' 
            ? { // Detalles para pago en efectivo
                received: cashAmount,
                change: change
              } 
            : paymentDetails, // Otros métodos de pago
            
        subtotal,
        taxAmount: tax,
        total,
        date: new Date().toISOString()
      };

      console.log('Enviando datos de factura:', invoiceData);
      
      // Usar la API centralizada en lugar de axios directo
      const response = await invoiceApi.create(invoiceData);
      
      console.log('Respuesta del servidor:', response);
      
      if (response && (response._id || response.id)) {
        console.log('Factura creada exitosamente:', response);
        
        // Mostrar mensaje específico según el tipo de venta
        if (invoiceData.isCredit) {
          setStatusMessage(`Compra fiada procesada exitosamente para ${paymentDetails.clientName}`);
        } else {
          setStatusMessage('Venta procesada exitosamente');
        }
        
        // Prepare receipt number for printing
        const receiptNumber = response.receiptNumber || `FAC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-????`;
        
        // Set current invoice for printing - CORREGIR VALORES PARA COMPRAS FIADAS
        setCurrentInvoice({
          ...response,
          receiptNumber,
          isCredit: invoiceData.isCredit,
          clientName: invoiceData.isCredit ? paymentDetails.clientName : 'Cliente General',
          // Asegurar que no hay valores de efectivo para compras fiadas
          paymentDetails: invoiceData.paymentDetails,
          // Forzar limpiar valores de efectivo en compras fiadas
          cashReceived: invoiceData.isCredit ? 0 : cashAmount
        });
        
        // Open print modal
        setPrintModalOpen(true);
        
        // Cleanup cart and state after successful transaction
        setCart([]);
        setPaymentMethod('');
        setCashReceived('');
        setCurrentProduct(null);
        setQuantity(1);
        setManualQuantity('');
        setSearchTerm('');
      } else {
        setError('Error: No se recibió confirmación completa de la factura');
        console.error('Respuesta incompleta del servidor:', response);
      }
    } catch (err) {
      console.error('Error completo al procesar la venta:', err);
      
      if (err.response) {
        console.error('Detalles del error del servidor:', {
          status: err.response.status,
          data: err.response.data
        });
        
        if (err.response.status === 401) {
          setError('Error de autenticación. Verifica tu sesión o actualiza la página.');
        } else if (err.response.status === 400) {
          setError(`Error: ${err.response.data?.message || 'Error de validación'}`);
        } else if (err.response.status === 404) {
          setError(`Error: ${err.response.data?.message || 'Recurso no encontrado'}`);
        } else if (err.response.status === 500) {
          setError(`Error interno del servidor: ${err.response.data?.message || 'Contacte al administrador'}`);
        } else {
          setError(`Error al procesar el pago: ${err.response.data?.message || err.message}`);
        }
      } else {
        setError(`Error al procesar el pago: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handler para cerrar el modal sin imprimir
  const handleCloseModal = () => {
    setPrintModalOpen(false);
    
    // Limpiar completamente el estado del carrito y la compra
    setCart([]);
    setPaymentMethod('');
    setCashReceived('');
    setCurrentProduct(null);
    setQuantity(1);
    setManualQuantity('');
    setSearchTerm('');
    
    // También resetear la selección de cliente fiado
    if (setSelectedClient) {
      setSelectedClient(null);
    }
    
    // Resetear los detalles de pago
    setPaymentDetails({
      cardNumber: '',
      authorizationCode: '',
      transactionId: '',
      clientId: null,
      clientName: null
    });
    
    // Resetear el estado de la factura actual
    setCurrentInvoice(null);
  };

  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    authorizationCode: '',
    transactionId: ''
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 max-w-6xl mx-auto">
      {/* Mensajes de estado/error */}
      {error && (
        <div className="fixed top-4 right-4 max-w-sm p-4 bg-red-100 border border-red-300 rounded shadow-lg z-50 flex items-start gap-2">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={20} />
          <div>
            <h4 className="font-semibold text-red-700">Error</h4>
            <p className="text-red-600">{error}</p>
          </div>
          <button 
            className="ml-auto text-gray-500 hover:text-gray-700"
            onClick={() => setError('')}
          >
            <X size={16} />
          </button>
        </div>
      )}


      
      {statusMessage && (
        <div className="fixed top-4 right-4 max-w-sm p-4 bg-green-100 border border-green-300 rounded shadow-lg z-50 flex items-start gap-2">
          <div className="text-green-600">{statusMessage}</div>
          <button 
            className="ml-auto text-gray-500 hover:text-gray-700"
            onClick={() => setStatusMessage('')}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Sección de búsqueda y producto actual */}
      <div className="w-full md:w-1/2">
        {/* SOLUCIÓN: Reemplazar el input de búsqueda original por el componente BuscarProduct */}
        <BuscarProduct 
          onAddToCart={(product) => {
            // Si es un producto por peso, ya viene con weightInfo
            if (product.weightInfo) {
              setCart(prevCart => [...prevCart, product]);
            } else {
              // Para productos normales, usar la función addToCart existente
              addToCart(product, product.quantity || 1);
            }
            setCurrentProduct(null);
            setSearchTerm('');
          }} 
        />

        {currentProduct && (
          <motion.div
          key={currentProduct._id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 border rounded shadow-sm"
        >
          {/* Mostrar interfaz diferente basado en si es producto por peso o no */}
          {currentProduct.unitType === 'peso' ? (
            <ProductWeightDisplay 
              product={currentProduct} 
              onAddToCart={(product) => {
                setCart(prevCart => [...prevCart, product]);
                setCurrentProduct(null);
                setSearchTerm('');
              }}
            />
          ) : (
            <>
              <h3 className="font-semibold">{currentProduct.name}</h3>
              <p className="text-sm text-gray-600">{currentProduct.description}</p>
              <p className="text-lg font-bold mt-2">
                ${parseFloat(currentProduct.salePrice || 0).toFixed(2)}
              </p>
              
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="text"
                    className="w-16 text-center border rounded p-1"
                    value={manualQuantity || quantity}
                    onChange={handleManualQuantityChange}
                    placeholder="Cant."
                  />
                  <button
                    className="p-1 rounded-full hover:bg-gray-100"
                    onClick={() => setQuantity(prev => prev + 1)}
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => addToCart(currentProduct, parseInt(manualQuantity || quantity))}
                >
                  Agregar al carrito
                </button>
              </div>
            </>
          )}
        </motion.div>
        )}
      </div>

      {/* Carrito, totales, método de pago - Usando el componente CarritoCompra */}
      <div className="w-full md:w-1/2">
        <CarritoCompra
          cart={cart}
          updateQuantity={updateQuantity}
          removeFromCart={removeFromCart}
          applyTax={applyTax}
          setApplyTax={setApplyTax}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashReceived={cashReceived}
          setCashReceived={setCashReceived}
          paymentDetails={paymentDetails}
          setPaymentDetails={setPaymentDetails}
          loading={loading}
          processPayment={processPayment}
        />

        {/* Componente de impresión oculto */}
        <div style={{ display: "none" }}>
         <InvoicePrintTemplate
            ref={printRef}
            cart={cart}
            customer={customer}
            totals={currentInvoice?.totals || calculateTotals()}
            paymentMethod={currentInvoice?.paymentMethod || paymentMethod}
            businessInfo={businessInfo}
            currentUser={localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')) : null}
            invoiceNumber={currentInvoice?.receiptNumber || ''}
            isCredit={currentInvoice?.isCredit || paymentMethod === 'credit'}
            clientName={currentInvoice?.clientName || (paymentMethod === 'credit' ? paymentDetails.clientName : null)}
            cashReceivedValue={parseFloat(cashReceived) || 0}
          />
        </div>
        
        {/* Modal de confirmación de impresión */}
        <PrintConfirmationModal
          isOpen={printModalOpen} 
          onClose={handleCloseModal}
          onConfirm={confirmPrint}
          invoiceNumber={currentInvoice?.receiptNumber || ''}
        />
      </div>

      {/* Modal actualizado con nuevas propiedades */}
      <PrintConfirmationModal
        isOpen={printModalOpen} 
        onClose={handleCloseModal}
        onConfirm={confirmPrint}
        onViewInvoice={handleViewInvoice}
        onConfigInvoice={() => handleOpenSettings('business')}
        invoiceNumber={currentInvoice?.receiptNumber || ''}
      />
      
      {/* Modal de configuración */}
      <InvoicePreviewModal
        isOpen={configModalOpen}
        onClose={() => setConfigModalOpen(false)}
        onPrint={() => {}}
        invoiceData={currentInvoice}
        businessInfo={businessInfo}
        printConfig={true}
        onSave={handleOpenSettings}
      />
      
      {/* Modal de vista previa */}
      <InvoicePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        onPrint={confirmPrint}
        invoiceData={currentInvoice}
        businessInfo={businessInfo}
      />

      {/* Modal de configuración del negocio */}
      <BusinessInfoSettings
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        onSave={handleSaveSettings}
        businessInfo={businessInfo}
      />
    </div>
  );
};

export default POSSystem;