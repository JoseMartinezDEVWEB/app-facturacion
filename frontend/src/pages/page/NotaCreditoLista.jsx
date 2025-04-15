import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Table, 
  Button, 
  Card, 
  CardBody, 
  CardHeader, 
  InputGroup, 
  Input, 
  FormGroup, 
  Label, 
  Row, 
  Col,
  Badge,
  Spinner
} from 'reactstrap';
import { FaPlus, FaSearch, FaEye, FaFileAlt, FaBan, FaFilePdf } from 'react-icons/fa';
import { getAllCreditNotes, processFiscalCreditNote, cancelCreditNote } from '../../services/creditNoteService';
import Swal from 'sweetalert2';

const NotaCreditoLista = () => {
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    numero: '',
    cliente: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: ''
  });

  // Cargar las notas de crédito al inicializar
  useEffect(() => {
    fetchCreditNotes();
  }, []);

  // Función para obtener todas las notas de crédito
  const fetchCreditNotes = async () => {
    setLoading(true);
    try {
      const data = await getAllCreditNotes(filters);
      setCreditNotes(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las notas de crédito. Por favor, inténtelo de nuevo.');
      console.error('Error fetching credit notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para aplicar los filtros
  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchCreditNotes();
  };

  // Función para limpiar los filtros
  const handleClearFilters = () => {
    setFilters({
      numero: '',
      cliente: '',
      fechaDesde: '',
      fechaHasta: '',
      estado: ''
    });
    // Recargar sin filtros
    getAllCreditNotes().then(data => {
      setCreditNotes(data);
    }).catch(err => {
      setError('Error al cargar las notas de crédito');
      console.error(err);
    });
  };

  // Función para cambiar los filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Función para procesar fiscalmente una nota de crédito
  const handleProcessFiscal = async (id) => {
    try {
      await Swal.fire({
        title: '¿Procesar fiscalmente?',
        text: 'Esta acción enviará la nota de crédito a la administración tributaria',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, procesar',
        cancelButtonText: 'Cancelar'
      }).then(async (result) => {
        if (result.isConfirmed) {
          setLoading(true);
          await processFiscalCreditNote(id);
          await fetchCreditNotes();
          Swal.fire(
            '¡Procesada!',
            'La nota de crédito ha sido procesada fiscalmente.',
            'success'
          );
        }
      });
    } catch (err) {
      Swal.fire(
        'Error',
        'No se pudo procesar la nota de crédito: ' + (err.message || 'Error desconocido'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para cancelar una nota de crédito
  const handleCancel = async (id) => {
    try {
      const { value: reason } = await Swal.fire({
        title: 'Motivo de anulación',
        input: 'textarea',
        inputLabel: 'Indique el motivo de anulación',
        inputPlaceholder: 'Escriba aquí el motivo...',
        inputAttributes: {
          'aria-label': 'Escriba aquí el motivo'
        },
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Debe ingresar un motivo de anulación';
          }
        }
      });

      if (reason) {
        setLoading(true);
        await cancelCreditNote(id, reason);
        await fetchCreditNotes();
        Swal.fire(
          '¡Anulada!',
          'La nota de crédito ha sido anulada correctamente.',
          'success'
        );
      }
    } catch (err) {
      Swal.fire(
        'Error',
        'No se pudo anular la nota de crédito: ' + (err.message || 'Error desconocido'),
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF de la nota de crédito
  const handleGeneratePDF = (id) => {
    // Implementar la generación del PDF
    window.open(`/api/notas-credito/${id}/pdf`, '_blank');
  };

  // Renderizar el estado con un badge de color
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'BORRADOR':
        return <Badge color="secondary">Borrador</Badge>;
      case 'PROCESADA':
        return <Badge color="success">Procesada</Badge>;
      case 'ANULADA':
        return <Badge color="danger">Anulada</Badge>;
      default:
        return <Badge color="info">{status}</Badge>;
    }
  };

  return (
    <div className="animated fadeIn">
      <Card>
        <CardHeader>
          <h3 className="mb-0">Notas de Crédito</h3>
          <div className="d-flex justify-content-end">
            <Link to="/notas-credito/nueva" className="btn btn-primary">
              <FaPlus className="mr-2" /> Nueva Nota de Crédito
            </Link>
          </div>
        </CardHeader>
        <CardBody>
          {/* Filtros */}
          <Card className="mb-4">
            <CardBody>
              <form onSubmit={handleApplyFilters}>
                <Row>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="numero">Número</Label>
                      <Input
                        type="text"
                        name="numero"
                        id="numero"
                        value={filters.numero}
                        onChange={handleFilterChange}
                        placeholder="Número de nota"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={3}>
                    <FormGroup>
                      <Label for="cliente">Cliente</Label>
                      <Input
                        type="text"
                        name="cliente"
                        id="cliente"
                        value={filters.cliente}
                        onChange={handleFilterChange}
                        placeholder="Nombre o RUC"
                      />
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <FormGroup>
                      <Label for="fechaDesde">Fecha desde</Label>
                      <Input
                        type="date"
                        name="fechaDesde"
                        id="fechaDesde"
                        value={filters.fechaDesde}
                        onChange={handleFilterChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <FormGroup>
                      <Label for="fechaHasta">Fecha hasta</Label>
                      <Input
                        type="date"
                        name="fechaHasta"
                        id="fechaHasta"
                        value={filters.fechaHasta}
                        onChange={handleFilterChange}
                      />
                    </FormGroup>
                  </Col>
                  <Col md={2}>
                    <FormGroup>
                      <Label for="estado">Estado</Label>
                      <Input
                        type="select"
                        name="estado"
                        id="estado"
                        value={filters.estado}
                        onChange={handleFilterChange}
                      >
                        <option value="">Todos</option>
                        <option value="BORRADOR">Borrador</option>
                        <option value="PROCESADA">Procesada</option>
                        <option value="ANULADA">Anulada</option>
                      </Input>
                    </FormGroup>
                  </Col>
                </Row>
                <div className="d-flex justify-content-end">
                  <Button type="button" color="secondary" className="mr-2" onClick={handleClearFilters}>
                    Limpiar
                  </Button>
                  <Button type="submit" color="primary">
                    <FaSearch className="mr-1" /> Buscar
                  </Button>
                </div>
              </form>
            </CardBody>
          </Card>

          {/* Tabla de notas de crédito */}
          {loading ? (
            <div className="text-center my-5">
              <Spinner color="primary" />
              <p className="mt-2">Cargando notas de crédito...</p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : creditNotes.length === 0 ? (
            <div className="alert alert-info">No se encontraron notas de crédito</div>
          ) : (
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Número</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Factura Relacionada</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {creditNotes.map((note) => (
                  <tr key={note._id}>
                    <td>{note.numero}</td>
                    <td>{new Date(note.fecha).toLocaleDateString()}</td>
                    <td>{note.cliente ? `${note.cliente.nombre} (${note.cliente.ruc})` : 'N/A'}</td>
                    <td>{note.facturaRelacionada?.numero || 'N/A'}</td>
                    <td>${note.total.toFixed(2)}</td>
                    <td>{renderStatusBadge(note.estado)}</td>
                    <td>
                      <div className="btn-group" role="group">
                        <Link to={`/notas-credito/${note._id}`} className="btn btn-info btn-sm" title="Ver detalle">
                          <FaEye />
                        </Link>
                        {note.estado === 'BORRADOR' && (
                          <Button
                            color="success"
                            size="sm"
                            title="Procesar fiscalmente"
                            onClick={() => handleProcessFiscal(note._id)}
                          >
                            <FaFileAlt />
                          </Button>
                        )}
                        {note.estado !== 'ANULADA' && (
                          <Button
                            color="danger"
                            size="sm"
                            title="Anular nota de crédito"
                            onClick={() => handleCancel(note._id)}
                          >
                            <FaBan />
                          </Button>
                        )}
                        <Button
                          color="primary"
                          size="sm"
                          title="Generar PDF"
                          onClick={() => handleGeneratePDF(note._id)}
                        >
                          <FaFilePdf />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default NotaCreditoLista; 