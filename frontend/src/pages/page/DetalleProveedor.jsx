import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FaCheckCircle, FaTimesCircle, FaEdit, FaTrash, FaDownload, FaStar, FaRegStar, FaPhone, FaEnvelope, FaGlobe, FaMapMarkerAlt, FaIdCard, FaMoneyBillWave } from 'react-icons/fa';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from 'reactstrap';

// Componentes
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import SupplierRating from '../../components/suppliers/SupplierRating';

// Servicios y utilidades
import supplierService from '../../services/supplierService';
import { formatDate } from '../../utils/formatters';
import { API_URL } from '../../config/constants';

const DetalleProveedor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Estados
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  // Cargar datos del proveedor
  useEffect(() => {
    const fetchSupplierData = async () => {
      try {
        setLoading(true);
        const response = await supplierService.getSupplierById(id);
        setSupplier(response.data);
      } catch (error) {
        console.error('Error al cargar el proveedor:', error);
        setError('No se pudo cargar la información del proveedor. Por favor, intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSupplierData();
  }, [id]);
  
  // Funciones para las acciones
  const handleDelete = async () => {
    try {
      await supplierService.deleteSupplier(id);
      toast.success('Proveedor eliminado correctamente');
      navigate('/dashboard/proveedores');
    } catch (error) {
      console.error('Error al eliminar el proveedor:', error);
      toast.error('Error al eliminar el proveedor. Por favor, intente nuevamente.');
    }
  };

  const handleRatingChange = async (newRating) => {
    try {
      await supplierService.updateSupplierRating(id, { rating: newRating });
      setSupplier({ ...supplier, rating: newRating });
      toast.success('Calificación actualizada');
    } catch (error) {
      console.error('Error al actualizar la calificación:', error);
      toast.error('No se pudo actualizar la calificación. Por favor, intente nuevamente.');
    }
  };

  const handleDownloadDocument = async (documentId, documentName) => {
    try {
      const response = await axios.get(`${API_URL}/suppliers/${id}/documents/${documentId}`, {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error al descargar el documento:', error);
      toast.error('No se pudo descargar el documento. Por favor, intente nuevamente.');
    }
  };
  
  // Funciones para asignar clases de badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };
  
  // Renderizado condicional para carga y errores
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  if (!supplier) return <ErrorMessage message="No se encontró la información del proveedor" />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{supplier.name}</h1>
        <div className="flex space-x-2">
          <Link 
            to={`/dashboard/proveedores/${id}/editar`}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaEdit className="mr-2" /> Editar
          </Link>
          <button
            onClick={() => setDeleteModalOpen(true)}
            className="flex items-center px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            <FaTrash className="mr-2" /> Eliminar
          </button>
        </div>
      </div>
      
      {/* Sección de información básica */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Información General</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <FaIdCard className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">NIT/RUC</p>
              <p className="font-medium">{supplier.taxId}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaMapMarkerAlt className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Dirección</p>
              <p className="font-medium">{supplier.address}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaPhone className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Teléfono</p>
              <p className="font-medium">{supplier.phone}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaEnvelope className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{supplier.email}</p>
            </div>
          </div>
          
          {supplier.website && (
            <div className="flex items-center">
              <FaGlobe className="mr-3 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Sitio Web</p>
                <a 
                  href={supplier.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="font-medium text-blue-500 hover:underline"
                >
                  {supplier.website}
                </a>
              </div>
            </div>
          )}
          
          <div className="flex items-center">
            <div className="mr-3 text-gray-500">
              {supplier.status === 'active' ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-red-500" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado</p>
              <p className={`inline-block px-2 py-1 rounded text-xs text-white ${getStatusBadgeClass(supplier.status)}`}>
                {supplier.status === 'active' ? 'Activo' : supplier.status === 'inactive' ? 'Inactivo' : 'Pendiente'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-sm text-gray-500">Calificación</p>
          <SupplierRating 
            rating={supplier.rating || 0} 
            onRatingChange={handleRatingChange}
          />
        </div>
      </div>
      
      {/* Sección de detalles fiscales */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Detalles Fiscales</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <FaMoneyBillWave className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Condiciones de pago</p>
              <p className="font-medium">{supplier.paymentTerms || 'No especificado'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <FaIdCard className="mr-3 text-gray-500" />
            <div>
              <p className="text-sm text-gray-500">Categoría</p>
              <p className="font-medium">{supplier.category || 'No especificado'}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sección de documentos */}
      {supplier.documents && supplier.documents.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Documentos</h2>
          
          <div className="space-y-2">
            {supplier.documents.map((doc) => (
              <div key={doc._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span>{doc.name}</span>
                <button
                  onClick={() => handleDownloadDocument(doc._id, doc.name)}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaDownload /> 
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Sección de notas */}
      {supplier.notes && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Notas</h2>
          <p className="whitespace-pre-line">{supplier.notes}</p>
        </div>
      )}
      
      {/* Sección de historial */}
      {supplier.history && supplier.history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Historial</h2>
          
          <div className="space-y-4">
            {supplier.history.map((event, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-500">{formatDate(event.date)}</p>
                <p className="font-medium">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Modal de confirmación de eliminación */}
      <Modal isOpen={deleteModalOpen} toggle={() => setDeleteModalOpen(!deleteModalOpen)}>
        <ModalHeader toggle={() => setDeleteModalOpen(!deleteModalOpen)}>
          Confirmar eliminación
        </ModalHeader>
        <ModalBody>
          ¿Está seguro que desea eliminar este proveedor? Esta acción no se puede deshacer.
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeleteModalOpen(false)}>
            Cancelar
          </Button>
          <Button color="danger" onClick={handleDelete}>
            Eliminar
          </Button>
        </ModalFooter>
      </Modal>
    </motion.div>
  );
};

export default DetalleProveedor; 