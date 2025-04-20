import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Paper, 
  Stack, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Typography, 
  Divider,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Link
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  ReceiptLong as ReceiptIcon,
  CalendarMonth as CalendarIcon,
  Person as PersonIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { API_URL } from '../../config/config';

const DetalleCompraCredito = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Cargar detalles de la compra
  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await axios.get(`${API_URL}/credit-purchases/${id}`);
        setPurchase(response.data.data);
        setLoading(false);
      } catch (error) {
        console.error('Error al cargar detalles de la compra:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar detalles de la compra',
          severity: 'error'
        });
        setLoading(false);
      }
    };

    fetchPurchase();
  }, [id]);

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

  // Formatear fecha con hora
  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
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

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!purchase) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" color="error" gutterBottom>
            Error al cargar detalles
          </Typography>
          <Typography paragraph>
            No se pudo encontrar la compra a crédito solicitada.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/compras-credito')}
          >
            Volver a la lista
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Detalle de Compra a Crédito
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard/compras-credito')}
        >
          Volver
        </Button>
      </Stack>

      {/* Información general */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <PersonIcon color="primary" />
                <Typography variant="h6" component="span">
                  Proveedor:
                </Typography>
                <Typography variant="body1" component="span" fontWeight="medium">
                  {purchase.supplier?.name || 'No disponible'}
                </Typography>
              </Box>
              {purchase.supplier?.businessName && (
                <Typography variant="body2">
                  <strong>Razón Social:</strong> {purchase.supplier.businessName}
                </Typography>
              )}
              {purchase.supplier?.ruc && (
                <Typography variant="body2">
                  <strong>RUC:</strong> {purchase.supplier.ruc}
                </Typography>
              )}
              {purchase.invoiceNumber && (
                <Typography variant="body2">
                  <strong>Número de Factura:</strong> {purchase.invoiceNumber}
                </Typography>
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={6}>
            <Stack spacing={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <CalendarIcon color="primary" />
                <Typography variant="h6" component="span">
                  Fechas:
                </Typography>
              </Box>
              <Typography variant="body2">
                <strong>Fecha de Compra:</strong> {formatDate(purchase.purchaseDate)}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha de Vencimiento:</strong> {formatDate(purchase.dueDate)}
              </Typography>
              <Typography variant="body2">
                <strong>Creado el:</strong> {formatDateTime(purchase.createdAt)}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="h6">
                  Estado:
                </Typography>
                <Chip
                  label={getStatusText(purchase.status)}
                  color={getStatusColor(purchase.status)}
                  sx={{ mt: 1 }}
                />
              </Box>
              <Box textAlign="right">
                <Typography variant="body2">
                  <strong>Subtotal:</strong> {formatCurrency(purchase.subtotal)}
                </Typography>
                {purchase.discount > 0 && (
                  <Typography variant="body2">
                    <strong>Descuento:</strong> {formatCurrency(purchase.discount)}
                  </Typography>
                )}
                {purchase.tax > 0 && (
                  <Typography variant="body2">
                    <strong>Impuesto:</strong> {formatCurrency(purchase.tax)}
                  </Typography>
                )}
                <Typography variant="h6" sx={{ mt: 1 }}>
                  <strong>Total:</strong> {formatCurrency(purchase.total)}
                </Typography>
                {purchase.balance > 0 && (
                  <Typography variant="h6" color="error" fontWeight="bold">
                    <strong>Saldo Pendiente:</strong> {formatCurrency(purchase.balance)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Grid>
          {purchase.status !== 'pagada' && purchase.status !== 'cancelada' && (
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="success"
                startIcon={<PaymentIcon />}
                component={RouterLink}
                to={`/dashboard/compras-credito/${purchase._id}/pago`}
                sx={{ mt: 2 }}
              >
                Registrar Pago
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Productos comprados */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Productos Comprados
        </Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Producto</TableCell>
                <TableCell align="right">Cantidad</TableCell>
                <TableCell align="right">Precio Unitario</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {purchase.items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {item.product?.name || 'Producto no disponible'}
                    {item.product?.reference && (
                      <Typography variant="caption" display="block" color="textSecondary">
                        Ref: {item.product.reference}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Historial de pagos */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <MoneyIcon color="primary" />
          <Typography variant="h5">
            Historial de Pagos
          </Typography>
        </Box>
        
        {purchase.payments.length === 0 ? (
          <Typography variant="body1" sx={{ my: 2 }}>
            No hay pagos registrados para esta compra.
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Monto</TableCell>
                  <TableCell>Método de Pago</TableCell>
                  <TableCell>Número de Recibo</TableCell>
                  <TableCell>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchase.payments.map((payment, index) => (
                  <TableRow key={index}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      {payment.paymentMethod === 'efectivo' ? 'Efectivo' : 
                       payment.paymentMethod === 'transferencia' ? 'Transferencia' : 
                       payment.paymentMethod === 'cheque' ? 'Cheque' : 'Otro'}
                    </TableCell>
                    <TableCell>{payment.receiptNumber || '-'}</TableCell>
                    <TableCell>{payment.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Notas */}
      {purchase.notes && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            Notas Adicionales
          </Typography>
          <Typography variant="body1">
            {purchase.notes}
          </Typography>
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

export default DetalleCompraCredito; 