import { API_ROUTES } from '../config/config';

const fetchUserInfo = async () => {
  try {
    setUserInfo(prev => ({ ...prev, isLoading: true }));
    // Hacer la petición al endpoint correcto de auth
    const response = await api.get(API_ROUTES.AUTH.USER_INFO);
    if (response && (response.username || response.data?.username)) {
      // El backend devuelve 'username' y 'role'
      const userData = response.username ? response : response.data;
      const { username, role } = userData;
      // Almacenar en localStorage para persistencia
      localStorage.setItem('userName', username);
      localStorage.setItem('userRole', role);
      setUserInfo({
        nombre: username,
        rol: role,
        isLoading: false
      });
    } else {
      throw new Error('Datos de respuesta inválidos');
    }
  } catch (error) {
    console.error('Error al obtener información del usuario:', error);
    setUserInfo({
      nombre: localStorage.getItem('userName') || '',
      rol: localStorage.getItem('userRole') || '',
      isLoading: false
    });
  }
}; 