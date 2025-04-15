import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  Alert,
  Spinner,
  Badge
} from 'reactstrap';
import { 
  FaFilePdf, 
  FaEdit, 
  FaTrash, 
  FaArrowLeft, 
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import { 
  getRetentionById, 
  processRetention, 
  cancelRetention, 
  deleteRetention, 
  generateRetentionPDF
} from '../../services/retentionService';
import Swal from 'sweetalert2';

const DetalleRetencion = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [retention, setRetention] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadRetentionData();
  }, [id]);

  const loadRetentionData = async () => {
    try {
      setLoading(true);
      const response = await getRetentionById(id);
      setRetention(response);
      setError(null);
    } catch (err) {
      console.error('Error cargando retención:', err);
      setError('Error al cargar la retención: ' + (err.message || 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRetention = async () => {
    try {
      setProcessing(true);
      Swal.fire({
        title: 'Procesando...',
        text: 'Enviando retención al SRI',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });
      
      await processRetention(id);
      await loadRetentionData();
      
      Swal.fire({
        icon: 'success',
        title: 'Procesada correctamente',
        text: 'La retención ha sido procesada exitosamente',
        confirmButtonText: 'Aceptar'
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al procesar',
        text: error.message || 'Ha ocurrido un error al procesar la retención',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelRetention = async () => {
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
        setProcessing(true);
        Swal.fire({
          title: 'Anulando...',
          text: 'Enviando solicitud de anulación',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        
        await cancelRetention(id, reason);
        await loadRetentionData();
        
        Swal.fire({
          icon: 'success',
          title: 'Anulada correctamente',
          text: 'La retención ha sido anulada exitosamente',
          confirmButtonText: 'Aceptar'
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al anular',
        text: error.message || 'Ha ocurrido un error al anular la retención',
        confirmButtonText: 'Aceptar'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRetention = async () => {
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
        setProcessing(true);
        
        await deleteRetention(id);
        
        Swal.fire({
          icon: 'success',
          title: 'Eliminada',
          text: 'La retención ha sido eliminada exitosamente',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          navigate('/dashboard/retenciones');
        });
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error al eliminar',
        text: error.message || 'Ha ocurrido un error al eliminar la retención',
        confirmButtonText: 'Aceptar'
      });
      setProcessing(false);
    }
  };

  const handleGeneratePDF = async () => {
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

  const handleEditRetention = () => {
    navigate(`/dashboard/retenciones/${id}/editar`);
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
      case 'renta': return 'Retención en la Fuente (Renta)';
      case 'iva': return 'Retención de IVA';
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
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-gray-50 p-4 border-b border-gray-200 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Detalle de Retención</h1>
          <Button
            color="secondary"
            size="sm"
            onClick={() => navigate('/dashboard/retenciones')}
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
              <Button color="secondary" onClick={() => navigate('/dashboard/retenciones')}>
                Volver a retenciones
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Acciones principales */}
            <div className="mb-6 flex flex-wrap justify-end gap-2">
              {retention?.status === 'draft' && (
                <>
                  <Button
                    color="info"
                    className="flex items-center"
                    onClick={handleEditRetention}
                    disabled={processing}
                  >
                    <FaEdit className="mr-2" /> Editar
                  </Button>
                  <Button
                    color="danger"
                    className="flex items-center"
                    onClick={handleDeleteRetention}
                    disabled={processing}
                  >
                    <FaTrash className="mr-2" /> Eliminar
                  </Button>
                  <Button
                    color="success"
                    className="flex items-center"
                    onClick={handleProcessRetention}
                    disabled={processing}
                  >
                    <FaCheckCircle className="mr-2" /> Procesar
                  </Button>
                </>
              )}
              
              {retention?.status === 'processed' && (
                <Button
                  color="danger"
                  className="flex items-center"
                  onClick={handleCancelRetention}
                  disabled={processing}
                >
                  <FaTimesCircle className="mr-2" /> Anular
                </Button>
              )}
              
              <Button
                color="primary"
                className="flex items-center"
                onClick={handleGeneratePDF}
                disabled={processing}
              >
                <FaFilePdf className="mr-2" /> Generar PDF
              </Button>
            </div>
            
            {/* Información de encabezado */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="bg-gray-50">
                  <h2 className="text-lg font-semibold">Información de la Retención</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Número:</p>
                      <p className="font-medium">{retention?.retentionNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Estado:</p>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(retention?.status)}`}>
                        {getStatusText(retention?.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha:</p>
                      <p className="font-medium">{new Date(retention?.date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo:</p>
                      <p className="font-medium">{getTypeText(retention?.retentionType)}</p>
                    </div>
                    
                    {retention?.status === 'processed' && (
                      <>
                        <div>
                          <p className="text-sm text-gray-500">Autorización:</p>
                          <p className="font-medium">{retention?.authorizationNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de autorización:</p>
                          <p className="font-medium">
                            {retention?.authorizationDate ? 
                              new Date(retention.authorizationDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                    
                    {retention?.status === 'cancelled' && (
                      <>
                        <div className="col-span-2">
                          <p className="text-sm text-gray-500">Motivo de anulación:</p>
                          <p className="font-medium">{retention?.cancellationReason || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Fecha de anulación:</p>
                          <p className="font-medium">
                            {retention?.cancelledAt ? 
                              new Date(retention.cancelledAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardBody>
              </Card>
              
              <Card>
                <CardHeader className="bg-gray-50">
                  <h2 className="text-lg font-semibold">Factura Relacionada</h2>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Número:</p>
                      <p className="font-medium">{retention?.invoice?.invoiceNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Fecha:</p>
                      <p className="font-medium">
                        {retention?.invoice?.date ? 
                          new Date(retention.invoice.date).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Cliente:</p>
                      <p className="font-medium">{retention?.invoice?.customer?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">RUC/CI:</p>
                      <p className="font-medium">{retention?.invoice?.customer?.identification || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Factura:</p>
                      <p className="font-medium">
                        ${retention?.invoice?.total?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </div>
            
            {/* Observaciones */}
            {retention?.observations && (
              <Card className="mb-6">
                <CardHeader className="bg-gray-50">
                  <h2 className="text-lg font-semibold">Observaciones</h2>
                </CardHeader>
                <CardBody>
                  <p>{retention.observations}</p>
                </CardBody>
              </Card>
            )}
            
            {/* Tabla de conceptos retenidos */}
            <Card className="mb-6">
              <CardHeader className="bg-gray-50">
                <h2 className="text-lg font-semibold">Conceptos Retenidos</h2>
              </CardHeader>
              <CardBody className="p-0">
                <Table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Concepto</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Base</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {retention?.items?.length > 0 ? (
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
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                          No hay conceptos de retención
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-right font-semibold">
                        Total Retenido:
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        ${retention?.totalRetained?.toFixed(2) || '0.00'}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </CardBody>
            </Card>
            
            {/* Información de creación y modificación */}
            <Card>
              <CardHeader className="bg-gray-50">
                <h2 className="text-lg font-semibold">Información del Sistema</h2>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Creado por:</p>
                    <p className="font-medium">{retention?.createdBy?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha de creación:</p>
                    <p className="font-medium">
                      {retention?.createdAt ? 
                        new Date(retention.createdAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última actualización:</p>
                    <p className="font-medium">
                      {retention?.updatedAt ? 
                        new Date(retention.updatedAt).toLocaleString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default DetalleRetencion; 