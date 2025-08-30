// Intenta obtener la URL de la API desde el contexto de Electron (preload.js)
let API_URL = '';

// Si estamos en Electron y preload expuso la variable
if (typeof window !== 'undefined' && window.env && window.env.API_URL) {
  API_URL = window.env.API_URL;
}

// Si no, usa la variable de entorno inyectada por el bundler (web)
// if (!API_URL) {
//   API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
// }

console.log('API URL configurada:', API_URL);

export default API_URL; 