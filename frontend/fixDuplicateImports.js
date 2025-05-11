// Script para corregir importaciones duplicadas - compatible con Windows
// Ejecutar con: node fixDuplicateImports.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = './src';

// Lista de archivos que tienen errores específicos de importación duplicada
const knownProblematicFiles = [
  'components/SplashLoader.jsx',
  'components/formCrearClientes/CrearClienteForm.jsx',
  'components/formCrearUsuarios/CrearUsuarioForm.jsx',
  'components/new-fact/CashPaymentDisplay.jsx',
  'components/new-fact/InvoicePreviewModal.jsx',
  'components/new-fact/PrintConfirmationModal.jsx',
  'components/payment/CreditCardForm.jsx',
  'components/payment/VerifoneTerminal.jsx',
  'context/AuthContext.jsx',
  'main.jsx',
  'pages/Unauthorized.jsx',
  'pages/page/ClienteForm.jsx',
  'pages/page/ComprasCredito.jsx',
  'pages/page/CrearCompraCredito.jsx',
  'pages/page/DashboardHome.jsx',
  'pages/page/DetalleCompraCredito.jsx',
  'pages/page/Productos.jsx',
  'pages/page/Proveedores.jsx',
  'pages/page/RegistrarPagoCompra.jsx',
  'utils/renderGuard.jsx'
];

// Buscar todos los archivos JSX para verificar
const jsxFiles = glob.sync(path.join(SRC_DIR, '**/*.jsx'));

// Procesar cada archivo
let fixedCount = 0;

// Primero corregir los archivos conocidos con problemas
knownProblematicFiles.forEach(relPath => {
  const filePath = path.join(SRC_DIR, relPath);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Archivo no encontrado: ${filePath}`);
    return;
  }

  console.log(`Procesando archivo conocido: ${filePath}`);
  fixDuplicateImports(filePath);
});

// Luego buscar otros archivos que puedan tener el mismo problema
jsxFiles.forEach(filePath => {
  if (!knownProblematicFiles.some(known => filePath.endsWith(known))) {
    // Solo verificar archivos que no estén en la lista conocida
    console.log(`Verificando: ${filePath}`);
    fixDuplicateImports(filePath);
  }
});

function fixDuplicateImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Patrones de importación de React
    const reactImportPattern = /import\s+React(?:,\s*\{([^}]*)\})?\s+from\s+['"]react['"];?/g;
    const namedImportPattern = /import\s+\{([^}]*)\}\s+from\s+['"]react['"];?/g;
    
    // Extraer todas las importaciones de React
    let allImports = [];
    let match;
    const originalContent = content;
    
    // Encontrar todas las importaciones de React (tanto default como named)
    while ((match = reactImportPattern.exec(content)) !== null) {
      // Si hay importaciones nombradas, obtenerlas
      const namedImports = match[1] ? match[1].split(',').map(imp => imp.trim()) : [];
      allImports.push({
        fullMatch: match[0],
        namedImports: namedImports,
        hasDefaultImport: true
      });
    }
    
    // Encontrar todas las importaciones nombradas de React (sin importación default)
    while ((match = namedImportPattern.exec(content)) !== null) {
      const namedImports = match[1].split(',').map(imp => imp.trim());
      allImports.push({
        fullMatch: match[0],
        namedImports: namedImports,
        hasDefaultImport: false
      });
    }
    
    // Si hay más de una importación, consolidarlas
    if (allImports.length > 1) {
      // Recolectar todas las importaciones nombradas únicas
      const uniqueNamedImports = new Set();
      let hasDefaultImport = false;
      
      allImports.forEach(imp => {
        if (imp.hasDefaultImport) hasDefaultImport = true;
        imp.namedImports.forEach(named => uniqueNamedImports.add(named));
      });
      
      // Eliminar todas las importaciones de React
      allImports.forEach(imp => {
        content = content.replace(imp.fullMatch, '');
      });
      
      // Crear una nueva importación consolidada
      let newImport;
      if (uniqueNamedImports.size > 0) {
        if (hasDefaultImport) {
          newImport = `import React, { ${Array.from(uniqueNamedImports).join(', ')} } from 'react';`;
        } else {
          newImport = `import { ${Array.from(uniqueNamedImports).join(', ')} } from 'react';`;
        }
      } else if (hasDefaultImport) {
        newImport = `import React from 'react';`;
      }
      
      // Añadir la nueva importación al principio del archivo
      if (newImport) {
        content = newImport + '\n' + content;
      }
      
      // Guardar cambios si hubo modificaciones
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Corregido: ${filePath}`);
        fixedCount++;
      }
    }
  } catch (error) {
    console.error(`❌ Error procesando ${filePath}:`, error.message);
  }
}

console.log(`\n🎉 Completado! Se corrigieron ${fixedCount} archivos.`); 