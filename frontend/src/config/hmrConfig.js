// Configuración global para HMR (Hot Module Replacement)

// Definir el token de WebSocket para Vite HMR
if (typeof window !== 'undefined' && window.__WS_TOKEN__ === undefined) {
  window.__WS_TOKEN__ = 'vite-hmr';
}

// Esta función puede ser ampliada con más configuraciones en el futuro
export function setupHMR() {
  // Inicializar aquí otras configuraciones si es necesario
  console.log('HMR configuration applied');
}

export default setupHMR; 