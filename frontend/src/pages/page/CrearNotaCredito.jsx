import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  Row, 
  Col, 
  Table,
  Alert,
  Spinner
} from 'reactstrap';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { getInvoiceById } from '../../services/invoiceService';
import { createCreditNote } from '../../services/creditNoteService';
import Swal from 'sweetalert2';

const CrearNotaCredito = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState(null);
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [creditNote, setCreditNote] = useState({
    facturaRelacionada: invoiceId,
    cliente: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    items: [],
    observaciones: '',
    subtotal: 0,
    iva: 0,
    total: 0
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        const response = await getInvoiceById(invoiceId);
        setInvoice(response.data);
        
        // Pre-llenar datos del cliente desde la factura
        if (response.data && response.data.customer) {
          setCreditNote(prev => ({
            ...prev,
            cliente: response.data.customer._id || '',
            // Establecer valores iniciales basados en la factura
            subtotal: 0,
            iva: 0,
            total: 0
          }));
          
          // Preparar los ítems de la factura para selección
          const invoiceItems = response.data.items.map(item => ({
            _id: item._id,
            invoiceItemId: item._id,
            producto: item.product,
            descripcion: item.product.name,
            cantidad: item.quantity,
            cantidadMax: item.quantity, // Cantidad máxima que se puede seleccionar
            precioUnitario: item.price,
            subtotal: item.subtotal,
            selected: false,
            cantidadDevolver: 0
          }));
          setSelectedItems(invoiceItems);
        }
        
        setError('');
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Error al cargar la factura. ' + (err.message || 'Por favor, inténtelo de nuevo.'));
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  // Calcular totales basados en los items seleccionados
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.cantidadDevolver * item.precioUnitario), 0);
    const iva = subtotal * 0.12; // Asumiendo IVA de 12%
    const total = subtotal + iva;
    
    return { subtotal, iva, total };
  };

  // Manejar cambios en campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCreditNote({
      ...creditNote,
      [name]: value
    });
  };

  // Manejar cambio en la cantidad a devolver de un item
  const handleItemQuantityChange = (index, value) => {
    const newValue = parseInt(value) || 0;
    const updatedItems = [...selectedItems];
    
    // Asegurar que la cantidad no exceda la cantidad original
    updatedItems[index].cantidadDevolver = Math.min(newValue, updatedItems[index].cantidadMax);
    
    setSelectedItems(updatedItems);
    
    // Actualizar los items en el formulario de nota de crédito
    const creditNoteItems = updatedItems
      .filter(item => item.cantidadDevolver > 0)
      .map(item => ({
        producto: item.producto._id,
        cantidad: item.cantidadDevolver,
        precioUnitario: item.precioUnitario,
        descripcion: item.descripcion
      }));
    
    const { subtotal, iva, total } = calculateTotals(updatedItems);
    
    setCreditNote(prev => ({
      ...prev,
      items: creditNoteItems,
      subtotal,
      iva,
      total
    }));
  };

  // Validar formulario antes de enviar
  const validateForm = () => {
    if (!creditNote.motivo.trim()) {
      setError('Debe especificar un motivo para la nota de crédito');
      return false;
    }
    
    if (!creditNote.items.length) {
      setError('Debe seleccionar al menos un ítem para la devolución');
      return false;
    }
    
    return true;
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoadingSubmit(true);
      setError('');
      
      // Crear la nota de crédito
      const result = await createCreditNote({
        ...creditNote,
        facturaRelacionada: invoiceId
      });
      
      Swal.fire({
        title: '¡Éxito!',
        text: 'Nota de crédito creada correctamente',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/dashboard/notas-credito');
      });
    } catch (err) {
      console.error('Error creating credit note:', err);
      setError('Error al crear la nota de crédito: ' + (err.message || 'Error desconocido'));
      
      Swal.fire({
        title: 'Error',
        text: 'No se pudo crear la nota de crédito: ' + (err.message || 'Error desconocido'),
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setLoadingSubmit(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Crear Nota de Crédito</h1>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              <FaArrowLeft className="mr-2" /> Volver
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <Spinner color="primary" />
            <p className="mt-2">Cargando datos de la factura...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert color="danger">{error}</Alert>
            <div className="text-center mt-4">
              <Button color="secondary" onClick={() => navigate(-1)}>
                <FaArrowLeft className="mr-2" /> Volver
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <Form onSubmit={handleSubmit}>
              {error && <Alert color="danger">{error}</Alert>}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h2 className="text-lg font-semibold mb-3">Información de la Factura</h2>
                  <div className="bg-gray-50 p-4 rounded border">
                    <p><strong>Número:</strong> {invoice?.receiptNumber}</p>
                    <p><strong>Fecha:</strong> {invoice ? new Date(invoice.dateTime).toLocaleDateString() : ''}</p>
                    <p><strong>Cliente:</strong> {invoice?.customer.name}</p>
                    <p><strong>Total:</strong> ${invoice?.total.toFixed(2)}</p>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-lg font-semibold mb-3">Datos de la Nota de Crédito</h2>
                  <FormGroup>
                    <Label for="fecha">Fecha</Label>
                    <Input
                      type="date"
                      name="fecha"
                      id="fecha"
                      value={creditNote.fecha}
                      onChange={handleChange}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <Label for="motivo">Motivo de la Nota de Crédito</Label>
                    <Input
                      type="select"
                      name="motivo"
                      id="motivo"
                      value={creditNote.motivo}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un motivo</option>
                      <option value="Devolución de mercadería">Devolución de mercadería</option>
                      <option value="Error en facturación">Error en facturación</option>
                      <option value="Descuento posterior">Descuento posterior</option>
                      <option value="Producto defectuoso">Producto defectuoso</option>
                      <option value="Otro">Otro</option>
                    </Input>
                  </FormGroup>
                </div>
              </div>
              
              <h2 className="text-lg font-semibold mb-3">Productos a Incluir</h2>
              <div className="overflow-x-auto">
                <Table className="min-w-full bg-white">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="py-2 px-4 text-left">Producto</th>
                      <th className="py-2 px-4 text-right">Cant. Original</th>
                      <th className="py-2 px-4 text-right">Precio Unit.</th>
                      <th className="py-2 px-4 text-right">Cant. a Devolver</th>
                      <th className="py-2 px-4 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedItems.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="py-2 px-4">{item.descripcion}</td>
                        <td className="py-2 px-4 text-right">{item.cantidad}</td>
                        <td className="py-2 px-4 text-right">${item.precioUnitario.toFixed(2)}</td>
                        <td className="py-2 px-4 text-right">
                          <Input
                            type="number"
                            min="0"
                            max={item.cantidadMax}
                            value={item.cantidadDevolver}
                            onChange={(e) => handleItemQuantityChange(index, e.target.value)}
                            className="w-20 text-right ml-auto"
                          />
                        </td>
                        <td className="py-2 px-4 text-right">
                          ${(item.cantidadDevolver * item.precioUnitario).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              <div className="mt-6 flex justify-end">
                <div className="w-full max-w-xs space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${creditNote.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA (12%):</span>
                    <span>${creditNote.iva.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>${creditNote.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <FormGroup className="mt-6">
                <Label for="observaciones">Observaciones</Label>
                <Input
                  type="textarea"
                  name="observaciones"
                  id="observaciones"
                  value={creditNote.observaciones}
                  onChange={handleChange}
                  rows="3"
                />
              </FormGroup>
              
              <div className="mt-6 flex justify-between">
                <Button
                  type="button"
                  color="secondary"
                  onClick={() => navigate(-1)}
                  className="flex items-center"
                >
                  <FaArrowLeft className="mr-2" /> Cancelar
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  disabled={loadingSubmit}
                  className="flex items-center"
                >
                  {loadingSubmit ? (
                    <>
                      <Spinner size="sm" className="mr-2" /> Procesando...
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-2" /> Guardar Nota de Crédito
                    </>
                  )}
                </Button>
              </div>
            </Form>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CrearNotaCredito; 