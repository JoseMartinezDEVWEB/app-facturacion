/**
 * Script para verificar qué middleware de autenticación se está usando en las rutas
 * Ejecutar con: node utils/check-middleware.js
 */
import fs from 'fs';
import path from 'path';

const routesDir = path.join(process.cwd(), 'src', 'routes');
const results = {
  'auth.js': 0,
  'authmiddle.js': 0,
  'authmiddleware.js': 0,
  'unknown': 0,
  'files': []
};

/**
 * Buscar importaciones de middleware de autenticación en un archivo
 * @param {string} filePath - Ruta del archivo
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    
    // Patrones para buscar importaciones
    const patterns = [
      { regex: /import.*auth.*from.*auth/i, file: 'auth.js' },
      { regex: /import.*protect.*from.*authmiddle/i, file: 'authmiddle.js' },
      { regex: /import.*authMiddleware.*from.*authmiddleware/i, file: 'authmiddleware.js' }
    ];
    
    let found = false;
    
    // Verificar cada patrón
    for (const pattern of patterns) {
      if (pattern.regex.test(content)) {
        results[pattern.file]++;
        results.files.push({
          file: fileName,
          using: pattern.file
        });
        found = true;
      }
    }
    
    // Si no se encontró ningún patrón conocido pero hay menciones de autenticación
    if (!found && /auth|protect|middleware/i.test(content)) {
      results.unknown++;
      results.files.push({
        file: fileName,
        using: 'unknown'
      });
    }
  } catch (error) {
    console.error(`Error al leer ${filePath}:`, error.message);
  }
}

/**
 * Escanear un directorio recursivamente
 * @param {string} dir - Directorio a escanear
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath);
    } else if (file.endsWith('.js')) {
      checkFile(filePath);
    }
  }
}

// Ejecutar el escaneo
console.log('Escaneando archivos de rutas para verificar middleware...');
scanDirectory(routesDir);

// Mostrar resultados
console.log('\n=== RESULTADO DEL ESCANEO ===');
console.log(`auth.js: ${results['auth.js']} archivos`);
console.log(`authmiddle.js: ${results['authmiddle.js']} archivos`);
console.log(`authmiddleware.js: ${results['authmiddleware.js']} archivos`);
console.log(`Desconocido: ${results.unknown} archivos`);

console.log('\n=== DETALLE POR ARCHIVO ===');
results.files.forEach(item => {
  console.log(`${item.file}: usa ${item.using}`);
});

console.log('\n=== RECOMENDACIÓN ===');
if (results['auth.js'] > 0 || results['authmiddle.js'] > 0 || results['authmiddleware.js'] > 0) {
  console.log('Debes consolidar todos los middlewares en un solo archivo auth.js');
  console.log('Luego actualiza las importaciones en los archivos listados arriba');
} else if (results.unknown > 0) {
  console.log('Hay archivos que podrían estar usando middleware de autenticación de forma no estándar');
  console.log('Revisa manualmente esos archivos');
} else {
  console.log('No se encontraron usos de middleware de autenticación');
}