/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { categoryApi } from '../../config/apis';

const CategoryForm = ({ onSubmit, initialData, onClose }) => {
  const [formData, setFormData] = useState(initialData || {
    name: '',
    description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nombre
        </label>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full p-2 border rounded-md"
          rows="3"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Guardar
        </button>
      </div>
    </form>
  );
};

const CategoryTable = ({ categories, onEdit, onDelete }) => (
  <div className="overflow-x-auto rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Nombre
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Descripción
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Fecha Creación
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
            Acciones
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {categories.map((category) => (
          <motion.tr
            key={category._id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="hover:bg-gray-50"
          >
            <td className="px-6 py-4 whitespace-nowrap">{category.name}</td>
            <td className="px-6 py-4">{category.description}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {new Date(category.createdAt).toLocaleDateString()}
            </td>
            <td className="px-6 py-4 whitespace-nowrap space-x-2">
              <button
                onClick={() => onEdit(category)}
                className="text-blue-600 hover:text-blue-900 transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => onDelete(category)}
                className="text-red-600 hover:text-red-900 transition-colors"
              >
                Eliminar
              </button>
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Categorias = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false }), 3000);
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await categoryApi.getAll();
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al cargar categorías', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalOpen(true);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const handleDelete = async (category) => {
    if (window.confirm('¿Estás seguro de eliminar esta categoría?')) {
      try {
        await categoryApi.delete(category._id);
        showNotification('Categoría eliminada exitosamente');
        fetchCategories();
      } catch (error) {
        showNotification(error.response?.data?.message || 'Error al eliminar categoría', 'error');
      }
    }
  };

  const handleSubmit = async (data) => {
    try {
      if (selectedCategory) {
        await categoryApi.update(selectedCategory._id, data);
        showNotification('Categoría actualizada exitosamente');
      } else {
        await categoryApi.create(data);
        showNotification('Categoría creada exitosamente');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error al procesar la operación', 'error');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center mb-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
        <button
          onClick={handleCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
        >
          Crear Categoría
        </button>
      </motion.div>

      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 p-4 rounded-md shadow-lg ${
              notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
            } text-white z-50`}
          >
            {notification.message}
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <CategoryTable
          categories={categories}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  {selectedCategory ? 'Editar Categoría' : 'Crear Categoría'}
                </h2>
                <CategoryForm
                  onSubmit={handleSubmit}
                  initialData={selectedCategory}
                  onClose={() => setModalOpen(false)}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Categorias;