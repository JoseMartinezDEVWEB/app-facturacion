import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { ERROR_MESSAGES } from '../config/config';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      console.log('Login.jsx: Iniciando sesión con:', formData);
      
      // Llamar directamente a un endpoint simplificado para depuración
      // Esto es temporal hasta resolver el problema
      const response = await login(formData);
      console.log('Respuesta exitosa:', response);
      
      // La redirección se maneja en el useEffect
    } catch (error) {
      console.error('Error de login:', error);
      
      // Manejar errores específicos según el código
      if (error.code === 'ECONNABORTED') {
        setError('Tiempo de espera agotado. El servidor está tardando en responder.');
      } else if (error.code === 'ERR_NETWORK') {
        setError('No se pudo establecer conexión con el servidor. Verifica que el backend esté en funcionamiento.');
      } else if (error.response) {
        if (error.response.status === 404) {
          setError('La ruta de inicio de sesión no existe en el servidor. Verifica la configuración del backend.');
        } else if (error.response.status === 500) {
          setError('Error interno del servidor. Por favor, contacta al administrador.');
        } else if (error.response.status === 401) {
          setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        } else {
          setError(
            error.response?.data?.message || 
            error.message || 
            ERROR_MESSAGES.DEFAULT
          );
        }
      } else {
        setError(error.message || ERROR_MESSAGES.DEFAULT);
      }
      
      // Incrementar contador de intentos
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error cuando el usuario empieza a escribir
    if (error) setError('');
  };

  // Mostrar información de ayuda después de varios intentos fallidos
  const showHelp = retryCount > 1;

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-blue-50 to-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div 
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md"
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={loading}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="bg-red-50 text-red-700 p-3 rounded-lg text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {error}
                {showHelp && (
                  <div className="mt-2 text-xs">
                    <p>Posibles soluciones:</p>
                    <ul className="list-disc pl-4 mt-1">
                      <li>Verifica que el servidor de backend esté ejecutándose en http://localhost:4000</li>
                      <li>Comprueba que la ruta correcta para login sea /api/login (no /api/users/login)</li>
                      <li>Error 404: La ruta de API no existe, verifica la configuración del backend</li>
                      <li>Error 500: Hay un problema interno en el servidor</li>
                      <li>Si estás en modo desarrollo, revisa la consola del servidor para ver errores detallados</li>
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            type="submit"
            className={`w-full bg-blue-600 text-white py-2 rounded-lg transition-colors ${
              loading ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </motion.button>

          <motion.button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-blue-600 py-2 hover:text-blue-700"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            Volver al inicio
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default Login;