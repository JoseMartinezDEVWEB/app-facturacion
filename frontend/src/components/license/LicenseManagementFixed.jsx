import React, { useState, useEffect } from 'react';
import { getAllLicenses, renewLicense, blockLicense } from '../../services/licenseService';
import { getAllUsers, deleteUser } from '../../services/userService';
import axios from 'axios';
import toast from 'react-hot-toast';
import moment from 'moment';

// Estilos CSS para animaciones
import './licenseManagement.css';

const LicenseManagementFixed = () => {
  // Estados para datos
  const [users, setUsers] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para modales
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [blockReason, setBlockReason] = useState('');
  const [renewDays, setRenewDays] = useState(30);
  const [renewType, setRenewType] = useState('BASIC');

  // Estado para controlar reintento de carga
  const [retryCount, setRetryCount] = useState(0);

  // Cargar datos de usuarios y licencias
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Iniciando carga de datos (intento #' + (retryCount + 1) + ')');
        
        // Cargar usuarios - manejo de errores mejorado
        console.log('Solicitando lista de usuarios...');
        const usersResponse = await getAllUsers();
        
        if (usersResponse.error) {
          console.error('Error al obtener usuarios:', usersResponse.error);
          setError('Error al obtener usuarios: ' + usersResponse.error);
        } else {
          const usersList = usersResponse.users || [];
          setUsers(usersList);
          console.log(`Usuarios cargados exitosamente: ${usersList.length} usuarios encontrados`);
          
          // Mostrar información de usuarios para depuración
          if (usersList.length > 0) {
            console.log('Ejemplo de usuario:', JSON.stringify(usersList[0], null, 2));
          }
        }
        
        // Cargar licencias - manejo de errores mejorado
        console.log('Solicitando lista de licencias...');
        const licensesResponse = await getAllLicenses();
        
        if (licensesResponse.error) {
          console.error('Error al obtener licencias:', licensesResponse.error);
          // No sobrescribir error de usuarios si ya existe
          if (!usersResponse.error) {
            setError('Error al obtener licencias: ' + licensesResponse.error);
          }
        } else {
          const licensesList = licensesResponse.licenses || [];
          setLicenses(licensesList);
          console.log(`Licencias cargadas exitosamente: ${licensesList.length} licencias encontradas`);
          
          // Mostrar información de licencias para depuración
          if (licensesList.length > 0) {
            console.log('Ejemplo de licencia:', JSON.stringify(licensesList[0], null, 2));
          }
        }
        
        // Si llegamos aquí sin errores y con datos, todo está bien
        if (!usersResponse.error && !licensesResponse.error) {
          console.log('Carga de datos completada con éxito');
        }
      } catch (err) {
        console.error('Error inesperado al cargar datos:', err);
        setError('Error inesperado: ' + (err.message || 'Error desconocido'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [retryCount]); // Dependencia en retryCount para permitir reintentos

  // Función para encontrar la licencia de un usuario
  const findLicenseForUser = (userId) => {
    return licenses.find(license => 
      license.userId && license.userId._id === userId
    );
  };

  // Funciones para modales
  const handleShowRenewModal = (user) => {
    setSelectedUser(user);
    setShowRenewModal(true);
  };

  const handleShowBlockModal = (user) => {
    setSelectedUser(user);
    setShowBlockModal(true);
  };

  const handleShowDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Funciones de acción
  const handleRenewLicense = async () => {
    if (!selectedUser) return;
    
    try {
      const renewData = {
        licenseType: renewType,
        durationDays: parseInt(renewDays, 10)
      };
      
      const response = await renewLicense(selectedUser._id, renewData);
      
      if (response.error) {
        console.error('Error al renovar licencia:', response.error);
        toast.error('Error al renovar licencia: ' + response.error);
        return;
      }
      
      toast.success('Licencia renovada correctamente');
      setShowRenewModal(false);
      
      // Recargar datos
      const licensesResponse = await getAllLicenses();
      if (!licensesResponse.error) {
        setLicenses(licensesResponse.licenses || []);
      }
    } catch (err) {
      console.error('Error inesperado al renovar licencia:', err);
      toast.error('Error inesperado: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleBlockLicense = async () => {
    if (!selectedUser) return;
    
    try {
      const blockData = {
        reason: blockReason || 'Bloqueado por administrador'
      };
      
      const response = await blockLicense(selectedUser._id, blockData);
      
      if (response.error) {
        console.error('Error al bloquear licencia:', response.error);
        toast.error('Error al bloquear licencia: ' + response.error);
        return;
      }
      
      toast.success('Licencia bloqueada correctamente');
      setShowBlockModal(false);
      setBlockReason('');
      
      // Recargar datos
      const licensesResponse = await getAllLicenses();
      if (!licensesResponse.error) {
        setLicenses(licensesResponse.licenses || []);
      }
    } catch (err) {
      console.error('Error inesperado al bloquear licencia:', err);
      toast.error('Error inesperado: ' + (err.message || 'Error desconocido'));
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      const response = await deleteUser(selectedUser._id);
      
      if (response.error) {
        console.error('Error al eliminar usuario:', response.error);
        toast.error('Error al eliminar usuario: ' + response.error);
        return;
      }
      
      toast.success('Usuario eliminado correctamente');
      setShowDeleteModal(false);
      
      // Recargar datos
      const usersResponse = await getAllUsers();
      if (!usersResponse.error) {
        setUsers(usersResponse.users || []);
      }
      
      // También actualizar licencias para reflejar cambios
      const licensesResponse = await getAllLicenses();
      if (!licensesResponse.error) {
        setLicenses(licensesResponse.licenses || []);
      }
    } catch (err) {
      console.error('Error inesperado al eliminar usuario:', err);
      toast.error('Error inesperado: ' + (err.message || 'Error desconocido'));
    }
  };

  // Formatear fechas
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('DD/MM/YYYY');
  };

  // Obtener estado de licencia y clase CSS
  const getLicenseStatus = (user) => {
    if (user.role === 'superadmin') {
      return { text: 'SUPERADMIN', bgColor: 'bg-blue-100 text-blue-800' };
    }
    
    const license = findLicenseForUser(user._id);
    if (!license) {
      return { text: 'SIN LICENCIA', bgColor: 'bg-red-100 text-red-800' };
    }
    
    switch (license.status) {
      case 'active':
        return { text: 'ACTIVA', bgColor: 'bg-green-100 text-green-800' };
      case 'trial':
        return { text: 'PRUEBA', bgColor: 'bg-yellow-100 text-yellow-800' };
      case 'blocked':
        return { text: 'BLOQUEADA', bgColor: 'bg-red-100 text-red-800' };
      case 'expired':
        return { text: 'EXPIRADA', bgColor: 'bg-gray-100 text-gray-800' };
      default:
        return { text: license.status.toUpperCase(), bgColor: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mx-auto max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Licencias</h2>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors duration-200"
          onClick={() => handleShowRenewModal({ _id: null })}
        >
          Nueva Licencia
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-md shadow-sm mb-6 alert-message">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error al cargar datos</h3>
              <p className="text-red-700 mb-3">{error}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button 
                  onClick={() => setRetryCount(prevCount => prevCount + 1)}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reintentar sin recargar (Intento {retryCount})
                </button>
                <button 
                  onClick={() => window.location.reload()}
                  className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 flex items-center shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recargar página completa
                </button>
              </div>
              <p className="text-xs text-red-600 mt-3">Si el problema persiste, contacte al administrador del sistema.</p>
            </div>
          </div>
        </div>
      )}
      
      {users.length === 0 ? (
        <div className="bg-blue-50 rounded-md p-6 text-center mb-6">
          <div className="text-blue-600 mb-2 flex justify-center">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-1">No hay licencias registradas</h3>
          <p className="text-gray-600">Utiliza el botón "Nueva Licencia" para comenzar a gestionar licencias.</p>
        </div>
      ) : (
        <div className="bg-white rounded-md overflow-hidden shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado Licencia</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha Expiración</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map(user => {
                  const license = findLicenseForUser(user._id);
                  const licenseStatus = getLicenseStatus(user);
                  
                  return (
                    <tr key={user._id} className="hover:bg-gray-50 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800">
                        {user.username || user.name || 'Sin nombre'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">
                        {user.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${licenseStatus.bgColor}`}>
                          {licenseStatus.text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {user.role === 'superadmin' 
                          ? 'Permanente' 
                          : (license ? formatDate(license.expiryDate) : 'N/A')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {user.role !== 'superadmin' && (
                          <div className="flex space-x-2">
                            <button 
                              className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors duration-200"
                              onClick={() => handleShowRenewModal(user)}>
                              {license ? 'Renovar' : 'Activar'}
                            </button>
                            
                            {license && license.status !== 'blocked' && (
                              <button 
                                className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors duration-200"
                                onClick={() => handleShowBlockModal(user)}>
                                Bloquear
                              </button>
                            )}
                            
                            <button 
                              className="bg-red-500 hover:bg-red-600 text-white py-1 px-3 rounded-md text-xs font-medium transition-colors duration-200"
                              onClick={() => handleShowDeleteModal(user)}>
                              Eliminar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sección de información sobre licencias */}
      <div className="mt-8 bg-blue-50 rounded-md p-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Información sobre licencias</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Tipos de licencia:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Prueba</span>
                <span className="text-sm text-gray-600">Acceso limitado por 5 días</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Básica</span>
                <span className="text-sm text-gray-600">Acceso completo por 30 días</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Premium</span>
                <span className="text-sm text-gray-600">Acceso completo por 90 días con soporte</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Empresarial</span>
                <span className="text-sm text-gray-600">Acceso completo por 365 días con soporte prioritario</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Estados de licencia:</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Activa</span>
                <span className="text-sm text-gray-600">La licencia está vigente y el usuario tiene acceso completo</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Periodo de gracia</span>
                <span className="text-sm text-gray-600">La licencia ha expirado pero el usuario aún tiene acceso (2 días)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-gray-100 text-gray-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Expirada</span>
                <span className="text-sm text-gray-600">La licencia ha expirado y el usuario no tiene acceso</span>
              </li>
              <li className="flex items-start">
                <span className="inline-block bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">Bloqueada</span>
                <span className="text-sm text-gray-600">La licencia ha sido bloqueada manualmente</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Modal para renovar licencia */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-blue-600 text-white px-6 py-4">
              <h3 className="text-xl font-medium">
                {findLicenseForUser(selectedUser?._id) ? 'Renovar Licencia' : 'Activar Licencia'}
              </h3>
            </div>
            
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-700">{selectedUser?.username || selectedUser?.email || ''}</span>
                </div>
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Licencia</label>
                <div className="relative">
                  <select 
                    value={renewType} 
                    onChange={(e) => setRenewType(e.target.value)}
                    className="appearance-none w-full bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="TRIAL">Prueba (5 días)</option>
                    <option value="BASIC">Básica (30 días)</option>
                    <option value="PREMIUM">Premium (90 días)</option>
                    <option value="ENTERPRISE">Empresarial (365 días)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Duración (días)</label>
                <div className="relative rounded-md shadow-sm">
                  <input 
                    type="number" 
                    value={renewDays} 
                    onChange={(e) => setRenewDays(e.target.value)}
                    min="1"
                    max="999"
                    className="w-full border border-gray-300 rounded-md pl-3 pr-10 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">días</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowRenewModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleRenewLicense}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  {findLicenseForUser(selectedUser?._id) ? 'Renovar' : 'Activar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para bloquear licencia */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-yellow-500 text-white px-6 py-4">
              <h3 className="text-xl font-medium">Bloquear Licencia</h3>
            </div>
            
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">Usuario</label>
                <div className="flex items-center bg-gray-50 border border-gray-300 rounded-md px-3 py-2">
                  <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-gray-700">{selectedUser?.username || selectedUser?.email || ''}</span>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del bloqueo</label>
                <div className="mt-1">
                  <textarea 
                    rows="3"
                    value={blockReason} 
                    onChange={(e) => setBlockReason(e.target.value)}
                    placeholder="Ingrese el motivo del bloqueo"
                    className="shadow-sm focus:ring-yellow-500 focus:border-yellow-500 block w-full sm:text-sm border border-gray-300 rounded-md p-3"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">Este motivo quedará registrado en el historial de la licencia.</p>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Al bloquear la licencia, el usuario no podrá acceder al sistema hasta que sea renovada.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowBlockModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleBlockLicense}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Bloquear Licencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal para eliminar usuario */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className="bg-red-600 text-white px-6 py-4">
              <h3 className="text-xl font-medium">Eliminar Usuario</h3>
            </div>
            
            <div className="p-6">
              <div className="flex items-center justify-center mb-5 text-red-600">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              
              <div className="mb-6 text-center">
                <p className="text-gray-700 mb-2">¿Está seguro que desea eliminar el usuario <span className="font-semibold">{selectedUser?.username || selectedUser?.email}</span>?</p>
                <p className="text-gray-500 text-sm">Esta acción eliminará permanentemente el usuario y todas sus licencias asociadas. Esta acción no se puede deshacer.</p>
              </div>
              
              <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">
                      Al eliminar este usuario, se perderán todos sus datos y configuraciones personalizadas.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 flex items-center"
                >
                  <svg className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManagementFixed; 