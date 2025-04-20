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
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Proveedores
              </Typography>
              <Typography variant="h4">{supplierStats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proveedores Activos
              </Typography>
              <Typography variant="h4">{supplierStats.active}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proveedores Inactivos
              </Typography>
              <Typography variant="h4">{supplierStats.inactive}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Con Deuda Pendiente
              </Typography>
              <Typography variant="h4">{supplierStats.withDebt}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" mb={3} justifyContent="space-between">
          <TextField
            label="Buscar proveedores"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={handleSearch} edge="end">
                    <SearchIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ minWidth: { sm: 350 } }}
          />
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={() => {
                setSearchTerm('');
                fetchSuppliers();
              }}
            >
              Actualizar
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Nuevo Proveedor
            </Button>
          </Stack>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>RUC</TableCell>
                  <TableCell>Contacto</TableCell>
                  <TableCell>Deuda Actual</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay proveedores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  suppliers.map((supplier) => (
                    <TableRow key={supplier._id}>
                      <TableCell>{supplier.name}</TableCell>
                      <TableCell>{supplier.businessName || '-'}</TableCell>
                      <TableCell>{supplier.ruc || '-'}</TableCell>
                      <TableCell>
                        {supplier.phone || '-'}
                        <br />
                        <Typography variant="caption" color="textSecondary">
                          {supplier.email || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={supplier.currentDebt > 0 ? 'error' : 'textPrimary'}
                          fontWeight={supplier.currentDebt > 0 ? 'bold' : 'normal'}
                        >
                          {formatCurrency(supplier.currentDebt || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            color: supplier.isActive ? 'success.main' : 'text.disabled',
                            fontWeight: 'medium'
                          }}
                        >
                          {supplier.isActive ? 'Activo' : 'Inactivo'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar proveedor">
                          <IconButton
                            color="primary"
                            onClick={() => handleOpenDialog(supplier)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar proveedor">
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteConfirm(supplier)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
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