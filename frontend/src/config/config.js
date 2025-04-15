// Base URL para la API
export const API_BASE_URL = 'http://localhost:4000/api';

// Rutas de la API
export const API_ROUTES = {
  // Autenticación
  AUTH: {
    LOGIN: '/api/login',
    REGISTER: '/api/register-admin',
    LOGOUT: '/api/logout',
    VALIDATE: '/api/validate'
  },
  
  // Clientes
  CLIENTES: '/api/clientes',
  
  // Productos
  PRODUCTS: '/api/products',
  CATEGORIES: '/api/categories',
  
  // Facturas
  INVOICES: '/api/newinvoices',
  FACTURAS: '/api/facturas',
  
  // Notas de crédito
  CREDIT_NOTES: '/api/credit-notes',
  
  // Cotizaciones
  QUOTES: '/api/quotes',
  
  // Gastos
  EXPENSES: '/api/expenses',
  
  // Reportes diarios
  DAILY_REPORTS: '/api/daily-reports',
  
  // Dashboard
  DASHBOARD: '/api/dashboard',
  
  // Proveedores
  PROVIDERS: '/api/providers',
  
  // Órdenes de compra
  PURCHASE_ORDERS: '/api/purchase-orders',
  
  // Pagos a crédito
  CREDIT_PAYMENTS: '/api/credit-payments',
  
  // Retenciones
  RETENTIONS: '/api/retentions'
};

// Configuración de la aplicación
export const APP_CONFIG = {
  // Paginación
  ITEMS_PER_PAGE: 10,
  
  // Formatos de fecha
  DATE_FORMAT: 'DD/MM/YYYY',
  TIME_FORMAT: 'HH:mm',
  DATETIME_FORMAT: 'DD/MM/YYYY HH:mm',
  
  // Configuración de moneda
  CURRENCY: 'USD',
  CURRENCY_SYMBOL: '$',
  
  // Timeouts
  API_TIMEOUT: 15000, // 15 segundos
  
  // Límites de archivos
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Duración de notificaciones
  NOTIFICATION_DURATION: 5000, // 5 segundos
  
  // Duración de caché
  CACHE_DURATION: 5 * 60 * 1000 // 5 minutos
};

// Mensajes de error
export const ERROR_MESSAGES = {
  DEFAULT: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.',
  NETWORK: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'No autorizado. Por favor, inicia sesión.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no existe.',
  VALIDATION: 'Por favor, verifica los datos ingresados.',
  SERVER: 'Error en el servidor. Por favor, inténtalo más tarde.'
};

// Estados de documentos
export const DOCUMENT_STATUS = {
  DRAFT: 'borrador',
  PENDING: 'pendiente',
  APPROVED: 'aprobado',
  REJECTED: 'rechazado',
  CANCELLED: 'anulado',
  COMPLETED: 'completado'
};

// Tipos de documentos fiscales
export const FISCAL_DOCUMENT_TYPES = {
  INVOICE: 'factura',
  CREDIT_NOTE: 'nota_credito',
  DEBIT_NOTE: 'nota_debito',
  RETENTION: 'retencion'
};

// Regímenes tributarios
export const TAX_REGIMES = {
  GENERAL: 'regimen_general',
  SIMPLIFIED: 'regimen_simplificado',
  SPECIAL: 'regimen_especial'
}; 