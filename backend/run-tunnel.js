/**
 * Script para ejecutar el túnel compatible con ambos sistemas de módulos
 */

const fs = require('fs');
const { execSync } = require('child_process');
const { exec } = require('child_process');

console.log('🔍 Detectando el mejor método para iniciar el túnel...');

// Verificar si el puerto 4500 está en uso
function checkPort(port, callback) {
  const command = process.platform === 'win32' 
    ? `netstat -ano | find "LISTENING" | find ":${port}"` 
    : `lsof -i:${port}`;
  
  exec(command, (error, stdout, stderr) => {
    if (stdout.trim()) {
      console.log(`⚠️ El puerto ${port} ya está en uso. Se usará el puerto 4501 como alternativa.`);
      callback(true);
    } else {
      callback(false);
    }
  });
}

try {
  // Intentar instalar localtunnel si no está instalado
  try {
    require('localtunnel');
  } catch (error) {
    console.log('📦 Instalando localtunnel...');
    execSync('npm install --save localtunnel', { stdio: 'inherit' });
  }

  // Verificar puerto antes de iniciar
  checkPort(4500, (portInUse) => {
    if (portInUse) {
      console.log('ℹ️ Se utilizará el puerto 4501 automáticamente');
    }
    
    // Intentar iniciar la versión ESM primero
    console.log('🚀 Iniciando túnel (ESM)...');
    try {
      require('child_process').spawn('node', ['tunnel.js'], { 
        stdio: 'inherit',
        detached: false 
      });
    } catch (error) {
      console.error('❌ Error al iniciar la versión ESM:', error.message);
      console.log('🔄 Intentando versión CommonJS...');
      
      try {
        require('child_process').spawn('node', ['tunnel-cjs.js'], { 
          stdio: 'inherit',
          detached: false 
        });
      } catch (cjsError) {
        console.error('❌ Error al iniciar la versión CommonJS:', cjsError.message);
        console.error('💡 Por favor, intenta ejecutar manualmente:');
        console.error('   npm run tunnel      # Para ESM');
        console.error('   npm run tunnel:cjs  # Para CommonJS');
        
        // Sugerir matar el proceso que usa el puerto 4500
        if (portInUse) {
          console.log('\n📌 También puedes liberar el puerto 4500 terminando el proceso que lo está usando:');
          if (process.platform === 'win32') {
            console.log('   1. Ejecuta: netstat -ano | findstr :4500');
            console.log('   2. Identifica el PID (último número)');
            console.log('   3. Ejecuta: taskkill /F /PID <número-del-pid>');
          } else {
            console.log('   1. Ejecuta: lsof -i:4500');
            console.log('   2. Identifica el PID (segunda columna)');
            console.log('   3. Ejecuta: kill -9 <número-del-pid>');
          }
        }
      }
    }
  });
} catch (error) {
  console.error('Error general:', error.message);
  process.exit(1);
} 