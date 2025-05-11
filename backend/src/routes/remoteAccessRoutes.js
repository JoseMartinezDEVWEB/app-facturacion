import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import os from 'os';

const router = express.Router();

/**
 * Ruta para obtener métodos de conexión disponibles
 * Solo disponible para administradores y superadministradores
 */
router.get('/connection-methods', verifyToken, (req, res) => {
  // Verificar si el usuario tiene permisos adecuados
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ 
      status: 'error',
      message: 'No tienes permisos para acceder a esta información'
    });
  }

  // Obtener las interfaces de red
  const networkInterfaces = os.networkInterfaces();
  
  // Filtrar solo las interfaces IPv4 no internas
  const localAddresses = [];
  
  for (const [name, interfaces] of Object.entries(networkInterfaces)) {
    for (const iface of interfaces) {
      // Filtrar solo las interfaces IPv4 no internas
      if (!iface.internal && iface.family === 'IPv4') {
        localAddresses.push({
          name,
          address: iface.address
        });
      }
    }
  }

  res.status(200).json({
    status: 'success',
    methods: ['local', 'cloud'],
    localAddresses,
    serverInfo: {
      hostname: os.hostname(),
      platform: os.platform(),
      nodeVersion: process.version
    }
  });
});

/**
 * Ruta para registrar una nueva conexión remota
 */
router.post('/register-remote', verifyToken, (req, res) => {
  // Verificar si el usuario tiene permisos adecuados
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ 
      status: 'error',
      message: 'No tienes permisos para registrar conexiones remotas'
    });
  }

  const { serverUrl, deviceName, description } = req.body;

  if (!serverUrl) {
    return res.status(400).json({
      status: 'error',
      message: 'Se requiere una URL de servidor'
    });
  }

  // Aquí se podría guardar la conexión en la base de datos
  // Por ahora solo simulamos una respuesta exitosa

  res.status(200).json({
    status: 'success',
    message: 'Conexión remota registrada correctamente',
    data: {
      serverUrl,
      deviceName: deviceName || 'Dispositivo desconocido',
      description: description || '',
      registeredAt: new Date().toISOString(),
      registeredBy: req.user.email
    }
  });
});

/**
 * Ruta para obtener información sobre la configuración del servidor
 */
router.get('/server-info', verifyToken, (req, res) => {
  // Verificar si el usuario tiene permisos adecuados
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ 
      status: 'error',
      message: 'No tienes permisos para acceder a esta información'
    });
  }

  const serverInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    nodeVersion: process.version,
    interfaces: Object.entries(os.networkInterfaces())
      .reduce((acc, [name, interfaces]) => {
        const addresses = interfaces
          .filter(iface => !iface.internal && iface.family === 'IPv4')
          .map(iface => iface.address);
          
        if (addresses.length > 0) {
          acc.push({ name, addresses });
        }
        return acc;
      }, []),
    uptime: Math.floor(os.uptime() / 60) + ' minutos',
    env: process.env.NODE_ENV || 'development'
  };

  res.status(200).json({
    status: 'success',
    data: serverInfo
  });
});

export default router; 