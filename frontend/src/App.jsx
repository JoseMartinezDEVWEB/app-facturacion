import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './context/AuthContext.jsx';
import { LoadingProvider } from './context/LoadingContext.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import Loader from './components/Loader.jsx';

// Importar el componente ProtectedRoute desde su archivo
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Importación de páginas
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Unauthorized from './pages/Unauthorized.jsx';
import DashboardHome from './pages/page/DashboardHome';
import  Productos  from './pages/page/Productos';
import  Categorias  from './pages/page/Categorias';
import  Facturas  from './pages/page/Facturas';
import CrearFactura from './pages/page/CrearFactura';
import GastoHome from './pages/page/GastoHome';
import { ClienteForm } from './pages/page/ClienteForm';
import BusinessSettings from './pages/page/BusinessSettings';

// Nuevas páginas para las características añadidas
import FacturaDetalle from './pages/page/FacturaDetalle';
import NotasCredito from './pages/page/NotasCredito';
import NotaCreditoDetalle from './pages/page/NotaCreditoDetalle';
import CrearNotaCredito from './pages/page/CrearNotaCredito';
import Cotizaciones from './pages/page/Cotizaciones';
import CotizacionDetalle from './pages/page/CotizacionDetalle';
import CrearCotizacion from './pages/page/CrearCotizacion';

// Importar los componentes de retenciones
import Retenciones from './pages/page/Retenciones';
import CrearRetencion from './pages/page/CrearRetencion';
import DetalleRetencion from './pages/page/DetalleRetencion';
import EditarRetencion from './pages/page/EditarRetencion';

// Importar los componentes de proveedores y compras a crédito
import Proveedores from './pages/page/Proveedores';
import ComprasCredito from './pages/page/ComprasCredito';
import CrearCompraCredito from './pages/page/CrearCompraCredito';
import DetalleCompraCredito from './pages/page/DetalleCompraCredito';
import RegistrarPagoCompra from './pages/page/RegistrarPagoCompra';

const App = () => {
  return (
    <LoadingProvider>
      <AuthProvider>
        <BusinessProvider>
          <Router>
            <Loader />
            <AnimatePresence mode="wait">
              <Routes>
                {/* Rutas públicas */}
                <Route path="/" element={<Welcome />} />
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Rutas Protegidas (Dashboard y subrutas) */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<DashboardHome />} />
                  <Route path="productos" element={<Productos />} />
                  <Route path="categorias" element={<Categorias />} />
                  
                  {/* Rutas para Facturas */}
                  <Route path="facturas" element={<Facturas />} />
                  <Route path="facturas/crear" element={<CrearFactura />} />
                  <Route path="facturas/:id" element={<FacturaDetalle />} />
                  
                  {/* Rutas para Notas de Crédito */}
                  <Route path="notas-credito" element={<NotasCredito />} />
                  <Route path="notas-credito/:id" element={<NotaCreditoDetalle />} />
                  <Route path="crear-nota-credito/:invoiceId" element={<CrearNotaCredito />} />
                  
                  {/* Rutas para Cotizaciones */}
                  <Route path="cotizaciones" element={<Cotizaciones />} />
                  <Route path="cotizaciones/:id" element={<CotizacionDetalle />} />
                  <Route path="crear-cotizacion" element={<CrearCotizacion />} />
                  
                  <Route path="GestionGasto" element={<GastoHome />} />
                  <Route path="clientes" element={<ClienteForm />} />

                  {/* Rutas para retenciones */}
                  <Route path="retenciones" element={<Retenciones />} />
                  <Route path="retenciones/:id" element={<DetalleRetencion />} />
                  <Route path="retenciones/:id/editar" element={<EditarRetencion />} />
                  <Route path="crear-retencion/:invoiceId" element={<CrearRetencion />} />
                  
                  {/* Rutas para proveedores */}
                  <Route path="proveedores" element={<Proveedores />} />
                  
                  {/* Rutas para compras a crédito */}
                  <Route path="compras-credito" element={<ComprasCredito />} />
                  <Route path="compras-credito/:id" element={<DetalleCompraCredito />} />
                  <Route path="crear-compra-credito" element={<CrearCompraCredito />} />
                  <Route path="compras-credito/:id/pago" element={<RegistrarPagoCompra />} />
                  
                  {/* Ruta para configuración del negocio */}
                  <Route 
                    path="configuracion" 
                    element={
                      <ProtectedRoute roles={['admin', 'encargado']}> 
                        <BusinessSettings />
                      </ProtectedRoute>
                    }
                  />
                </Route>
                
                {/* Redirección para rutas no encontradas */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </AnimatePresence>
          </Router>
        </BusinessProvider>
      </AuthProvider>
    </LoadingProvider>
  );
};

export default App;