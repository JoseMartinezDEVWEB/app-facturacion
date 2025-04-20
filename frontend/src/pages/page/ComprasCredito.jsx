import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link as RouterLink } from 'react-router-dom';
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
  DialogTitle,
  Snackbar,
  Alert,
  Tooltip,
  Card,
  CardContent,
  CircularProgress,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Tab,
  Tabs,
  Link
} from '@mui/material';
import { 
  Add as AddIcon, 
  CalendarMonth as CalendarIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_URL } from '../../config/config';

const ComprasCredito = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams, setSearchParams] = useState({
    status: '',
    supplier: '',
    startDate: '',
    endDate: ''
  });
  const [suppliers, setSuppliers] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [stats, setStats] = useState({
    totalPurchases: 0,
    byStatus: {
      pending: 0,
      partial: 0,
      paid: 0,
      cancelled: 0
    },
    totalDebt: 0,
    upcomingDuePayments: [],
    overduePayments: []
  });
  const [tabValue, setTabValue] = useState(0);

  // Cargar compras a crédito
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      // Construir parámetros de consulta
      const queryParams = new URLSearchParams();
      
      if (searchParams.status) {
        queryParams.append('status', searchParams.status);
      }
      
      if (searchParams.supplier) {
        queryParams.append('supplier', searchParams.supplier);
      }
      
      if (searchParams.startDate) {
        queryParams.append('startDate', searchParams.startDate);
      }
      
      if (searchParams.endDate) {
        queryParams.append('endDate', searchParams.endDate);
      }
      
      const response = await axios.get(`${API_URL}/credit-purchases?${queryParams}`);
      setPurchases(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar compras a crédito:', error);
      setSnackbar({
        open: true,
        message: 'Error al cargar compras a crédito',
        severity: 'error'
      });
      setLoading(false);
    }
  };

  // Cargar estadísticas
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/credit-purchases/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  // Cargar proveedores
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_URL}/suppliers`);
      setSuppliers(response.data.data);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  // Efecto inicial
  useEffect(() => {
    fetchPurchases();
    fetchStats();
    fetchSuppliers();
  }, []);

  // Manejo de cambios en los parámetros de búsqueda
  const handleSearchParamChange = (e) => {
    setSearchParams({
      ...searchParams,
      [e.target.name]: e.target.value
    });
  };

  // Realizar búsqueda
  const handleSearch = () => {
    fetchPurchases();
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setSearchParams({
      status: '',
      supplier: '',
      startDate: '',
      endDate: ''
    });
    fetchPurchases();
  };

  // Cambiar pestaña
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Formatear cantidades como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  // Obtener color según estado
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'warning';
      case 'parcial':
        return 'info';
      case 'pagada':
        return 'success';
      case 'cancelada':
        return 'error';
      default:
        return 'default';
    }
  };

  // Obtener texto según estado
  const getStatusText = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'parcial':
        return 'Pago Parcial';
      case 'pagada':
        return 'Pagada';
      case 'cancelada':
        return 'Cancelada';
      default:
        return status;
    }
  };

  return (
    <Container maxWidth="xl">
      <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          Compras a Crédito
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Gestione sus compras a crédito y pagos a proveedores
        </Typography>
      </Box>

      {/* Tarjetas de estadísticas */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Total de Compras
              </Typography>
              <Typography variant="h4">{stats.totalPurchases}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pendientes
              </Typography>
              <Typography variant="h4">{stats.byStatus.pending}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pago Parcial
              </Typography>
              <Typography variant="h4">{stats.byStatus.partial}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Deuda Total
              </Typography>
              <Typography variant="h4" color="error">
                {formatCurrency(stats.totalDebt)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pestañas */}
      <Paper sx={{ mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Compras a Crédito" />
          <Tab label="Próximos Vencimientos" />
          <Tab label="Pagos Vencidos" />
        </Tabs>
      </Paper>

      {/* Contenido según la pestaña seleccionada */}
      {tabValue === 0 && (
        <>
          {/* Filtros de búsqueda */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Filtros de Búsqueda
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="status-label">Estado</InputLabel>
                  <Select
                    labelId="status-label"
                    id="status"
                    name="status"
                    value={searchParams.status}
                    onChange={handleSearchParamChange}
                    label="Estado"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    <MenuItem value="pendiente">Pendiente</MenuItem>
                    <MenuItem value="parcial">Pago Parcial</MenuItem>
                    <MenuItem value="pagada">Pagada</MenuItem>
                    <MenuItem value="cancelada">Cancelada</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth variant="outlined" size="small">
                  <InputLabel id="supplier-label">Proveedor</InputLabel>
                  <Select
                    labelId="supplier-label"
                    id="supplier"
                    name="supplier"
                    value={searchParams.supplier}
                    onChange={handleSearchParamChange}
                    label="Proveedor"
                  >
                    <MenuItem value="">Todos</MenuItem>
                    {suppliers.map(supplier => (
                      <MenuItem key={supplier._id} value={supplier._id}>
                        {supplier.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Inicial"
                  name="startDate"
                  value={searchParams.startDate}
                  onChange={handleSearchParamChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  type="date"
                  label="Fecha Final"
                  name="endDate"
                  value={searchParams.endDate}
                  onChange={handleSearchParamChange}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={12}>
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleClearFilters}
                    startIcon={<RefreshIcon />}
                  >
                    Limpiar Filtros
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleSearch}
                    startIcon={<SearchIcon />}
                  >
                    Buscar
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          </Paper>

          {/* Lista de compras a crédito */}
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Stack direction="row" spacing={2} alignItems="center" mb={3} justifyContent="space-between">
              <Typography variant="h6">
                Lista de Compras a Crédito
              </Typography>
              <Button
                variant="contained"
                color="primary"
                component={RouterLink}
                to="/dashboard/crear-compra-credito"
                startIcon={<AddIcon />}
              >
                Nueva Compra
              </Button>
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
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Factura</TableCell>
                      <TableCell>Fecha Compra</TableCell>
                      <TableCell>Vencimiento</TableCell>
                      <TableCell>Total</TableCell>
                      <TableCell>Saldo</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchases.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center">
                          No hay compras a crédito registradas
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchases.map((purchase) => (
                        <TableRow key={purchase._id}>
                          <TableCell>
                            {purchase.supplier?.name || 'Proveedor no disponible'}
                          </TableCell>
                          <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                          <TableCell>{formatDate(purchase.purchaseDate)}</TableCell>
                          <TableCell>{formatDate(purchase.dueDate)}</TableCell>
                          <TableCell>{formatCurrency(purchase.total)}</TableCell>
                          <TableCell>
                            <Typography
                              color={purchase.balance > 0 ? 'error' : 'success.main'}
                              fontWeight="medium"
                            >
                              {formatCurrency(purchase.balance)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(purchase.status)}
                              color={getStatusColor(purchase.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Ver detalles">
                              <IconButton
                                color="primary"
                                component={RouterLink}
                                to={`/dashboard/compras-credito/${purchase._id}`}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {purchase.status !== 'pagada' && purchase.status !== 'cancelada' && (
                              <Tooltip title="Registrar pago">
                                <IconButton
                                  color="success"
                                  component={RouterLink}
                                  to={`/dashboard/compras-credito/${purchase._id}/pago`}
                                >
                                  <PaymentIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </>
      )}

      {/* Próximos vencimientos */}
      {tabValue === 1 && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Próximos Vencimientos (7 días)
          </Typography>
          
          {stats.upcomingDuePayments.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              No hay vencimientos próximos.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Factura</TableCell>
                    <TableCell>Fecha Vencimiento</TableCell>
                    <TableCell>Saldo Pendiente</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.upcomingDuePayments.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                      <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                      <TableCell>{formatDate(purchase.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(purchase.balance)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          color="primary"
                          component={RouterLink}
                          to={`/dashboard/compras-credito/${purchase._id}`}
                        >
                          Ver Detalles
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Pagos vencidos */}
      {tabValue === 2 && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="error">
            Pagos Vencidos
          </Typography>
          
          {stats.overduePayments.length === 0 ? (
            <Typography variant="body1" sx={{ p: 2 }}>
              No hay pagos vencidos.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Factura</TableCell>
                    <TableCell>Fecha Vencimiento</TableCell>
                    <TableCell>Saldo Pendiente</TableCell>
                    <TableCell align="center">Acción</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.overduePayments.map((purchase) => (
                    <TableRow key={purchase._id} sx={{ backgroundColor: 'error.lighter' }}>
                      <TableCell>{purchase.supplier?.name || '-'}</TableCell>
                      <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                      <TableCell>{formatDate(purchase.dueDate)}</TableCell>
                      <TableCell>{formatCurrency(purchase.balance)}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="contained"
                          size="small"
                          color="error"
                          component={RouterLink}
                          to={`/dashboard/compras-credito/${purchase._id}/pago`}
                        >
                          Registrar Pago
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

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

export default ComprasCredito; 