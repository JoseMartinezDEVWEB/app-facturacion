import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, Typography, TextField, Button, Switch, FormControlLabel, Box, Alert, Divider, Paper, Grid } from '@mui/material';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import ComputerIcon from '@mui/icons-material/Computer';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';

const RemoteConnectionSettings = () => {
  const { 
    isRemoteEnabled, 
    remoteStatus, 
    remoteConfig, 
    connectToRemote, 
    disconnectFromRemote, 
    switchConnectionMode,
    canUseRemoteConnection
  } = useRemoteConnection();
  
  const { user } = useAuth();
  const [serverUrl, setServerUrl] = useState(remoteConfig.serverUrl || '');
  const [message, setMessage] = useState({ text: '', type: 'info' });
  
  // Check if user can access this feature
  const canAccess = canUseRemoteConnection();
  console.log('Resultado de verificación de acceso a RemoteConnectionSettings:', {
    canAccess,
    userRole: user?.role,
    isRemoteEnabled
  });

  if (!canAccess) {
    return (
      <Card sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
        <CardContent>
          <Alert severity="error">
            No tienes permisos para acceder a esta función. Solo los usuarios con rol de Superadministrador y Administrador pueden configurar conexiones remotas.
          </Alert>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Tu rol actual es: {user?.role || 'No detectado'}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // Handle connect/disconnect
  const handleToggleConnection = async () => {
    if (isRemoteEnabled) {
      // Disconnect
      const result = disconnectFromRemote();
      setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    } else {
      // Connect
      if (!serverUrl.trim()) {
        setMessage({ text: 'Por favor, ingresa una URL de servidor válida', type: 'error' });
        return;
      }
      
      const result = await connectToRemote(serverUrl);
      setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
    }
  };

  // Handle mode switch
  const handleModeSwitch = (e) => {
    const mode = e.target.checked ? 'local' : 'cloud';
    const result = switchConnectionMode(mode);
    setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CloudSyncIcon sx={{ mr: 1 }} /> Configuración de Conexión Remota
      </Typography>
      
      {message.text && (
        <Alert severity={message.type} sx={{ mb: 3 }}>
          {message.text}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Estado de Conexión
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {isRemoteEnabled ? <WifiIcon color="success" /> : <WifiOffIcon color="disabled" />}
              <Typography variant="body1" sx={{ ml: 1 }}>
                Estado: {isRemoteEnabled ? 'Conectado' : 'Desconectado'}
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Usuario: {user?.name || 'N/A'} (Rol: {user?.role || 'N/A'})
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <TextField
              label="URL del servidor remoto"
              variant="outlined"
              fullWidth
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="https://tu-servidor-remoto.com/api"
              disabled={isRemoteEnabled}
              sx={{ mb: 2 }}
            />
            
            <Button
              variant="contained"
              color={isRemoteEnabled ? "error" : "primary"}
              onClick={handleToggleConnection}
              fullWidth
              sx={{ mt: 1 }}
            >
              {isRemoteEnabled ? 'Desconectar' : 'Conectar'}
            </Button>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Modo de Conexión
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={remoteConfig.localMode}
                  onChange={handleModeSwitch}
                  color="primary"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {remoteConfig.localMode ? <ComputerIcon sx={{ mr: 1 }} /> : <CloudSyncIcon sx={{ mr: 1 }} />}
                  <Typography>
                    {remoteConfig.localMode ? 'Modo Local' : 'Modo Nube'}
                  </Typography>
                </Box>
              }
            />
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Modo Local:</strong> La aplicación se conecta a un servidor local en la misma red.
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Modo Nube:</strong> La aplicación se conecta a un servidor en la nube.
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              {remoteConfig.localMode 
                ? 'En modo local, asegúrate de que el servidor esté funcionando en la misma red.' 
                : 'En modo nube, tu aplicación estará disponible desde cualquier ubicación con conexión a internet.'}
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RemoteConnectionSettings; 