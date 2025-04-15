import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  Button,
  Table,
  Input,
  FormGroup,
  Label,
  UncontrolledTooltip,
  Badge,
  Spinner,
  Collapse
} from 'reactstrap';
import { 
  FaFilePdf, 
  FaEdit, 
  FaTrash, 
  FaPlus, 
  FaFilter, 
  FaTimes, 
  FaSearch,
  FaCheckCircle,
  FaTimesCircle,
  FaEnvelope
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { 
  getAllCreditNotes, 
  processCreditNote, 
  cancelCreditNote,
  generateCreditNotePDF
} from '../../services/creditNoteService';
import { getAllClients } from '../../services/clientService';
import Breadcrumb from '../../components/common/breadcrumb';

const NotasCreditoList = () => {
  // Estado para las notas de crédito y filtros
  const [creditNotes, setCreditNotes] = useState([]);
  const [filteredNotes, setFilteredNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [clients, setClients] = useState([]);
  
  // Estado para los filtros
  const [filters, setFilters] = useState({
    numero: '',
    cliente: '',
    fechaDesde: null,
    fechaHasta: null,
    estado: ''
  });
  
  // Estado para la paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  useEffect(() => {
    // Cargar notas de crédito y clientes al montar el componente
    loadCreditNotes();
    loadClients();
  }, []);
  
  useEffect(() => {
    // Aplicar filtros cuando cambian
    filterCreditNotes();
  }, [creditNotes, filters]);
  
  const loadCreditNotes = async () => {
    try {
      setLoading(true);
      const data = await getAllCreditNotes();
      setCreditNotes(data);
      setFilteredNotes(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las notas de crédito. Por favor, intente nuevamente.');
      console.error('Error cargando notas de crédito:', err);
      setLoading(false);
    }
  };
  
  const loadClients = async () => {
    try {
      const data = await getAllClients();
      setClients(data);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  };
  
  const filterCreditNotes = () => {
    let result = [...creditNotes];
    
    // Filtro por número
    if (filters.numero) {
      result = result.filter(note => 
        note.numero.toLowerCase().includes(filters.numero.toLowerCase())
      );
    }
    
    // Filtro por cliente
    if (filters.cliente) {
      result = result.filter(note => 
        note.cliente._id === filters.cliente || 
        note.cliente.nombre.toLowerCase().includes(filters.cliente.toLowerCase())
      );
    }
    
    // Filtro por fecha desde
    if (filters.fechaDesde) {
      result = result.filter(note => 
        new Date(note.fecha) >= new Date(filters.fechaDesde)
      );
    }
    
    // Filtro por fecha hasta
    if (filters.fechaHasta) {
      result = result.filter(note => 
        new Date(note.fecha) <= new Date(filters.fechaHasta)
      );
    }
    
    // Filtro por estado
    if (filters.estado) {
      result = result.filter(note => 
        note.estado.toLowerCase() === filters.estado.toLowerCase()
      );
    }
    
    setFilteredNotes(result);
    setCurrentPage(1); // Reset a la primera página cuando se filtra
  };
  
  const resetFilters = () => {
    setFilters({
      numero: '',
      cliente: '',
      fechaDesde: null,
      fechaHasta: null,
      estado: ''
    });
    setFilteredNotes(creditNotes);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (name, date) => {
    setFilters(prev => ({ ...prev, [name]: date }));
  };
  
  const handleProcesarNotaCredito = async (id) => {
    try {
      Swal.fire({
        title: 'Procesando...',
        text: 'Enviando nota de crédito al SRI',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await processCreditNote(id);
      
      Swal.fire({
        icon: 'success',
        title: 'Procesada correctamente',
        text: 'La nota de crédito ha sido procesada exitosamente',
        confirmButtonText: 'Aceptar'
      });
      
      loadCreditNotes(); // Recargar la lista
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar',
        text: error.response?.data?.message || 'Ha ocurrido un error al procesar la nota de crédito',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  const handleAnularNotaCredito = async (id) => {
    try {
      const { value: motivo, isConfirmed } = await Swal.fire({
        title: 'Anular nota de crédito',
        input: 'textarea',
        inputLabel: 'Motivo de anulación',
        inputPlaceholder: 'Ingrese el motivo de anulación...',
        showCancelButton: true,
        confirmButtonText: 'Anular',
        cancelButtonText: 'Cancelar',
        inputValidator: (value) => {
          if (!value) {
            return 'Debe ingresar un motivo para anular la nota de crédito';
          }
        }
      });
      
      if (isConfirmed) {
        Swal.fire({
          title: 'Anulando...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        await cancelCreditNote(id, motivo);
        
        Swal.fire({
          icon: 'success',
          title: 'Anulada correctamente',
          text: 'La nota de crédito ha sido anulada exitosamente',
          confirmButtonText: 'Aceptar'
        });
        
        loadCreditNotes(); // Recargar la lista
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al anular',
        text: error.response?.data?.message || 'Ha ocurrido un error al anular la nota de crédito',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  const handleGenerarPDF = async (id) => {
    try {
      Swal.fire({
        title: 'Generando PDF...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await generateCreditNotePDF(id);
      
      Swal.close();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al generar PDF',
        text: 'Ha ocurrido un error al generar el PDF de la nota de crédito',
        confirmButtonText: 'Aceptar'
      });
    }
  };
  
  const handleDeleteCreditNote = (id) => {
    Swal.fire({
      title: '¿Está seguro?',
      text: "Esta acción no se puede deshacer",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // Implementar eliminación
        Swal.fire(
          'Eliminada',
          'La nota de crédito ha sido eliminada',
          'success'
        );
        loadCreditNotes();
      }
    });
  };
  
  // Paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  // Función para mostrar el estado con color
  const renderEstado = (estado) => {
    const estadoLower = estado.toLowerCase();
    let color = 'secondary';
    
    if (estadoLower === 'procesada' || estadoLower === 'autorizada') {
      color = 'success';
    } else if (estadoLower === 'anulada') {
      color = 'danger';
    } else if (estadoLower === 'borrador') {
      color = 'warning';
    } else if (estadoLower === 'rechazada') {
      color = 'danger';
    }
    
    return (
      <Badge color={color} className="p-2">
        {estado}
      </Badge>
    );
  };
  
  // Renderizar la página
  return (
    <React.Fragment>
      <div className="page-content">
        <Breadcrumb title="Notas de Crédito" breadcrumbItem="Listado" />
        
        <Row>
          <Col lg={12}>
            <Card>
              <CardHeader className="d-flex justify-content-between align-items-center">
                <h4 className="card-title mb-0">Notas de Crédito</h4>
                <div className="d-flex gap-2">
                  <Button
                    color="primary"
                    className="btn-sm"
                    onClick={() => setFilterOpen(!filterOpen)}
                  >
                    <FaFilter className="me-1" /> Filtros
                  </Button>
                  <Link to="/nota-credito/nueva">
                    <Button color="success" className="btn-sm">
                      <FaPlus className="me-1" /> Nueva Nota de Crédito
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              
              <CardBody>
                {/* Sección de filtros */}
                <Collapse isOpen={filterOpen}>
                  <div className="bg-light p-3 mb-3 rounded">
                    <Row className="mb-3">
                      <Col md={3}>
                        <FormGroup>
                          <Label for="numero">Número</Label>
                          <Input
                            type="text"
                            name="numero"
                            id="numero"
                            value={filters.numero}
                            onChange={handleInputChange}
                            placeholder="Buscar por número"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label for="cliente">Cliente</Label>
                          <Input
                            type="select"
                            name="cliente"
                            id="cliente"
                            value={filters.cliente}
                            onChange={handleInputChange}
                          >
                            <option value="">Todos los clientes</option>
                            {clients.map(client => (
                              <option key={client._id} value={client._id}>
                                {client.nombre}
                              </option>
                            ))}
                          </Input>
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label for="estado">Estado</Label>
                          <Input
                            type="select"
                            name="estado"
                            id="estado"
                            value={filters.estado}
                            onChange={handleInputChange}
                          >
                            <option value="">Todos los estados</option>
                            <option value="borrador">Borrador</option>
                            <option value="procesada">Procesada</option>
                            <option value="autorizada">Autorizada</option>
                            <option value="anulada">Anulada</option>
                            <option value="rechazada">Rechazada</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>
                    <Row className="mb-3">
                      <Col md={3}>
                        <FormGroup>
                          <Label for="fechaDesde">Desde</Label>
                          <DatePicker
                            id="fechaDesde"
                            selected={filters.fechaDesde}
                            onChange={(date) => handleDateChange('fechaDesde', date)}
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Fecha desde"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup>
                          <Label for="fechaHasta">Hasta</Label>
                          <DatePicker
                            id="fechaHasta"
                            selected={filters.fechaHasta}
                            onChange={(date) => handleDateChange('fechaHasta', date)}
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                            placeholderText="Fecha hasta"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6} className="d-flex align-items-end">
                        <div className="d-flex gap-2">
                          <Button color="primary" onClick={filterCreditNotes}>
                            <FaSearch className="me-1" /> Buscar
                          </Button>
                          <Button color="secondary" onClick={resetFilters}>
                            <FaTimes className="me-1" /> Limpiar
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Collapse>
                
                {/* Mensaje de error */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                
                {/* Tabla de notas de crédito */}
                {loading ? (
                  <div className="text-center p-4">
                    <Spinner color="primary" />
                    <p className="mt-2">Cargando notas de crédito...</p>
                  </div>
                ) : filteredNotes.length === 0 ? (
                  <div className="text-center p-4">
                    <p>No se encontraron notas de crédito con los filtros aplicados.</p>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table className="table-striped table-hover">
                        <thead>
                          <tr>
                            <th>Número</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Factura Ref.</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((note) => (
                            <tr key={note._id}>
                              <td>{note.numero || "Sin emitir"}</td>
                              <td>{new Date(note.fecha).toLocaleDateString()}</td>
                              <td>{note.cliente.nombre}</td>
                              <td>{note.facturaReferencia?.numero || "N/A"}</td>
                              <td className="text-right">
                                ${parseFloat(note.total).toFixed(2)}
                              </td>
                              <td>{renderEstado(note.estado)}</td>
                              <td>
                                <div className="d-flex gap-1">
                                  {/* Ver PDF */}
                                  {note.estado !== 'borrador' && (
                                    <Button
                                      color="info"
                                      size="sm"
                                      id={`pdf-${note._id}`}
                                      onClick={() => handleGenerarPDF(note._id)}
                                    >
                                      <FaFilePdf />
                                    </Button>
                                  )}
                                  <UncontrolledTooltip target={`pdf-${note._id}`}>
                                    Ver PDF
                                  </UncontrolledTooltip>
                                  
                                  {/* Editar (solo si está en borrador) */}
                                  {note.estado === 'borrador' && (
                                    <>
                                      <Link to={`/nota-credito/editar/${note._id}`}>
                                        <Button
                                          color="primary"
                                          size="sm"
                                          id={`edit-${note._id}`}
                                        >
                                          <FaEdit />
                                        </Button>
                                      </Link>
                                      <UncontrolledTooltip target={`edit-${note._id}`}>
                                        Editar
                                      </UncontrolledTooltip>
                                      
                                      {/* Procesar */}
                                      <Button
                                        color="success"
                                        size="sm"
                                        id={`process-${note._id}`}
                                        onClick={() => handleProcesarNotaCredito(note._id)}
                                      >
                                        <FaCheckCircle />
                                      </Button>
                                      <UncontrolledTooltip target={`process-${note._id}`}>
                                        Procesar y enviar al SRI
                                      </UncontrolledTooltip>
                                    </>
                                  )}
                                  
                                  {/* Anular (solo si está procesada/autorizada) */}
                                  {(note.estado === 'procesada' || note.estado === 'autorizada') && (
                                    <>
                                      <Button
                                        color="danger"
                                        size="sm"
                                        id={`cancel-${note._id}`}
                                        onClick={() => handleAnularNotaCredito(note._id)}
                                      >
                                        <FaTimesCircle />
                                      </Button>
                                      <UncontrolledTooltip target={`cancel-${note._id}`}>
                                        Anular
                                      </UncontrolledTooltip>
                                      
                                      {/* Enviar por email */}
                                      <Button
                                        color="secondary"
                                        size="sm"
                                        id={`email-${note._id}`}
                                      >
                                        <FaEnvelope />
                                      </Button>
                                      <UncontrolledTooltip target={`email-${note._id}`}>
                                        Enviar por email
                                      </UncontrolledTooltip>
                                    </>
                                  )}
                                  
                                  {/* Eliminar (solo si está en borrador) */}
                                  {note.estado === 'borrador' && (
                                    <>
                                      <Button
                                        color="danger"
                                        size="sm"
                                        id={`delete-${note._id}`}
                                        onClick={() => handleDeleteCreditNote(note._id)}
                                      >
                                        <FaTrash />
                                      </Button>
                                      <UncontrolledTooltip target={`delete-${note._id}`}>
                                        Eliminar
                                      </UncontrolledTooltip>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                    
                    {/* Paginación */}
                    <div className="d-flex justify-content-end mt-3">
                      <ul className="pagination">
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            Anterior
                          </button>
                        </li>
                        
                        {Array.from({ length: Math.ceil(filteredNotes.length / itemsPerPage) }).map((_, index) => (
                          <li 
                            key={index} 
                            className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                          >
                            <button
                              className="page-link"
                              onClick={() => paginate(index + 1)}
                            >
                              {index + 1}
                            </button>
                          </li>
                        ))}
                        
                        <li 
                          className={`page-item ${
                            currentPage === Math.ceil(filteredNotes.length / itemsPerPage) 
                              ? 'disabled' 
                              : ''
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === Math.ceil(filteredNotes.length / itemsPerPage)}
                          >
                            Siguiente
                          </button>
                        </li>
                      </ul>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </React.Fragment>
  );
};

export default NotasCreditoList; 