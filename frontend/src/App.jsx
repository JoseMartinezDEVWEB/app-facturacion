import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { LoadingProvider } from './context/LoadingContext.jsx';
import { BusinessProvider } from './context/BusinessContext.jsx';
import Loader from './components/Loader.jsx';
import AppRoutes from './AppRoutes';

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

// Importar la página de conexión remota
import RemoteConnectionSettings from './pages/page/RemoteConnectionSettings';

const App = () => (
  <LoadingProvider>
    <AuthProvider>
      <BusinessProvider>
        <AppRoutes />
      </BusinessProvider>
    </AuthProvider>
  </LoadingProvider>
);

export default App;