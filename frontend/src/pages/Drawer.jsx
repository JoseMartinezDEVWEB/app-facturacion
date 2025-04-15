/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/apis';

// Elementos del menú de navegación
const menuItems = [
  { id: '/dashboard', label: 'Dashboard', icon: '📊' },
  { id: '/dashboard/productos', label: 'Productos', icon: '📦' },
  { 
    id: '/dashboard/facturas', 
    label: 'Facturas', 
    icon: '📄',
    subItems: [
      { id: '/dashboard/facturas', label: 'Facturas', icon: '📃' },
      { id: '/dashboard/cotizaciones', label: 'Cotizaciones', icon: '📝' },
      { id: '/dashboard/notas-credito', label: 'Notas de Crédito', icon: '📤' }
    ]
  },
  { id: '/dashboard/categorias', label: 'Categorías', icon: '🏷️' },
  { id: '/dashboard/GestionGasto', label: 'Gestion de Gastos', icon: '💰' },
  { id: '/dashboard/clientes', label: 'Usuarios', icon: '👥' },
  { id: '/dashboard/configuracion', label: 'Configuración', icon: '⚙️' }
];

// Función para generar iniciales a partir del nombre del usuario
const getInitials = (name) => {
  if (!name) return 'U';
  
  const nameArray = name.trim().split(' ');
  if (nameArray.length > 1) {
    return `${nameArray[0][0]}${nameArray[1][0]}`.toUpperCase();
  }
  
  return name[0].toUpperCase();
};

const Drawer = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({
    nombre: localStorage.getItem('userName') || '',
    rol: localStorage.getItem('userRole') || '',
    isLoading: true
  });
  
  // Estado para controlar los submenús expandidos
  const [expandedMenu, setExpandedMenu] = useState(null);

  // Obtener información del usuario cuando el componente se monta
  useEffect(() => {
    fetchUserInfo();
    
    // Configurar un intervalo para reintentar si es necesario
    const intervalId = setInterval(() => {
      if (!userInfo.nombre || !userInfo.rol) {
        fetchUserInfo();
      }
    }, 10000);
    
    // Limpiar el intervalo cuando el componente se desmonta
    return () => clearInterval(intervalId);
  }, []);
  
  // Expandir el submenú activo automáticamente
  useEffect(() => {
    menuItems.forEach(item => {
      if (item.subItems && item.subItems.some(subItem => location.pathname.startsWith(subItem.id))) {
        setExpandedMenu(item.id);
      }
    });
  }, [location.pathname]);

  // Función para obtener información del usuario desde la API
  const fetchUserInfo = async () => {
    try {
      setUserInfo(prev => ({ ...prev, isLoading: true }));
      
      const response = await api.get('/users/info');
      
      if (response && response.data) {
        // Almacenar en localStorage para persistencia
        localStorage.setItem('userName', response.data.nombre || '');
        localStorage.setItem('userRole', response.data.rol || '');
        
        setUserInfo({
          nombre: response.data.nombre || '',
          rol: response.data.rol || '',
          isLoading: false
        });
        
        console.log('Información de usuario cargada correctamente:', response.data);
      } else {
        throw new Error('Datos de respuesta inválidos');
      }
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      
      // Usar datos de localStorage si la API falla
      setUserInfo({
        nombre: localStorage.getItem('userName') || '',
        rol: localStorage.getItem('userRole') || '',
        isLoading: false
      });
      
      // Intentar cargar desde sesión/cookies como respaldo
      const sessionUserName = sessionStorage.getItem('userName') || document.cookie.match(/userName=([^;]+)/)?.pop();
      const sessionUserRole = sessionStorage.getItem('userRole') || document.cookie.match(/userRole=([^;]+)/)?.pop();
      
      if (sessionUserName && !userInfo.nombre) {
        setUserInfo(prev => ({
          ...prev,
          nombre: sessionUserName,
          rol: sessionUserRole || prev.rol
        }));
      }
    }
  };

  // Función para determinar si un elemento del menú está activo
  const isActive = (path) => {
    // Caso especial para la ruta principal del dashboard
    if (path === '/dashboard' && location.pathname === '/dashboard') {
      return true;
    }
    // Para las demás rutas, verifica si la ruta actual comienza con el path del ítem
    return location.pathname.startsWith(path) && path !== '/dashboard';
  };
  
  // Función para manejar el clic en un ítem con submenú
  const handleMenuItemClick = (item) => {
    if (item.subItems) {
      setExpandedMenu(expandedMenu === item.id ? null : item.id);
    } else if (window.innerWidth < 1024) {
      onClose();
    }
  };

  // Mostrar siempre valores incluso si faltan datos
  const displayName = userInfo.nombre || 'Usuario';
  const displayRole = userInfo.rol || 'Invitado';
  const initials = getInitials(displayName);

  return (
    <>
      {/* Overlay para dispositivos móviles */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer principal */}
      <motion.div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto`}
        initial={false}
      >
        {/* Encabezado del usuario - Siempre visible incluso durante la carga */}
        <div className="p-6 bg-blue-600 text-white">
          <div className="flex items-center space-x-3">
            <div 
              className={`w-12 h-12 rounded-full bg-white text-blue-600 flex items-center justify-center text-xl font-bold ${
                userInfo.isLoading ? 'animate-pulse' : ''
              }`}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <h3 className="font-bold truncate">
                {userInfo.isLoading ? (
                  <span className="inline-block w-24 h-5 bg-white bg-opacity-30 rounded animate-pulse"></span>
                ) : (
                  displayName
                )}
              </h3>
              <p className="text-sm truncate text-blue-200">
                {userInfo.isLoading ? (
                  <span className="inline-block w-16 h-4 bg-white bg-opacity-20 rounded animate-pulse"></span>
                ) : (
                  displayRole
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Menú de navegación */}
        <nav className="p-4">
          {menuItems.map((item) => (
            <div key={item.id} className="mb-2">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.id) || expandedMenu === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <span className={`transform transition-transform ${expandedMenu === item.id ? 'rotate-180' : ''}`}>
                      ▼
                    </span>
                  </button>
                  
                  {/* Submenú */}
                  <div 
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedMenu === item.id ? 'max-h-48' : 'max-h-0'
                    }`}
                  >
                    {item.subItems.map(subItem => (
                      <Link
                        key={subItem.id}
                        to={subItem.id}
                        className={`w-full flex items-center space-x-3 px-8 py-2 rounded-lg mb-1 transition-colors ${
                          isActive(subItem.id)
                            ? 'bg-blue-50 text-blue-600'
                            : 'hover:bg-gray-100'
                        }`}
                        onClick={() => {
                          if (window.innerWidth < 1024) {
                            onClose();
                          }
                        }}
                      >
                        <span className="text-sm">{subItem.icon}</span>
                        <span className="text-sm">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={item.id}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.id)
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleMenuItemClick(item)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Pie de página con botón de cierre de sesión */}
        <div className="sticky bottom-0 left-0 w-full p-4 border-t border-gray-200 bg-white">
          <button 
            onClick={() => {
              // Limpiar datos de usuario y redirigir al login
              localStorage.removeItem('userName');
              localStorage.removeItem('userRole');
              sessionStorage.removeItem('userName');
              sessionStorage.removeItem('userRole');
              document.cookie = 'userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              document.cookie = 'userRole=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
              navigate('/login');
            }}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span>🚪</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Drawer;