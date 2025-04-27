// Base URL para la API
export const API_BASE_URL = 'http://localhost:4500/api';

// URL completa para uso directo en componentes
export const API_URL = API_BASE_URL;

// Rutas de la API
export const API_ROUTES = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register-admin',
    LOGOUT: '/auth/logout',
    VALIDATE: '/auth/validate',
    USER_INFO: '/auth/users/info'
  },
  
  // Clientes
  CLIENTES: '/clientes',
  
  // Productos
  PRODUCTS: '/products',
  CATEGORIES: '/categories',
  
  // Facturas
  INVOICES: '/newinvoices',
  FACTURAS: '/facturas',
  
  // Notas de crédito
  CREDIT_NOTES: '/credit-notes',
  
  // Cotizaciones
  QUOTES: '/quotes',
  
  // Gastos
  EXPENSES: '/expenses',
  
  // Reportes diarios
  DAILY_REPORTS: '/daily-reports',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  
  // Proveedores
  PROVIDERS: '/providers',
  
  // Órdenes de compra
  PURCHASE_ORDERS: '/purchase-orders',
  
  // Pagos a crédito
  CREDIT_PAYMENTS: '/credit-payments',
  
  // Retenciones
  RETENTIONS: '/retentions'
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
  SERVER: 'Error en el servidor. Por favor, inténtalo más tarde.',
  'Invalid credentials': 'Credenciales inválidas'
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