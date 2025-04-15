import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Importación de páginas
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardHome from './pages/page/DashboardHome';
import  Productos  from './pages/page/Productos';
import  Categorias  from './pages/page/Categorias';
import  Facturas  from './pages/page/Facturas';
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

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
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

              {/* Ruta para configuración del negocio */}
              <Route path="configuracion" element={<BusinessSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </AuthProvider>
  );
};

export default App;