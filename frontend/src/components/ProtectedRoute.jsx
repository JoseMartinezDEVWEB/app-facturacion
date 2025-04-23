/* eslint-disable react/prop-types */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente para proteger rutas basado en autenticación y roles.
 * @param {object} props
 * @param {React.ReactNode} props.children - El componente a renderizar si está autorizado.
 * @param {string[]} [props.roles] - Lista de roles permitidos para acceder a la ruta. Si no se especifica, solo requiere autenticación.
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // Mostrar un spinner o nada mientras se verifica el estado de autenticación
  if (loading) {
    // Puedes poner aquí un spinner de carga global o simplemente null
    return <div>Verificando autenticación...</div>;
  }

  // Si no está autenticado, redirigir al login
  // Guardamos la ubicación actual para redirigir de vuelta después del login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si se especifican roles y el usuario no tiene uno de los roles permitidos
  if (roles && roles.length > 0 && (!user || !roles.includes(user.role))) {
    // Redirigir a una página de "No autorizado"
    // O podrías redirigir al dashboard con un mensaje: return <Navigate to="/dashboard" state={{ unauthorized: true }} replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  // Si está autenticado y tiene el rol correcto (o no se requieren roles específicos), renderizar el componente hijo
  return children;
};

export default ProtectedRoute;
