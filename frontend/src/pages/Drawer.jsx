/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../config/apis';
import { getUserInfo } from '../services/authService';

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
  { id: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
  { id: '/dashboard/proveedores', label: 'Proveedores', icon: '🏭' },
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
      
      // Usar la nueva función que maneja errores internamente
      const userData = await getUserInfo();
      
      if (userData) {
        // Extraer username y role del objeto de respuesta
        const { username, role } = userData;
        // Almacenar en localStorage para persistencia
        localStorage.setItem('userName', username);
        localStorage.setItem('userRole', role);
        
        setUserInfo({
          nombre: username,
          rol: role,
          isLoading: false
        });
      } else {
        throw new Error('Datos de respuesta inválidos');
      }
    } catch (error) {
      console.error('Error al obtener información del usuario:', error);
      
      // La función getUserInfo ya maneja los errores, pero por si acaso
      // también manejamos aquí utilizando datos almacenados localmente
      setUserInfo({
        nombre: localStorage.getItem('userName') || 'Usuario',
        rol: localStorage.getItem('userRole') || 'Invitado',
        isLoading: false
      });
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

  // Filtrar menú según rol
  const userRole = userInfo.rol;
  const filteredMenu = userRole === 'cajero'
    ? menuItems.filter(item =>
        ['/dashboard','/dashboard/facturas','/dashboard/GestionGasto','/dashboard/clientes','/dashboard/proveedores','/dashboard/categorias']
        .includes(item.id)
      )
    : menuItems;

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

      {/* Drawer principal - móvil: ocupa toda la pantalla, lg: ocupa 20% */}
      <motion.div
        className={`fixed top-0 left-0 h-full w-full sm:w-80 md:w-72 lg:w-64 bg-white shadow-lg z-50 transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out overflow-y-auto flex flex-col`}
        initial={false}
      >
        {/* Encabezado del usuario */}
        <div className="px-4 py-5 bg-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div 
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white text-blue-600 flex items-center justify-center text-xl font-bold flex-shrink-0 ${
                  userInfo.isLoading ? 'animate-pulse' : ''
                }`}
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold truncate text-sm sm:text-base">
                  {userInfo.isLoading ? (
                    <span className="inline-block w-24 h-5 bg-white bg-opacity-30 rounded animate-pulse"></span>
                  ) : (
                    displayName
                  )}
                </h3>
                <p className="text-xs sm:text-sm truncate text-blue-200">
                  {userInfo.isLoading ? (
                    <span className="inline-block w-16 h-4 bg-white bg-opacity-20 rounded animate-pulse"></span>
                  ) : (
                    displayRole
                  )}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-white hover:bg-blue-700 lg:hidden"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Menú de navegación - ScrollArea */}
        <nav className="p-2 sm:p-4 flex-grow overflow-y-auto">
          {filteredMenu.map((item) => (
            <div key={item.id} className="mb-1 sm:mb-2">
              {item.subItems ? (
                <>
                  <button
                    onClick={() => handleMenuItemClick(item)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                      isActive(item.id) || expandedMenu === item.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg sm:text-xl">{item.icon}</span>
                      <span className="truncate">{item.label}</span>
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
                        className={`w-full flex items-center space-x-3 px-6 sm:px-8 py-2 rounded-lg mb-1 transition-colors text-sm ${
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
                        <span className="truncate">{subItem.label}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={item.id}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    isActive(item.id)
                      ? 'bg-blue-50 text-blue-600'
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  <span className="text-lg sm:text-xl">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </Link>
              )}
            </div>
          ))}
        </nav>

        {/* Footer con versión y copyright */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-xs text-center text-gray-500">
          <p>App Facturación v1.0</p>
          <p>© {new Date().getFullYear()} Todos los derechos reservados</p>
        </div>
      </motion.div>
    </>
  );
};

export default Drawer;