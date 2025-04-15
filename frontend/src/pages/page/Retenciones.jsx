import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  Table,
  Button,
  Input,
  FormGroup,
  Label,
  Badge,
  Spinner,
  UncontrolledTooltip
} from 'reactstrap';
import { 
  FaFilePdf, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaFilter, 
  FaTimes, 
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaSearch
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getRetentions, processRetention, cancelRetention, deleteRetention, generateRetentionPDF } from '../../services/retentionService';

const Retenciones = () => {
  const navigate = useNavigate();
  const [retentions, setRetentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Estados para filtros
  const [filters, setFilters] = useState({
    retentionNumber: '',
    invoiceId: '',
    startDate: '',
    endDate: '',
    status: '',
    type: '',
    minTotal: '',
    maxTotal: ''
  });

  useEffect(() => {
    loadRetentions();
  }, [currentPage]);

  const loadRetentions = async () => {
    try {
      setLoading(true);
      const response = await getRetentions({
        ...filters,
        page: currentPage,
        limit: 10
      });
      
      setRetentions(response.data);
      setTotalPages(response.pages);
      setTotalItems(response.totalItems);
      setError(null);
    } catch (err) {
      console.error('Error cargando retenciones:', err);
      setError('Error al cargar las retenciones: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadRetentions();
  };

  const handleResetFilters = () => {
    setFilters({
      retentionNumber: '',
      invoiceId: '',
      startDate: '',
      endDate: '',
      status: '',
      type: '',
      minTotal: '',
      maxTotal: ''
    });
    setCurrentPage(1);
    loadRetentions();
  };

  const handleProcessRetention = async (id) => {
    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Enviando retención al SRI',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await processRetention(id);
      
      Swal.fire({
        icon: 'success',
        title: 'Procesada correctamente',
        text: 'La retención ha sido procesada exitosamente',
        confirmButtonText: 'Aceptar'
      });
      
      loadRetentions();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar',
        text: error.message || 'Ha ocurrido un error al procesar la retención',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleCancelRetention = async (id) => {
    try {
      const { value: reason, isConfirmed } = await Swal.fire({
        title: 'Anular retención',
        input: 'textarea',
        inputLabel: 'Motivo de anulación',
        inputPlaceholder: 'Ingrese el motivo de anulación...',
        inputAttributes: {
          'aria-label': 'Motivo de anulación'
        },
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Debe ingresar un motivo para anular la retención';
          }
        }
      });

      if (isConfirmed) {
        Swal.fire({
          title: 'Anulando...',
          text: 'Enviando solicitud de anulación',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        await cancelRetention(id, reason);
        
        Swal.fire({
          icon: 'success',
          title: 'Anulada correctamente',
          text: 'La retención ha sido anulada exitosamente',
          confirmButtonText: 'Aceptar'
        });
        
        loadRetentions();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al anular',
        text: error.message || 'Ha ocurrido un error al anular la retención',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleDeleteRetention = async (id) => {
    try {
      const result = await Swal.fire({
        title: '¿Está seguro?',
        text: 'Esta acción eliminará la retención. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      });

      if (result.isConfirmed) {
        await deleteRetention(id);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'La retención ha sido eliminada exitosamente',
          confirmButtonText: 'Aceptar'
        });
        
        loadRetentions();
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.message || 'Ha ocurrido un error al eliminar la retención',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleGeneratePDF = async (id) => {
    try {
      Swal.fire({
        title: 'Generando PDF...',
        text: 'Esto puede tomar unos segundos',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await generateRetentionPDF(id);
      
      Swal.close();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al generar PDF',
        text: error.message || 'Ha ocurrido un error al generar el PDF',
        confirmButtonText: 'Aceptar'
      });
    }
  };

  const handleCreateRetention = () => {
    navigate('/dashboard/facturas');
  };

  const handleEditRetention = (id) => {
    navigate(`/dashboard/retenciones/${id}/editar`);
  };

  const handleViewRetention = (id) => {
    navigate(`/dashboard/retenciones/${id}`);
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'draft': return 'bg-blue-100 text-blue-800';
      case 'processed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'processed': return 'Procesada';
      case 'cancelled': return 'Anulada';
      default: return status;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'renta': return 'Renta';
      case 'iva': return 'IVA';
      case 'ambos': return 'Renta e IVA';
      default: return type;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Comprobantes de Retención</h1>
        <Button
          color="primary"
          className="flex items-center"
          onClick={handleCreateRetention}
        >
          <FaPlus className="mr-2" /> Nueva Retención
        </Button>
      </div>

      {/* Filtros */}
      <Card className="mb-4">
        <CardHeader className="flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold">Filtros</h2>
          <Button
            color="light"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center"
          >
            {filterOpen ? <FaTimes className="mr-2" /> : <FaFilter className="mr-2" />}
            {filterOpen ? 'Cerrar' : 'Filtrar'}
          </Button>
        </CardHeader>
        {filterOpen && (
          <CardBody>
            <form onSubmit={handleApplyFilters}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormGroup>
                  <Label>Número de Retención</Label>
                  <Input
                    type="text"
                    name="retentionNumber"
                    value={filters.retentionNumber}
                    onChange={handleFilterChange}
                    placeholder="Ej: RET-000000001"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>ID de Factura</Label>
                  <Input
                    type="text"
                    name="invoiceId"
                    value={filters.invoiceId}
                    onChange={handleFilterChange}
                    placeholder="ID de la factura relacionada"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Fecha Desde</Label>
                  <Input
                    type="date"
                    name="startDate"
                    value={filters.startDate}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Fecha Hasta</Label>
                  <Input
                    type="date"
                    name="endDate"
                    value={filters.endDate}
                    onChange={handleFilterChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Estado</Label>
                  <Input
                    type="select"
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos</option>
                    <option value="draft">Borrador</option>
                    <option value="processed">Procesada</option>
                    <option value="cancelled">Anulada</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Tipo</Label>
                  <Input
                    type="select"
                    name="type"
                    value={filters.type}
                    onChange={handleFilterChange}
                  >
                    <option value="">Todos</option>
                    <option value="renta">Renta</option>
                    <option value="iva">IVA</option>
                    <option value="ambos">Renta e IVA</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label>Valor Mínimo</Label>
                  <Input
                    type="number"
                    name="minTotal"
                    value={filters.minTotal}
                    onChange={handleFilterChange}
                    placeholder="Valor mínimo"
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Valor Máximo</Label>
                  <Input
                    type="number"
                    name="maxTotal"
                    value={filters.maxTotal}
                    onChange={handleFilterChange}
                    placeholder="Valor máximo"
                    min="0"
                    step="0.01"
                  />
                </FormGroup>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <Button 
                  type="button" 
                  color="secondary" 
                  onClick={handleResetFilters}
                  className="flex items-center"
                >
                  <FaTimes className="mr-2" /> Limpiar
                </Button>
                <Button 
                  type="submit" 
                  color="primary"
                  className="flex items-center"
                >
                  <FaSearch className="mr-2" /> Buscar
                </Button>
              </div>
            </form>
          </CardBody>
        )}
      </Card>

      {/* Tabla de retenciones */}
      <Card>
        <CardBody className="p-0">
          {loading ? (
            <div className="text-center py-10">
              <Spinner color="primary" />
              <p className="mt-2">Cargando retenciones...</p>
            </div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Factura
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Valor
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {retentions.length > 0 ? (
                      retentions.map((retention) => (
                        <tr key={retention._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {retention.retentionNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {retention.invoice?.invoiceNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(retention.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {getTypeText(retention.retentionType)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            ${retention.totalRetained.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(retention.status)}`}>
                              {getStatusText(retention.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                            <div className="flex justify-center space-x-2">
                              <Button
                                color="link"
                                className="p-0 text-primary"
                                onClick={() => handleViewRetention(retention._id)}
                                id={`view-${retention._id}`}
                              >
                                <FaSearch size={16} />
                              </Button>
                              <UncontrolledTooltip target={`view-${retention._id}`}>
                                Ver detalle
                              </UncontrolledTooltip>
                              
                              {retention.status === 'draft' && (
                                <>
                                  <Button
                                    color="link"
                                    className="p-0 text-info"
                                    onClick={() => handleEditRetention(retention._id)}
                                    id={`edit-${retention._id}`}
                                  >
                                    <FaEdit size={16} />
                                  </Button>
                                  <UncontrolledTooltip target={`edit-${retention._id}`}>
                                    Editar
                                  </UncontrolledTooltip>

                                  <Button
                                    color="link"
                                    className="p-0 text-danger"
                                    onClick={() => handleDeleteRetention(retention._id)}
                                    id={`delete-${retention._id}`}
                                  >
                                    <FaTrash size={16} />
                                  </Button>
                                  <UncontrolledTooltip target={`delete-${retention._id}`}>
                                    Eliminar
                                  </UncontrolledTooltip>

                                  <Button
                                    color="link"
                                    className="p-0 text-success"
                                    onClick={() => handleProcessRetention(retention._id)}
                                    id={`process-${retention._id}`}
                                  >
                                    <FaCheckCircle size={16} />
                                  </Button>
                                  <UncontrolledTooltip target={`process-${retention._id}`}>
                                    Procesar
                                  </UncontrolledTooltip>
                                </>
                              )}

                              {retention.status === 'processed' && (
                                <>
                                  <Button
                                    color="link"
                                    className="p-0 text-danger"
                                    onClick={() => handleCancelRetention(retention._id)}
                                    id={`cancel-${retention._id}`}
                                  >
                                    <FaTimesCircle size={16} />
                                  </Button>
                                  <UncontrolledTooltip target={`cancel-${retention._id}`}>
                                    Anular
                                  </UncontrolledTooltip>
                                </>
                              )}

                              <Button
                                color="link"
                                className="p-0 text-primary"
                                onClick={() => handleGeneratePDF(retention._id)}
                                id={`pdf-${retention._id}`}
                              >
                                <FaFilePdf size={16} />
                              </Button>
                              <UncontrolledTooltip target={`pdf-${retention._id}`}>
                                Generar PDF
                              </UncontrolledTooltip>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                          No se encontraron retenciones
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center px-6 py-3 bg-gray-50">
                  <div className="text-sm text-gray-500">
                    Mostrando <span className="font-medium">{retentions.length}</span> de{' '}
                    <span className="font-medium">{totalItems}</span> resultados
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      color="light"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </motion.div>
  );
};

export default Retenciones; 