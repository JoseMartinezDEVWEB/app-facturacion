// Para compatibilidad con ES Modules en package.json type=module
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { globSync } from 'glob';

// Define los patrones para buscar archivos React
const jsxFiles = globSync('src/**/*.jsx', { cwd: process.cwd() });

// Contador para rastrear los archivos modificados
let fixedCount = 0;

jsxFiles.forEach((file) => {
  const filePath = resolve(process.cwd(), file);
  let content = readFileSync(filePath, 'utf8');
  
  // Verificar si hay múltiples importaciones de React
  const reactImportRegex = /import\s+React\s+from\s+['"]react['"];?\s*\n/g;
  const reactNamedImportRegex = /import\s+React,\s+\{([^}]+)\}\s+from\s+['"]react['"];?\s*\n/g;
  
  // Contar importaciones simples de React
  const simpleImports = content.match(reactImportRegex);
  const hasSimpleImport = simpleImports && simpleImports.length > 0;
  
  // Contar importaciones con componentes nombrados
  const namedImports = [];
  let match;
  
  while ((match = reactNamedImportRegex.exec(content)) !== null) {
    namedImports.push(match[1].trim());
  }
  
  // Si hay múltiples importaciones, corregir
  if (hasSimpleImport && namedImports.length > 0) {
    // Eliminar las importaciones simples
    content = content.replace(reactImportRegex, '');
    
    // Cambiar la primera importación nombrada para incluir React
    if (namedImports.length > 0) {
      const namedImport = namedImports[0];
      content = content.replace(
        new RegExp(`import\\s+React,\\s+\\{${namedImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\s+from\\s+['"]react['"];?\\s*\\n`),
        `import React, { ${namedImport} } from 'react';\n`
      );
    } else {
      // Si no hay importaciones nombradas, asegurar que haya una importación simple
      content = `import React from 'react';\n${content}`;
    }
    
    fixedCount++;
    writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed duplicate React imports in ${file}`);
  }
  // Si solo hay importaciones nombradas duplicadas
  else if (namedImports.length > 1) {
    // Recolectar todos los imports nombrados en un conjunto
    const uniqueNamedImports = new Set();
    namedImports.forEach(imports => {
      imports.split(',').forEach(imp => {
        uniqueNamedImports.add(imp.trim());
      });
    });
    
    // Eliminar todas las importaciones de React
    content = content.replace(reactNamedImportRegex, '');
    content = content.replace(reactImportRegex, '');
    
    // Crear una nueva importación consolidada
    const consolidatedImport = `import React, { ${Array.from(uniqueNamedImports).join(', ')} } from 'react';\n`;
    
    // Agregar la importación consolidada al principio del archivo
    content = consolidatedImport + content;
    
    fixedCount++;
    writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed duplicate named React imports in ${file}`);
  }
});

console.log(`Fixed React imports in ${fixedCount} files.`); 