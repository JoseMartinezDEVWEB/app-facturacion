import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
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
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  Divider,
  Autocomplete,
  InputAdornment,
  CircularProgress
} from '@mui/material';
import { 
  Add as AddIcon, 
  Delete as DeleteIcon,
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { API_URL } from '../../config/config';
import { format } from 'date-fns';

const CrearCompraCredito = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productQuantity, setProductQuantity] = useState(1);
  const [productPrice, setProductPrice] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Estado del formulario
  const [purchaseForm, setPurchaseForm] = useState({
    supplier: '',
    invoiceNumber: '',
    purchaseDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: '',
    items: [],
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0,
    notes: ''
  });

  // Cargar proveedores y productos
  useEffect(() => {
    const fetchData = async () => {
      try {
        const suppliersResponse = await axios.get(`${API_URL}/suppliers`);
        setSuppliers(suppliersResponse.data.data);

        const productsResponse = await axios.get(`${API_URL}/products`);
        setProducts(productsResponse.data);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar datos',
          severity: 'error'
        });
      }
    };

    fetchData();
  }, []);

  // Calcular los totales
  const calculateTotals = (items, discount = purchaseForm.discount, tax = purchaseForm.tax) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalWithDiscount = subtotal - discount;
    const totalWithTax = totalWithDiscount + tax;
    
    return {
      subtotal,
      total: Math.max(0, totalWithTax)
    };
  };

  // Manejar cambios en el formulario
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setPurchaseForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Recalcular totales si cambia descuento o impuesto
    if (name === 'discount' || name === 'tax') {
      const { subtotal, total } = calculateTotals(
        purchaseForm.items, 
        name === 'discount' ? Number(value) : purchaseForm.discount,
        name === 'tax' ? Number(value) : purchaseForm.tax
      );

      setPurchaseForm(prev => ({
        ...prev,
        subtotal,
        total
      }));
    }
  };

  // Agregar producto a la lista
  const handleAddProduct = () => {
    if (!selectedProduct || productQuantity <= 0 || productPrice <= 0) {
      setSnackbar({
        open: true,
        message: 'Por favor complete los datos del producto',
        severity: 'error'
      });
      return;
    }

    const totalPrice = productQuantity * productPrice;
    
    const newItem = {
      product: selectedProduct._id,
      productName: selectedProduct.name,
      quantity: productQuantity,
      unitPrice: productPrice,
      totalPrice
    };

    const updatedItems = [...purchaseForm.items, newItem];
    
    const { subtotal, total } = calculateTotals(updatedItems);

    setPurchaseForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }));

    // Limpiar selección
    setSelectedProduct(null);
    setProductQuantity(1);
    setProductPrice(0);
  };

  // Eliminar producto de la lista
  const handleRemoveProduct = (index) => {
    const updatedItems = purchaseForm.items.filter((_, i) => i !== index);
    
    const { subtotal, total } = calculateTotals(updatedItems);

    setPurchaseForm(prev => ({
      ...prev,
      items: updatedItems,
      subtotal,
      total
    }));
  };

  // Guardar la compra
  const handleSavePurchase = async () => {
    // Validaciones
    if (!purchaseForm.supplier) {
      setSnackbar({
        open: true,
        message: 'Debe seleccionar un proveedor',
        severity: 'error'
      });
      return;
    }

    if (!purchaseForm.dueDate) {
      setSnackbar({
        open: true,
        message: 'Debe establecer una fecha de vencimiento',
        severity: 'error'
      });
      return;
    }

    if (purchaseForm.items.length === 0) {
      setSnackbar({
        open: true,
        message: 'Debe agregar al menos un producto',
        severity: 'error'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/credit-purchases`, purchaseForm);
      
      setSnackbar({
        open: true,
        message: 'Compra a crédito registrada con éxito',
        severity: 'success'
      });
      
      // Redireccionar a la lista de compras
      setTimeout(() => {
        navigate('/dashboard/compras-credito');
      }, 1500);
    } catch (error) {
      console.error('Error al guardar la compra:', error);
      setSnackbar({
        open: true,
        message: 'Error al guardar la compra',
        severity: 'error'
      });
      setLoading(false);
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
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Nueva Compra a Crédito
          </Typography>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/dashboard/compras-credito')}
          >
            Volver
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {/* Datos generales de la compra */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Datos de la Compra
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" required>
                    <InputLabel id="supplier-label">Proveedor</InputLabel>
                    <Select
                      labelId="supplier-label"
                      id="supplier"
                      name="supplier"
                      value={purchaseForm.supplier}
                      onChange={handleFormChange}
                      label="Proveedor"
                    >
                      <MenuItem value="">
                        <em>Seleccione un proveedor</em>
                      </MenuItem>
                      {suppliers.map(supplier => (
                        <MenuItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Número de Factura"
                    name="invoiceNumber"
                    value={purchaseForm.invoiceNumber}
                    onChange={handleFormChange}
                    variant="outlined"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Compra"
                    name="purchaseDate"
                    value={purchaseForm.purchaseDate}
                    onChange={handleFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Fecha de Vencimiento"
                    name="dueDate"
                    value={purchaseForm.dueDate}
                    onChange={handleFormChange}
                    InputLabelProps={{ shrink: true }}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notas"
                    name="notes"
                    value={purchaseForm.notes}
                    onChange={handleFormChange}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Agregar productos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Agregar Productos
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={products}
                    getOptionLabel={(option) => option.name}
                    value={selectedProduct}
                    onChange={(event, newValue) => {
                      setSelectedProduct(newValue);
                      if (newValue) {
                        setProductPrice(newValue.price);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField 
                        {...params} 
                        label="Buscar producto" 
                        variant="outlined"
                        fullWidth
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={productQuantity}
                    onChange={(e) => setProductQuantity(Math.max(0.01, Number(e.target.value)))}
                    variant="outlined"
                    InputProps={{
                      inputProps: { min: 0.01, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Precio Unitario"
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(Math.max(0, Number(e.target.value)))}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    sx={{ height: '100%' }}
                  >
                    Agregar
                  </Button>
                </Grid>
              </Grid>
            </Paper>

            {/* Totales */}
            <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Totales
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Descuento"
                    name="discount"
                    type="number"
                    value={purchaseForm.discount}
                    onChange={handleFormChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Impuesto (IVA)"
                    name="tax"
                    type="number"
                    value={purchaseForm.tax}
                    onChange={handleFormChange}
                    variant="outlined"
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                      inputProps: { min: 0, step: 0.01 }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subtotal"
                    value={formatCurrency(purchaseForm.subtotal)}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Total"
                    value={formatCurrency(purchaseForm.total)}
                    variant="outlined"
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'primary.lighter',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Lista de productos */}
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Productos Seleccionados
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell align="right">Cantidad</TableCell>
                      <TableCell align="right">Precio Unitario</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchaseForm.items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No hay productos agregados
                        </TableCell>
                      </TableRow>
                    ) : (
                      purchaseForm.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell align="right">{formatCurrency(item.totalPrice)}</TableCell>
                          <TableCell align="center">
                            <IconButton
                              color="error"
                              onClick={() => handleRemoveProduct(index)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {/* Botones de acción */}
          <Grid item xs={12}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard/compras-credito')}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                onClick={handleSavePurchase}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Compra'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

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

export default CrearCompraCredito; 