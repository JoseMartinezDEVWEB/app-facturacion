import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  IconButton, 
  Paper, 
  Stack, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  InputAdornment,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { API_URL } from '../../config/config';

const Proveedores = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [currentSupplier, setCurrentSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [supplierStats, setSupplierStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    withDebt: 0,
    topDebtSuppliers: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Formulario de proveedor
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    businessName: '',
    ruc: '',
    email: '',
    phone: '',
    address: '',
    contactPerson: '',
    notes: '',
    isActive: true
  });

  // Cargar proveedores
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar proveedores',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers/stats`);
      setSupplierStats(response.data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Efecto inicial
  useEffect(() => {
    fetchSuppliers();
    fetchStats();
  }, []);

  // Búsqueda de proveedores
  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchTerm.trim() === '') {
        fetchSuppliers();
        return;
      }
      
      const response = await axios.get(`${API_URL}/suppliers/search?term=${searchTerm}`);
      setSuppliers(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      setSnackbar({
        open: true,
        message: 'Error al buscar proveedores',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Manejo de cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    setSupplierForm({
      ...supplierForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Abrir diálogo para crear o editar
  const handleOpenDialog = (supplier = null) => {
    if (supplier) {
      setCurrentSupplier(supplier);
      setSupplierForm({
        name: supplier.name || '',
        businessName: supplier.businessName || '',
        ruc: supplier.ruc || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        contactPerson: supplier.contactPerson || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive
      });
    } else {
      setCurrentSupplier(null);
      setSupplierForm({
        name: '',
        businessName: '',
        ruc: '',
        email: '',
        phone: '',
        address: '',
        contactPerson: '',
        notes: '',
        isActive: true
      });
    }
    setOpenDialog(true);
  };

  // Guardar proveedor (crear o actualizar)
  const handleSaveSupplier = async () => {
    try {
      if (currentSupplier) {
        // Actualizar
        await axios.put(`${API_URL}/suppliers/${currentSupplier._id}`, supplierForm);
        setSnackbar({
          open: true,
          message: 'Proveedor actualizado con éxito',
          severity: 'success'
        });
      } else {
        // Crear
        await axios.post(`${API_URL}/suppliers`, supplierForm);
        setSnackbar({
          open: true,
          message: 'Proveedor creado con éxito',
          severity: 'success'
        });
      }
      setOpenDialog(false);
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      console.error('Error al guardar proveedor:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar proveedor',
        severity: 'error'
      });
    }
  };

  // Abrir diálogo de confirmación para eliminar
  const handleDeleteConfirm = (supplier) => {
    setCurrentSupplier(supplier);
    setConfirmDialog(true);
  };

  // Eliminar proveedor
  const handleDeleteSupplier = async () => {
    try {
      await axios.delete(`${API_URL}/suppliers/${currentSupplier._id}`);
      setSnackbar({
        open: true,
        message: 'Proveedor eliminado con éxito',
        severity: 'success'
      });
      setConfirmDialog(false);
      fetchSuppliers();
      fetchStats();
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      
      let errorMessage = 'Error al eliminar proveedor';
      
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
      setConfirmDialog(false);
    }
  };

  // Formatear cantidades como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Gestión de Proveedores
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Administre sus proveedores y vea sus estados de cuenta
        </Typography>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #bbdefb 0%, #90caf9 100%)',
            borderLeft: '4px solid #1976d2'
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="primary.dark" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Total de Proveedores
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary.dark">
                {supplierStats.total}
              </Typography>
              <Box sx={{ mt: 2, opacity: 0.7 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #c8e6c9 0%, #81c784 100%)',
            borderLeft: '4px solid #388e3c'
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="success.dark" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Proveedores Activos
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="success.dark">
                {supplierStats.active}
              </Typography>
              <Box sx={{ mt: 2, opacity: 0.7 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 11 12 14 22 4"></polyline>
                  <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #ffecb3 0%, #ffd54f 100%)',
            borderLeft: '4px solid #ffa000'
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="warning.dark" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Proveedores Inactivos
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="warning.dark">
                {supplierStats.inactive}
              </Typography>
              <Box sx={{ mt: 2, opacity: 0.7 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            height: '100%',
            background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)',
            borderLeft: '4px solid #d32f2f'
          }}>
            <CardContent>
              <Typography variant="subtitle2" color="error.dark" fontWeight="bold" gutterBottom sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Con Deuda Pendiente
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="error.dark">
                {supplierStats.withDebt}
              </Typography>
              <Box sx={{ mt: 2, opacity: 0.7 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #ffffff, #f9fafb)'
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ width: { xs: '100%', sm: 'auto' }, flexGrow: 1 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Buscar proveedores..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                sx: { 
                  borderRadius: 2,
                  '&:hover': { 
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
                  },
                  '&.Mui-focused': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }
              }}
              sx={{ backgroundColor: 'white' }}
            />
          </Box>
          <Stack direction="row" spacing={1}>
            <Button 
              variant="outlined" 
              startIcon={<RefreshIcon />} 
              onClick={() => {
                setSearchTerm('');
                fetchSuppliers();
              }}
              sx={{ 
                borderRadius: 2,
                borderWidth: 1.5,
                fontWeight: 'bold',
                textTransform: 'none',
                px: 2
              }}
            >
              Actualizar
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />} 
              onClick={() => handleOpenDialog()}
              sx={{ 
                borderRadius: 2,
                background: 'linear-gradient(45deg, #42a5f5 30%, #1976d2 90%)',
                boxShadow: '0 4px 10px rgba(25, 118, 210, 0.3)',
                fontWeight: 'bold',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2 30%, #1565c0 90%)',
                  boxShadow: '0 6px 12px rgba(25, 118, 210, 0.4)',
                }
              }}
            >
              Nuevo Proveedor
            </Button>
          </Stack>
        </Stack>
      </Paper>

      <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress sx={{ color: 'primary.main' }} />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Empresa</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>RUC</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Contacto</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Deuda Actual</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Estado</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Box sx={{ textAlign: 'center', p: 2 }}>
                        <Box sx={{ 
                          backgroundColor: 'grey.100', 
                          width: '60px', 
                          height: '60px', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          margin: '0 auto 16px'
                        }}>
                          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                          </svg>
                        </Box>
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                          No hay proveedores registrados
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Añade un nuevo proveedor para comenzar
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow 
                      key={supplier._id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                          transition: 'background-color 0.2s ease'
                        }
                      }}
                    >
                      <TableCell>
                        <Typography variant="body1" fontWeight="medium">{supplier.name}</Typography>
                      </TableCell>
                      <TableCell>{supplier.businessName || '-'}</TableCell>
                      <TableCell>{supplier.ruc || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2">{supplier.phone || '-'}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {supplier.email || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography
                          sx={{
                            color: supplier.currentDebt > 0 ? 'error.main' : 'success.main',
                            fontWeight: supplier.currentDebt > 0 ? 'bold' : 'normal',
                            backgroundColor: supplier.currentDebt > 0 ? 'error.lightest' : 'transparent',
                            py: supplier.currentDebt > 0 ? 0.5 : 0,
                            px: supplier.currentDebt > 0 ? 1 : 0,
                            borderRadius: 1,
                            display: 'inline-block'
                          }}
                        >
                          {formatCurrency(supplier.currentDebt || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            backgroundColor: supplier.isActive ? 'success.lightest' : 'grey.lightest',
                            color: supplier.isActive ? 'success.main' : 'text.disabled',
                            fontWeight: 'medium',
                            py: 0.5,
                            px: 1.5,
                            borderRadius: 10,
                            display: 'inline-block',
                            fontSize: '0.75rem'
                          }}
                        >
                          {supplier.isActive ? 'Activo' : 'Inactivo'}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          <Tooltip title="Editar proveedor">
                            <IconButton 
                              size="small" 
                              onClick={() => handleOpenDialog(supplier)}
                              sx={{ 
                                color: 'primary.main',
                                '&:hover': { 
                                  backgroundColor: 'primary.lightest',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Eliminar proveedor">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteConfirm(supplier)}
                              sx={{ 
                                color: 'error.main',
                                '&:hover': { 
                                  backgroundColor: 'error.lightest',
                                  transform: 'scale(1.1)'
                                },
                                transition: 'all 0.2s'
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Diálogo para crear/editar proveedor */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} mt={1}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="name"
                label="Nombre del Proveedor"
                value={supplierForm.name}
                onChange={handleFormChange}
                fullWidth
                required
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="businessName"
                label="Razón Social"
                value={supplierForm.businessName}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="ruc"
                label="RUC/Cédula"
                value={supplierForm.ruc}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="phone"
                label="Teléfono"
                value={supplierForm.phone}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="email"
                label="Correo Electrónico"
                value={supplierForm.email}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
                type="email"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="contactPerson"
                label="Persona de Contacto"
                value={supplierForm.contactPerson}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="address"
                label="Dirección"
                value={supplierForm.address}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notas Adicionales"
                value={supplierForm.notes}
                onChange={handleFormChange}
                fullWidth
                variant="outlined"
                margin="dense"
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveSupplier} 
            variant="contained" 
            color="primary"
            disabled={!supplierForm.name.trim()}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación para eliminar */}
      <Dialog open={confirmDialog} onClose={() => setConfirmDialog(false)}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de eliminar al proveedor {currentSupplier?.name}? Esta acción no se puede deshacer.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)}>
            Cancelar
          </Button>
          <Button onClick={handleDeleteSupplier} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar para notificaciones */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity} 
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Proveedores; 