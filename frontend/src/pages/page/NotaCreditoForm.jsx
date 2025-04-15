import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { createCreditNote, getCreditNoteById, updateCreditNote } from '../../services/creditNoteService';
import Swal from 'sweetalert2';

const NotaCreditoForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  const [creditNote, setCreditNote] = useState({
    cliente: '',
    facturaRelacionada: '',
    fecha: new Date().toISOString().split('T')[0],
    motivo: '',
    items: [],
    observaciones: '',
    subtotal: 0,
    iva: 0,
    total: 0
  });

  // Cargar la nota de crédito si estamos editando
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Cargar clientes (simulado por ahora)
        // En un caso real, llamarías a un servicio como clienteService.getAllClientes()
        setClientes([
          { _id: '1', nombre: 'Cliente Ejemplo 1', ruc: '9999999999001' },
          { _id: '2', nombre: 'Cliente Ejemplo 2', ruc: '9999999999002' }
        ]);
        
        // Cargar facturas (simulado por ahora)
        // En un caso real, llamarías a un servicio como facturaService.getAllFacturas()
        setFacturas([
          { _id: '1', numero: 'F001-001', cliente: '1', total: 100 },
          { _id: '2', numero: 'F001-002', cliente: '2', total: 200 }
        ]);
        
        // Si estamos editando, cargar la nota de crédito
        if (isEditing) {
          const noteData = await getCreditNoteById(id);
          setCreditNote({
            ...noteData,
            fecha: new Date(noteData.fecha).toISOString().split('T')[0]
          });
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Error al cargar los datos iniciales. Por favor, inténtelo de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id, isEditing]);

  // Función para calcular los totales
  const calculateTotals = (items) => {
    const subtotal = items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0);
    const iva = subtotal * 0.12; // Asumiendo IVA de 12%
    const total = subtotal + iva;
    
    return { subtotal, iva, total };
  };

  // Manejar el cambio en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si el campo es facturaRelacionada, cargar los ítems de esa factura
    if (name === 'facturaRelacionada') {
      const selectedFactura = facturas.find(f => f._id === value);
      // Aquí deberías cargar los ítems de la factura seleccionada
      // Simulamos algunos ítems para este ejemplo
      const itemsFromInvoice = [
        { _id: '1', descripcion: 'Producto 1', cantidad: 2, precioUnitario: 50 },
        { _id: '2', descripcion: 'Producto 2', cantidad: 1, precioUnitario: 100 }
      ];
      setSelectedItems(itemsFromInvoice);
    }
    
    setCreditNote({
      ...creditNote,
      [name]: value
    });
  };

  // Agregar un ítem a la nota de crédito
  const handleAddItem = (item) => {
    const newItems = [...creditNote.items, item];
    const { subtotal, iva, total } = calculateTotals(newItems);
    
    setCreditNote({
      ...creditNote,
      items: newItems,
      subtotal,
      iva,
      total
    });
  };

  // Eliminar un ítem de la nota de crédito
  const handleRemoveItem = (index) => {
    const newItems = creditNote.items.filter((_, i) => i !== index);
    const { subtotal, iva, total } = calculateTotals(newItems);
    
    setCreditNote({
      ...creditNote,
      items: newItems,
      subtotal,
      iva,
      total
    });
  };

  // Modificar un ítem existente
  const handleItemChange = (index, field, value) => {
    const newItems = [...creditNote.items];
    newItems[index] = {
      ...newItems[index],
      [field]: field === 'cantidad' || field === 'precioUnitario' ? parseFloat(value) : value
    };
    
    const { subtotal, iva, total } = calculateTotals(newItems);
    
    setCreditNote({
      ...creditNote,
      items: newItems,
      subtotal,
      iva,
      total
    });
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!creditNote.cliente) {
      setError('Debe seleccionar un cliente');
      return;
    }
    
    if (creditNote.items.length === 0) {
      setError('Debe añadir al menos un ítem a la nota de crédito');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      let result;
      if (isEditing) {
        result = await updateCreditNote(id, creditNote);
      } else {
        result = await createCreditNote(creditNote);
      }
      
      Swal.fire({
        title: '¡Éxito!',
        text: isEditing ? 'Nota de crédito actualizada correctamente' : 'Nota de crédito creada correctamente',
        icon: 'success',
        confirmButtonText: 'OK'
      }).then(() => {
        navigate('/notas-credito');
      });
    } catch (err) {
      console.error('Error saving credit note:', err);
      setError(`Error al ${isEditing ? 'actualizar' : 'crear'} la nota de crédito: ${err.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated fadeIn">
      <Card>
        <CardHeader>
          <h3 className="mb-0">{isEditing ? 'Editar Nota de Crédito' : 'Nueva Nota de Crédito'}</h3>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="text-center my-5">
              <Spinner color="primary" />
              <p className="mt-2">Cargando datos...</p>
            </div>
          ) : (
            <Form onSubmit={handleSubmit}>
              {error && <Alert color="danger">{error}</Alert>}
              
              <Row>
                <Col md={6}>
                  <FormGroup>
                    <Label for="cliente">Cliente</Label>
                    <Input
                      type="select"
                      name="cliente"
                      id="cliente"
                      value={creditNote.cliente}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Seleccione un cliente</option>
                      {clientes.map((cliente) => (
                        <option key={cliente._id} value={cliente._id}>
                          {cliente.nombre} ({cliente.ruc})
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
                <Col md={3}>
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
                </Col>
                <Col md={3}>
                  <FormGroup>
                    <Label for="facturaRelacionada">Factura Relacionada</Label>
                    <Input
                      type="select"
                      name="facturaRelacionada"
                      id="facturaRelacionada"
                      value={creditNote.facturaRelacionada}
                      onChange={handleChange}
                    >
                      <option value="">Seleccione una factura (opcional)</option>
                      {facturas.map((factura) => (
                        <option key={factura._id} value={factura._id}>
                          {factura.numero}
                        </option>
                      ))}
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              
              <Row>
                <Col md={12}>
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
                      <option value="DEVOLUCION">Devolución de productos</option>
                      <option value="DESCUENTO">Descuento posterior a la venta</option>
                      <option value="ERROR_FACTURACION">Error de facturación</option>
                      <option value="ANULACION_PARCIAL">Anulación parcial</option>
                      <option value="OTRO">Otro motivo</option>
                    </Input>
                  </FormGroup>
                </Col>
              </Row>
              
              {/* Tabla de ítems disponibles si se seleccionó una factura */}
              {creditNote.facturaRelacionada && selectedItems.length > 0 && (
                <div className="mb-4">
                  <h5>Ítems de la factura {facturas.find(f => f._id === creditNote.facturaRelacionada)?.numero}</h5>
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedItems.map((item, index) => (
                        <tr key={index}>
                          <td>{item.descripcion}</td>
                          <td>{item.cantidad}</td>
                          <td>${item.precioUnitario.toFixed(2)}</td>
                          <td>${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                          <td>
                            <Button
                              color="primary"
                              size="sm"
                              onClick={() => handleAddItem(item)}
                              title="Agregar a la nota de crédito"
                            >
                              <FaPlus />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
              
              {/* Tabla de ítems de la nota de crédito */}
              <div className="mb-4">
                <h5>Ítems de la Nota de Crédito</h5>
                {creditNote.items.length === 0 ? (
                  <Alert color="info">
                    No hay ítems en la nota de crédito. Puede añadir ítems manualmente o seleccionando una factura relacionada.
                  </Alert>
                ) : (
                  <Table responsive striped>
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNote.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <Input
                              type="text"
                              value={item.descripcion}
                              onChange={(e) => handleItemChange(index, 'descripcion', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) => handleItemChange(index, 'cantidad', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.precioUnitario}
                              onChange={(e) => handleItemChange(index, 'precioUnitario', e.target.value)}
                              required
                            />
                          </td>
                          <td>${(item.cantidad * item.precioUnitario).toFixed(2)}</td>
                          <td>
                            <Button
                              color="danger"
                              size="sm"
                              onClick={() => handleRemoveItem(index)}
                              title="Eliminar ítem"
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
                
                <Button color="success" size="sm" onClick={() => handleAddItem({
                  descripcion: '',
                  cantidad: 1,
                  precioUnitario: 0
                })}>
                  <FaPlus /> Añadir Ítem Manualmente
                </Button>
              </div>
              
              {/* Resumen de totales */}
              <Row className="mb-4">
                <Col md={{ size: 4, offset: 8 }}>
                  <Table>
                    <tbody>
                      <tr>
                        <th>Subtotal:</th>
                        <td className="text-right">${creditNote.subtotal.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <th>IVA (12%):</th>
                        <td className="text-right">${creditNote.iva.toFixed(2)}</td>
                      </tr>
                      <tr>
                        <th>Total:</th>
                        <td className="text-right">${creditNote.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </Table>
                </Col>
              </Row>
              
              <Row>
                <Col md={12}>
                  <FormGroup>
                    <Label for="observaciones">Observaciones</Label>
                    <Input
                      type="textarea"
                      name="observaciones"
                      id="observaciones"
                      rows="3"
                      value={creditNote.observaciones}
                      onChange={handleChange}
                      placeholder="Observaciones adicionales"
                    />
                  </FormGroup>
                </Col>
              </Row>
              
              <div className="d-flex justify-content-between">
                <Button color="secondary" onClick={() => navigate('/notas-credito')}>
                  <FaArrowLeft className="mr-2" /> Volver
                </Button>
                <Button color="primary" type="submit" disabled={loading}>
                  <FaSave className="mr-2" /> {isEditing ? 'Actualizar' : 'Guardar'}
                </Button>
              </div>
            </Form>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default NotaCreditoForm; 