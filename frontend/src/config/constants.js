// API URL
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Estados de factura
export const INVOICE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PAID: 'paid',
  CANCELED: 'canceled',
  VOID: 'void'
};

// Estados de pago
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded'
};

// Tipos de pago
export const PAYMENT_TYPES = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  TRANSFER: 'transfer',
  CHECK: 'check',
  OTHER: 'other'
};

// Estados de proveedor
export const SUPPLIER_STATUS = {
  ACTIVE: 'activo',
  INACTIVE: 'inactivo',
  PENDING: 'pendiente'
};

// Roles de usuario
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  EMPLOYEE: 'employee'
};

// Límites de paginación
export const PAGINATION = {
  DEFAULT_LIMIT: 10,
  DEFAULT_PAGE: 1,
  PAGE_SIZES: [5, 10, 25, 50, 100]
};

// Categorías
export const PRODUCT_CATEGORIES = [
  'Electrónica',
  'Ropa',
  'Hogar',
  'Alimentos',
  'Bebidas',
  'Limpieza',
  'Farmacia',
  'Accesorios',
  'Herramientas',
  'Otros'
];

// Formatos de archivo permitidos
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

// Tamaño máximo de archivo (en bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB 