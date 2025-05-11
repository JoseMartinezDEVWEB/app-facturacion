import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import localtunnel from 'localtunnel';

// Definir __dirname para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definir el puerto de la aplicación
const PORT = 4501;
const SUBDOMAIN = 'facturacion-app'; // Puedes cambiar esto por el subdominio que prefieras

// Función para iniciar el servidor
function startServer() {
  console.log('Iniciando servidor en puerto', PORT);
  
  const serverProcess = spawn('node', ['src/server.js', '--port', PORT.toString()], {
    cwd: __dirname,
    stdio: 'inherit',
    env: {...process.env, PORT: PORT.toString()}
  });

  serverProcess.on('error', (error) => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  });

  return serverProcess;
}

// Función para iniciar el túnel
async function startTunnel() {
  try {
    console.log('Estableciendo túnel para puerto', PORT);
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: SUBDOMAIN
    });

    console.log(`\n🔥 ¡Túnel establecido! Tu aplicación está disponible en:\n${tunnel.url}`);
    console.log(`\n📱 Para la conexión remota usa: ${tunnel.url}/api\n`);
    console.log(`📋 Instrucciones de conexión:`);
    console.log(`   1. Inicia sesión como administrador o superadministrador`);
    console.log(`   2. Ve a la sección "Conexión Remota" en el menú lateral`);
    console.log(`   3. Desactiva "Modo Local" y usa la URL: ${tunnel.url}/api`);
    console.log(`   4. Haz clic en "Conectar"\n`);
    
    tunnel.on('close', () => {
      console.log('El túnel se ha cerrado');
      process.exit(1);
    });

    tunnel.on('error', (err) => {
      console.error('Error en el túnel:', err);
    });

    return tunnel;
  } catch (error) {
    console.error('Error al establecer el túnel:', error);
    if (error.message && error.message.includes('invalid subdomain')) {
      console.log('\n⚠️ El subdominio solicitado no está disponible.');
      console.log('Intentando nuevamente con un subdominio aleatorio...\n');
      return startTunnelRandom();
    }
    process.exit(1);
  }
}

// Función para iniciar el túnel con subdominio aleatorio
async function startTunnelRandom() {
  try {
    const tunnel = await localtunnel({ 
      port: PORT
    });

    console.log(`\n🔥 ¡Túnel establecido! Tu aplicación está disponible en:\n${tunnel.url}`);
    console.log(`\n📱 Para la conexión remota usa: ${tunnel.url}/api\n`);
    console.log(`📋 Instrucciones de conexión:`);
    console.log(`   1. Inicia sesión como administrador o superadministrador`);
    console.log(`   2. Ve a la sección "Conexión Remota" en el menú lateral`);
    console.log(`   3. Desactiva "Modo Local" y usa la URL: ${tunnel.url}/api`);
    console.log(`   4. Haz clic en "Conectar"\n`);
    
    tunnel.on('close', () => {
      console.log('El túnel se ha cerrado');
      process.exit(1);
    });

    return tunnel;
  } catch (error) {
    console.error('Error al establecer el túnel con subdominio aleatorio:', error);
    process.exit(1);
  }
}

// Función principal
async function main() {
  try {
    console.log('🚀 Iniciando sistema de facturación con acceso remoto...\n');
    
    // Inicia el servidor
    const server = startServer();
    
    // Espera un poco para asegurarse de que el servidor esté funcionando
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Inicia el túnel
    const tunnel = await startTunnel();
    
    // Manejo de cierre limpio
    process.on('SIGINT', () => {
      console.log('\n👋 Cerrando aplicación...');
      tunnel.close();
      server.kill();
      process.exit(0);
    });
    
    console.log('\n⚠️ Mantén esta ventana abierta para mantener activo el túnel');
    console.log('   Presiona Ctrl+C para detener el servidor y el túnel\n');
    
  } catch (error) {
    console.error('Error al iniciar la aplicación:', error);
    process.exit(1);
  }
}

// Ejecutar todo
main(); 