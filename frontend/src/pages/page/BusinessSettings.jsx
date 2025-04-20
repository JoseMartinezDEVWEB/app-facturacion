import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { saveBusinessInfo, getBusinessInfo } from '../../services/businessService';
import { useBusiness } from '../../context/BusinessContext';

const BusinessSettings = () => {
  const navigate = useNavigate();
  const { updateBusinessInfo } = useBusiness();
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    taxId: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    comments: '',
    logo: null
  });

  // Cargar datos existentes si los hay
  useEffect(() => {
    const fetchExistingData = async () => {
      try {
        setLoading(true);
        const response = await getBusinessInfo();
        
        if (response.success && response.data) {
          const data = response.data;
          setFormData({
            name: data.name || '',
            taxId: data.taxId || '',
            address: data.address || '',
            phone: data.phone || '',
            email: data.email || '',
            website: data.website || '',
            comments: data.comments || '',
            logo: data.logo || null
          });
          
          if (data.logo) {
            setLogoPreview(data.logo);
          }
        }
      } catch (error) {
        console.error('Error al cargar datos existentes:', error);
        toast.error('No se pudieron cargar los datos existentes');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExistingData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar tipo y tamaño
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validTypes.includes(file.type)) {
        toast.error('Solo se permiten imágenes (jpeg, jpg, png, gif)');
        return;
      }
      
      if (file.size > maxSize) {
        toast.error('El archivo no debe superar los 5MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        logo: file
      }));
      
      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.name || !formData.taxId || !formData.address || !formData.phone || !formData.email) {
      toast.error('Todos los campos obligatorios deben ser completados');
      return;
    }
    
    try {
      setLoading(true);
      const response = await saveBusinessInfo(formData);
      
      if (response.success) {
        toast.success('Información del negocio guardada con éxito');
        // Actualizar el contexto global
        updateBusinessInfo(response.data);
        navigate('/dashboard');
      } else {
        toast.error(response.message || 'Error al guardar la información');
      }
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(error.message || 'Ocurrió un error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto p-4"
    >
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Configuración del Negocio</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-40 h-40 bg-gray-100 rounded-full overflow-hidden flex items-center justify-center mb-2 border-2 border-gray-200">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400">Sin logo</span>
              )}
            </div>
            <label className="relative cursor-pointer bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md transition-colors">
              <span>Seleccionar Logo</span>
              <input
                type="file"
                onChange={handleLogoChange}
                accept="image/jpeg,image/jpg,image/png,image/gif"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
            <p className="text-sm text-gray-500 mt-1">Formatos: JPG, PNG, GIF (máx. 5MB)</p>
          </div>
          
          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Negocio *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RNC/Identificación Fiscal *</label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Dirección *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono *</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sitio Web</label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://www.ejemplo.com"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Comentarios Adicionales</label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={handleChange}
                rows="3"
                placeholder="Notas o información adicional sobre el negocio..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          {/* Botones */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </>
              ) : 'Guardar Configuración'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default BusinessSettings; 