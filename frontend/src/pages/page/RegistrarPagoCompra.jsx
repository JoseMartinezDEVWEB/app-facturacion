import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Button, 
  Container, 
  Grid, 
  Paper, 
  Stack, 
  Typography, 
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  InputAdornment
} from '@mui/material';
// Importar íconos individualmente para evitar problemas
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { format } from 'date-fns';
import { API_URL } from '../../config/config';

const RegistrarPagoCompra = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estado del formulario de pago
  const [paymentForm, setPaymentForm] = useState({
    amount: 0,
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'efectivo',
    receiptNumber: '',
    notes: ''
  });

  // Cargar detalles de la compra
  useEffect(() => {
    const fetchPurchase = async () => {
      try {
        const response = await axios.get(`${API_URL}/credit-purchases/${id}`);
        const purchaseData = response.data.data;
        setPurchase(purchaseData);
        
        // Inicializar el monto del pago con el saldo pendiente
        setPaymentForm(prev => ({
          ...prev,
          amount: purchaseData.balance
        }));
        
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

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    
    // Si cambia el monto, asegurarse de que no exceda el saldo pendiente
    if (name === 'amount') {
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount >= 0) {
        setPaymentForm(prev => ({
          ...prev,
          [name]: Math.min(amount, purchase.balance)
        }));
      }
    } else {
      setPaymentForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Registrar el pago
  const handleSavePayment = async () => {
    // Validaciones
    if (paymentForm.amount <= 0) {
      setSnackbar({
        open: true,
        message: 'El monto del pago debe ser mayor a cero',
        severity: 'error'
      });
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${API_URL}/credit-purchases/${id}/payments`, paymentForm);
      
      setSnackbar({
        open: true,
        message: 'Pago registrado con éxito',
        severity: 'success'
      });
      
      // Redireccionar a la página de detalles
      setTimeout(() => {
        navigate(`/dashboard/compras-credito/${id}`);
      }, 1500);
    } catch (error) {
      console.error('Error al registrar pago:', error);
      setSnackbar({
        open: true,
        message: 'Error al registrar pago',
        severity: 'error'
      });
      setSaving(false);
    }
  };

  // Formatear cantidades como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!purchase) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
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

  if (purchase.status === 'pagada') {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" color="success.main" gutterBottom>
            Esta compra ya ha sido pagada en su totalidad
          </Typography>
          <Typography paragraph>
            No es necesario registrar más pagos. El saldo pendiente es {formatCurrency(0)}.
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/dashboard/compras-credito/${id}`)}
          >
            Volver a los detalles
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Registrar Pago
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/dashboard/compras-credito/${id}`)}
          >
            Volver
          </Button>
        </Stack>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Proveedor:</strong> {purchase.supplier?.name || 'No disponible'}
            </Typography>
            {purchase.invoiceNumber && (
              <Typography variant="body2">
                <strong>Factura:</strong> {purchase.invoiceNumber}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1">
              <strong>Total de la Compra:</strong> {formatCurrency(purchase.total)}
            </Typography>
            <Typography variant="subtitle1" color="error" fontWeight="bold">
              <strong>Saldo Pendiente:</strong> {formatCurrency(purchase.balance)}
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3 }} />

        <Typography variant="h6" gutterBottom>
          Información del Pago
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Monto del Pago"
              name="amount"
              type="number"
              value={paymentForm.amount}
              onChange={handleFormChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              label="Fecha de Pago"
              name="paymentDate"
              type="date"
              value={paymentForm.paymentDate}
              onChange={handleFormChange}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              required
              select
              label="Método de Pago"
              name="paymentMethod"
              value={paymentForm.paymentMethod}
              onChange={handleFormChange}
            >
              <MenuItem value="efectivo">Efectivo</MenuItem>
              <MenuItem value="transferencia">Transferencia</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
              <MenuItem value="otro">Otro</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Recibo/Referencia"
              name="receiptNumber"
              value={paymentForm.receiptNumber}
              onChange={handleFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notas"
              name="notes"
              multiline
              rows={3}
              value={paymentForm.notes}
              onChange={handleFormChange}
            />
          </Grid>
        </Grid>

        <Box mt={4} display="flex" justifyContent="flex-end">
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={handleSavePayment}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            {saving ? 'Guardando...' : 'Registrar Pago'}
          </Button>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/dashboard/compras-credito/${id}`)}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default RegistrarPagoCompra; 