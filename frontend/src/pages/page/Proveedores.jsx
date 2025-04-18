import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BiSearch, BiPlus, BiX, BiFilterAlt, BiTrash, BiExport } from 'react-icons/bi';
import { FaEye } from 'react-icons/fa';

// Componentes
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import Pagination from '../../components/Pagination';

// Servicios y utilidades
import { getSuppliers, deleteSupplier } from '../../services/supplierService';
import { formatDate } from '../../utils/formatters';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { PAGINATION, SUPPLIER_STATUS } from '../../config/constants';

const Proveedores = () => {
  // Estados
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(PAGINATION.DEFAULT_PAGE);
  const [itemsPerPage, setItemsPerPage] = useState(PAGINATION.DEFAULT_LIMIT);
  
  // Filtros
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    minRating: '',
    createdAfter: '',
    createdBefore: '',
  });
  
  // Obtener proveedores
  const fetchSuppliers = async (page = currentPage, limit = itemsPerPage) => {
    try {
      setLoading(true);
      
      const queryParams = {
        page,
        limit,
        ...filters
      };
      
      if (searchTerm) {
        queryParams.search = searchTerm;
      }
      
      const response = await getSuppliers(queryParams);
      setSuppliers(response.suppliers || []);
      setTotalItems(response.totalItems || 0);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
      setError('No se pudieron cargar los proveedores. Por favor, intente nuevamente.');
      setLoading(false);
    }
  };
  
  // Cargar proveedores al montar el componente
  useEffect(() => {
    fetchSuppliers();
  }, [currentPage, itemsPerPage]);
  
  // Buscar proveedores
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Resetear a la primera página
    fetchSuppliers(1);
  };
  
  // Cambiar página
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };
  
  // Cambiar cantidad de items por página
  const handleItemsPerPageChange = (limit) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };
  
  // Manejar cambios en filtros
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  
  // Aplicar filtros
  const applyFilters = () => {
    setCurrentPage(1);
    fetchSuppliers(1);
    setShowFilters(false);
  };
  
  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      status: '',
      category: '',
      minRating: '',
      createdAfter: '',
      createdBefore: '',
    });
  };
  
  // Eliminar proveedor
  const handleDeleteSupplier = async () => {
    if (!selectedSupplier) return;
    
    try {
      await deleteSupplier(selectedSupplier._id);
      setSuppliers(suppliers.filter(supplier => supplier._id !== selectedSupplier._id));
      toast.success('Proveedor eliminado correctamente');
      setShowDeleteModal(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      toast.error('Error al eliminar el proveedor');
    }
  };
  
  // Confirmar eliminación
  const confirmDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDeleteModal(true);
  };
  
  // Exportar a Excel
  const handleExportToExcel = () => {
    const data = suppliers.map(supplier => ({
      Nombre: supplier.name,
      ID_Fiscal: supplier.taxId,
      Categoría: supplier.category,
      Estado: supplier.status,
      Teléfono: supplier.phone,
      Email: supplier.email,
      Dirección: supplier.address,
      Calificación: supplier.rating || 0,
      Creado: formatDate(supplier.createdAt)
    }));
    
    const columns = [
      { header: 'Nombre', key: 'Nombre' },
      { header: 'ID Fiscal', key: 'ID_Fiscal' },
      { header: 'Categoría', key: 'Categoría' },
      { header: 'Estado', key: 'Estado' },
      { header: 'Teléfono', key: 'Teléfono' },
      { header: 'Email', key: 'Email' },
      { header: 'Dirección', key: 'Dirección' },
      { header: 'Calificación', key: 'Calificación' },
      { header: 'Creado', key: 'Creado' }
    ];
    
    exportToExcel(data, columns, 'Proveedores');
  };
  
  // Exportar a PDF
  const handleExportToPDF = () => {
    const data = suppliers.map(supplier => ({
      Nombre: supplier.name,
      ID_Fiscal: supplier.taxId,
      Categoría: supplier.category,
      Estado: supplier.status,
      Teléfono: supplier.phone,
      Email: supplier.email,
      Calificación: supplier.rating || 0
    }));
    
    const columns = [
      { header: 'Nombre', key: 'Nombre' },
      { header: 'ID Fiscal', key: 'ID_Fiscal' },
      { header: 'Categoría', key: 'Categoría' },
      { header: 'Estado', key: 'Estado' },
      { header: 'Teléfono', key: 'Teléfono' },
      { header: 'Email', key: 'Email' },
      { header: 'Calificación', key: 'Calificación' }
    ];
    
    exportToPdf(data, columns, 'Listado de Proveedores');
  };
  
  // Obtener clase para el badge de estado
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case SUPPLIER_STATUS.ACTIVE:
        return 'bg-green-100 text-green-800';
      case SUPPLIER_STATUS.INACTIVE:
        return 'bg-red-100 text-red-800';
      case SUPPLIER_STATUS.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Obtener texto para el estado
  const getStatusText = (status) => {
    switch (status) {
      case SUPPLIER_STATUS.ACTIVE:
        return 'Activo';
      case SUPPLIER_STATUS.INACTIVE:
        return 'Inactivo';
      case SUPPLIER_STATUS.PENDING:
        return 'Pendiente';
      default:
        return 'Desconocido';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-6"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Proveedores</h1>
        <p className="text-gray-600">Gestione sus proveedores de productos y servicios</p>
      </div>
      
      {/* Barra de acciones */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="w-full md:w-auto flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex w-full md:w-80">
            <input
              type="text"
              placeholder="Buscar por nombre, ID o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
            >
              <BiSearch size={20} />
            </button>
          </form>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            title="Filtros"
          >
            <BiFilterAlt size={20} />
          </button>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Link
            to="/dashboard/proveedores/crear"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <BiPlus size={20} />
            <span>Nuevo Proveedor</span>
          </Link>
          
          <div className="flex gap-2">
            <button
              onClick={handleExportToExcel}
              className="p-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              title="Exportar a Excel"
              disabled={loading || suppliers.length === 0}
            >
              <BiExport size={20} />
            </button>
            
            <button
              onClick={handleExportToPDF}
              className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              title="Exportar a PDF"
              disabled={loading || suppliers.length === 0}
            >
              <BiExport size={20} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Panel de filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-md shadow-md mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Filtros</h3>
            <button
              onClick={() => setShowFilters(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <BiX size={24} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
              <select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value={SUPPLIER_STATUS.ACTIVE}>Activo</option>
                <option value={SUPPLIER_STATUS.INACTIVE}>Inactivo</option>
                <option value={SUPPLIER_STATUS.PENDING}>Pendiente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas</option>
                <option value="General">General</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Materiales">Materiales</option>
                <option value="Alimentos">Alimentos</option>
                <option value="Servicios">Servicios</option>
                <option value="Logística">Logística</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calificación mínima</label>
              <select
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Cualquiera</option>
                <option value="1">1 estrella o más</option>
                <option value="2">2 estrellas o más</option>
                <option value="3">3 estrellas o más</option>
                <option value="4">4 estrellas o más</option>
                <option value="5">5 estrellas</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Creado después de</label>
              <input
                type="date"
                name="createdAfter"
                value={filters.createdAfter}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Creado antes de</label>
              <input
                type="date"
                name="createdBefore"
                value={filters.createdBefore}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Limpiar
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
      
      {/* Tabla de proveedores */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => fetchSuppliers()} />
      ) : suppliers.length === 0 ? (
        <div className="bg-white rounded-md shadow-md p-6 text-center">
          <p className="text-gray-500 mb-4">No se encontraron proveedores</p>
          <Link
            to="/dashboard/proveedores/crear"
            className="inline-flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            <BiPlus size={20} />
            <span>Crear Proveedor</span>
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-md shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Fiscal
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {suppliers.map((supplier) => (
                    <tr key={supplier._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{supplier.taxId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{supplier.category || 'No especificado'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(supplier.status)}`}>
                          {getStatusText(supplier.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{supplier.phone}</div>
                        <div className="text-sm text-gray-500">{supplier.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link
                            to={`/dashboard/proveedores/${supplier._id}`}
                            className="text-blue-600 hover:text-blue-900"
                            title="Ver detalles"
                          >
                            <FaEye size={18} />
                          </Link>
                          <button
                            onClick={() => confirmDelete(supplier)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <BiTrash size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Paginación */}
          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              pageSizes={PAGINATION.PAGE_SIZES}
            />
          </div>
        </>
      )}
      
      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirmar eliminación</h3>
            <p className="text-sm text-gray-500 mb-4">
              ¿Está seguro que desea eliminar al proveedor <span className="font-medium">{selectedSupplier.name}</span>? 
              Esta acción no se puede deshacer.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteSupplier}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Proveedores;