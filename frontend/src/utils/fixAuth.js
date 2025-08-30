/**
 * Utilidad para verificar y corregir problemas de autenticación
 */
import { checkServerConnection } from '../config/axiosConfig';

// Función para simular un token de prueba (solo para depuración)
export const initializeTestToken = () => {
  if (!localStorage.getItem('token')) {
    console.warn('⚠️ Inicializando token de prueba. SOLO PARA DESARROLLO');
    localStorage.setItem('token', 'simulated-jwt-token');
  }
};

// Función para limpiar tokens
export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  console.log('🗑️ Tokens eliminados');
};

// Función para verificar si hay token
export const checkTokenExists = () => {
  const token = localStorage.getItem('token');
  console.log(`🔍 Token ${token ? 'presente' : 'ausente'}: ${token ? token.substring(0, 20) + '...' : 'No hay token'}`);
  return !!token;
};

// Función para verificar la conexión al servidor
export const verifyServerConnection = async () => {
  console.log('🔄 Verificando conexión con el servidor...');
  const isAvailable = await checkServerConnection();
  console.log(`🖥️ El servidor está ${isAvailable ? '✅ disponible' : '❌ no disponible'}`);
  return isAvailable;
};

// Función para imprimir información de depuración
export const printAuthDebugInfo = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  console.log('📊 Información de autenticación:');
  console.log(`- Token: ${token ? '✅ Presente' : '❌ Ausente'}`);
  console.log(`- Refresh Token: ${refreshToken ? '✅ Presente' : '❌ Ausente'}`);
  
  // Verificar la conexión al servidor en entorno de desarrollo
  if (process.env.NODE_ENV === 'development') {
    try {
      const serverAvailable = await verifyServerConnection();
      console.log(`- Conexión al servidor: ${serverAvailable ? '✅ Disponible' : '❌ No disponible'}`);
    } catch (err) {
      console.error('- Conexión al servidor: ❌ Error al verificar');
    }
  }
  
  // Verificar si estamos en un entorno de desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log('🛠️ Modo de desarrollo activo');
    console.log('Puedes usar las siguientes funciones para depurar:');
    console.log('- initializeTestToken(): Crea un token de prueba');
    console.log('- clearTokens(): Elimina todos los tokens');
    console.log('- checkTokenExists(): Verifica si existe un token');
    console.log('- verifyServerConnection(): Verifica la conexión con el servidor');
  }
};

// Ejecutar al importar este módulo
printAuthDebugInfo(); 