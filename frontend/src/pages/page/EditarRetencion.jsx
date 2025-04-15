import { useState, useEffect } from 'react';
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
import { motion } from 'framer-motion';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import { getRetentionById, updateRetention } from '../../services/retentionService';
import Swal from 'sweetalert2';

// Lista de conceptos de retención disponibles
const RETENTION_CONCEPTS = [
  { code: '304', description: 'Servicios donde predomina el intelecto', percentage: 8 },
  { code: '307', description: 'Servicios donde predomina la mano de obra', percentage: 2 },
  { code: '310', description: 'Transporte privado de pasajeros', percentage: 1 },
  { code: '312', description: 'Transferencia de bienes muebles', percentage: 1 },
  { code: '320', description: 'Arrendamiento de bienes inmuebles', percentage: 8 },
  { code: '322', description: 'Seguros y reaseguros', percentage: 1 },
  { code: '332', description: 'Pagos de bienes o servicios no sujetos a retención', percentage: 0 },
  { code: '344', description: 'Aplicables el 2%', percentage: 2 },
  { code: '9450', description: 'Retención del IVA 30%', percentage: 30, type: 'iva' },
  { code: '9451', description: 'Retención del IVA 70%', percentage: 70, type: 'iva' },
  { code: '9452', description: 'Retención del IVA 100%', percentage: 100, type: 'iva' }
];

const EditarRetencion = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [originalRetention, setOriginalRetention] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);

  const [retention, setRetention] = useState({
    date: '',
    items: [],
    retentionType: '',
    observations: ''
  });

  // Estado para un nuevo item de retención
  const [newItem, setNewItem] = useState({
    description: '',
    code: '',
    base: 0,
    percentage: 0
  });

  useEffect(() => {
    const fetchRetentionData = async () => {
      try {
        setLoading(true);
        const response = await getRetentionById(id);
        
        // Solo permitir editar retenciones en estado borrador
        if (response.status !== 'draft') {
          setError('Solo se pueden editar retenciones en estado borrador');
          setLoading(false);
          return;
        }
        
        setOriginalRetention(response);
        setInvoiceData(response.invoice);
        
        setRetention({
          date: new Date(response.date).toISOString().split('T')[0],
          items: response.items || [],
          retentionType: response.retentionType || 'renta',
          observations: response.observations || ''
        });
        
        // Prepopular el valor base si hay items en la factura
        if (response.invoice && response.invoice.subtotal) {
          setNewItem(prev => ({
            ...prev,
            base: response.invoice.subtotal
          }));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error cargando retención:', err);
        setError('Error al cargar la retención: ' + (err.message || 'Error desconocido'));
        setLoading(false);
      }
    };

    if (id) {
      fetchRetentionData();
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setRetention({
      ...retention,
      [name]: value
    });
  };

  const handleNewItemChange = (e) => {
    const { name, value } = e.target;
    
    // Si seleccionamos un código de retención, populamos automáticamente descripción y porcentaje
    if (name === 'code') {
      const selectedConcept = RETENTION_CONCEPTS.find(concept => concept.code === value);
      if (selectedConcept) {
        setNewItem({
          ...newItem,
          code: value,
          description: selectedConcept.description,
          percentage: selectedConcept.percentage
        });
        
        // Si es una retención de IVA, cambiar el tipo
        if (selectedConcept.type === 'iva') {
          setRetention({
            ...retention,
            retentionType: selectedConcept.type === 'iva' ? 'iva' : 'renta'
          });
        }
        
        return;
      }
    }
    
    // Para otros campos como base o porcentaje, asegurarnos que sean numéricos
    if (name === 'base' || name === 'percentage') {
      setNewItem({
        ...newItem,
        [name]: parseFloat(value) || 0
      });
      return;
    }
    
    setNewItem({
      ...newItem,
      [name]: value
    });
  };

  const addItem = () => {
    // Validar que el item sea válido
    if (!newItem.code || !newItem.description || newItem.base <= 0) {
      setError('Por favor complete todos los campos del ítem de retención');
      return;
    }
    
    // Agregar el item a la lista
    const updatedItems = [...retention.items, { ...newItem }];
    
    setRetention({
      ...retention,
      items: updatedItems
    });
    
    // Reiniciar el nuevo item, pero mantener la base
    const currentBase = newItem.base;
    setNewItem({
      description: '',
      code: '',
      base: currentBase,
      percentage: 0
    });
    
    setError('');
  };

  const removeItem = (index) => {
    const updatedItems = retention.items.filter((_, i) => i !== index);
    setRetention({
      ...retention,
      items: updatedItems
    });
  };

  const calculateTotalRetained = () => {
    return retention.items.reduce((sum, item) => {
      return sum + (item.base * (item.percentage / 100));
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (retention.items.length === 0) {
      setError('Debe agregar al menos un concepto de retención');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const result = await updateRetention(id, retention);
      
      Swal.fire({
        title: 'Retención actualizada',
        text: 'La retención ha sido actualizada exitosamente',
        icon: 'success',
        confirmButtonText: 'Aceptar'
      }).then(() => {
        navigate(`/dashboard/retenciones/${id}`);
      });
    } catch (err) {
      console.error('Error actualizando retención:', err);
      setError('Error al actualizar la retención: ' + (err.message || 'Error desconocido'));
    } finally {
      setSubmitting(false);
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
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Editar Retención</h1>
          <Button
            color="secondary"
            size="sm"
            onClick={() => navigate(`/dashboard/retenciones/${id}`)}
            className="flex items-center"
          >
            <FaArrowLeft className="mr-2" /> Volver
          </Button>
        </div>

        {loading ? (
          <div className="p-6 text-center">
            <Spinner color="primary" />
            <p className="mt-2">Cargando datos de la retención...</p>
          </div>
        ) : error ? (
          <div className="p-6">
            <Alert color="danger">{error}</Alert>
            <div className="mt-4 text-center">
              <Button color="secondary" onClick={() => navigate(`/dashboard/retenciones/${id}`)}>
                Volver al detalle
              </Button>
            </div>
          </div>
        ) : (
          <Form onSubmit={handleSubmit} className="p-6">
            {error && <Alert color="danger" className="mb-4">{error}</Alert>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="bg-gray-50 p-4 rounded-lg border">
                  <h2 className="text-lg font-semibold mb-3">Información de la Retención</h2>
                  <p className="mb-2"><strong>Número:</strong> {originalRetention?.retentionNumber}</p>
                  <p className="mb-2"><strong>Estado:</strong> Borrador</p>
                  <p className="mb-2"><strong>Factura relacionada:</strong> {invoiceData?.invoiceNumber}</p>
                  <p className="mb-2"><strong>Cliente:</strong> {invoiceData?.customer?.name}</p>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-3">Datos de la Retención</h2>
                <FormGroup className="mb-4">
                  <Label for="date">Fecha de Retención</Label>
                  <Input
                    type="date"
                    id="date"
                    name="date"
                    value={retention.date}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup className="mb-4">
                  <Label for="retentionType">Tipo de Retención</Label>
                  <Input
                    type="select"
                    id="retentionType"
                    name="retentionType"
                    value={retention.retentionType}
                    onChange={handleChange}
                    required
                  >
                    <option value="renta">Retención en la Fuente (Renta)</option>
                    <option value="iva">Retención de IVA</option>
                    <option value="ambos">Renta e IVA</option>
                  </Input>
                </FormGroup>
                
                <FormGroup className="mb-4">
                  <Label for="observations">Observaciones</Label>
                  <Input
                    type="textarea"
                    id="observations"
                    name="observations"
                    value={retention.observations}
                    onChange={handleChange}
                    rows="3"
                  />
                </FormGroup>
              </div>
            </div>
            
            <h2 className="text-lg font-semibold mb-3">Conceptos de Retención</h2>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <FormGroup>
                  <Label for="code">Código</Label>
                  <Input
                    type="select"
                    id="code"
                    name="code"
                    value={newItem.code}
                    onChange={handleNewItemChange}
                  >
                    <option value="">Seleccionar concepto</option>
                    {RETENTION_CONCEPTS.filter(concept => {
                      // Filtrar conceptos según el tipo de retención seleccionado
                      if (retention.retentionType === 'renta') {
                        return concept.type !== 'iva';
                      }
                      if (retention.retentionType === 'iva') {
                        return concept.type === 'iva';
                      }
                      return true; // Para ambos tipos, mostrar todos
                    }).map(concept => (
                      <option key={concept.code} value={concept.code}>
                        {concept.code} - {concept.description}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                
                <FormGroup>
                  <Label for="base">Base Imponible</Label>
                  <Input
                    type="number"
                    id="base"
                    name="base"
                    value={newItem.base}
                    onChange={handleNewItemChange}
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="percentage">Porcentaje (%)</Label>
                  <Input
                    type="number"
                    id="percentage"
                    name="percentage"
                    value={newItem.percentage}
                    onChange={handleNewItemChange}
                    min="0"
                    max="100"
                    step="0.01"
                    disabled={newItem.code !== ''}
                  />
                </FormGroup>
                
                <div className="flex items-end">
                  <Button
                    color="primary"
                    className="w-full"
                    type="button"
                    onClick={addItem}
                  >
                    <FaPlus className="mr-2" /> Agregar
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border mb-6">
              <Table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {retention.items.length > 0 ? (
                    retention.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.code}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {item.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          ${item.base.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                          {item.percentage}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                          ${((item.base * item.percentage) / 100).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            <FaTrash />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No hay conceptos agregados
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-semibold">
                      Total a Retener:
                    </td>
                    <td className="px-6 py-4 text-right font-semibold">
                      ${calculateTotalRetained().toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </Table>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                color="secondary"
                onClick={() => navigate(`/dashboard/retenciones/${id}`)}
                className="flex items-center"
              >
                <FaArrowLeft className="mr-2" /> Cancelar
              </Button>
              <Button
                type="submit"
                color="primary"
                disabled={submitting || retention.items.length === 0}
                className="flex items-center"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" /> Guardando...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Guardar Cambios
                  </>
                )}
              </Button>
            </div>
          </Form>
        )}
      </div>
    </motion.div>
  );
};

export default EditarRetencion; 