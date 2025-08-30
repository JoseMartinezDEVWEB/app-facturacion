// Importar todos los servicios
import * as facturasService from './facturasService';
import * as clientesService from './clientesService';

// Exportar todos los servicios para fácil acceso
export {
  facturasService,
  clientesService
};

// También exportar funciones individuales para importación directa
export const { 
  getFacturas, 
  getFacturaById, 
  createFactura, 
  updateFactura, 
  deleteFactura 
} = facturasService;

export const { 
  getClientes, 
  getClienteById, 
  createCliente, 
  updateCliente, 
  deleteCliente 
} = clientesService; 