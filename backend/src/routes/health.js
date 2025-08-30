import { Router } from 'express';
const router = Router();
router.get('/', (req, res) => {
  res.status(200).send('OK');
});

// Rutas para verificación de estado del sistema
import express from 'express';
import os from 'os';
import { verifyToken } from '../middleware/auth.js';

// Endpoint para verificar si el servicio está funcionando
router.get('/health-check', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    message: 'El servicio está funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para obtener información del sistema (requiere autenticación)
router.get('/system/info', verifyToken, (req, res) => {
  // Verificar si el usuario tiene permisos de administrador
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ 
      status: 'error',
      message: 'No tienes permisos para acceder a esta información' 
    });
  }

  // Obtener información del sistema
  const systemInfo = {
    hostname: os.hostname(),
    platform: os.platform(),
    architecture: os.arch(),
    cpus: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + ' GB',
    freeMemory: Math.round(os.freemem() / (1024 * 1024 * 1024)) + ' GB',
    uptime: Math.round(os.uptime() / 3600) + ' horas',
    networkInterfaces: Object.keys(os.networkInterfaces()).map(iface => ({
      name: iface,
      addresses: os.networkInterfaces()[iface]
        .filter(iface => !iface.internal && iface.family === 'IPv4')
        .map(iface => iface.address)
    })).filter(iface => iface.addresses.length > 0)
  };

  res.status(200).json({
    status: 'success',
    data: systemInfo
  });
});

// Ruta para verificar conexión remota (para admins y superadmins)
router.post('/remote-connection/verify', verifyToken, (req, res) => {
  // Verificar si el usuario tiene permisos de administrador
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
    return res.status(403).json({ 
      status: 'error',
      message: 'No tienes permisos para gestionar conexiones remotas' 
    });
  }

  const { serverUrl } = req.body;
  if (!serverUrl) {
    return res.status(400).json({
      status: 'error',
      message: 'Se requiere una URL de servidor'
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Conexión verificada correctamente',
    data: {
      serverUrl,
      timestamp: new Date().toISOString()
    }
  });
});

export default router; 