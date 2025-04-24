import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

import Drawer from './Drawer';
import DashboardFull from '../components/dashboard';

const Dashboard = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isExactDashboardRoute = window.location.pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2 md:py-4">
            <div className="flex items-center">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                aria-label="Open menu"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <span className="ml-2 text-lg font-semibold text-gray-800 lg:hidden">
                App Facturación
              </span>
            </div>

            <motion.button
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base rounded-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Cerrar Sesión
            </motion.button>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex flex-col lg:flex-row">
        <Drawer 
          isOpen={isDrawerOpen} 
          onClose={() => setIsDrawerOpen(false)} 
        />
        
        {/* Contenido Principal */}
        <main className="flex-1 lg:ml-64 p-2 sm:p-4 md:p-6 w-full overflow-x-hidden">
          <div className="max-w-full mx-auto">
             {isExactDashboardRoute ? <DashboardFull /> : <Outlet />} 
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;