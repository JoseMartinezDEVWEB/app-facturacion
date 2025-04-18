import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Exporta datos a un archivo Excel
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {Array} columns - Array de objetos con la configuración de columnas { header, key }
 * @param {string} filename - Nombre del archivo sin extensión
 */
export const exportToExcel = (data, columns, filename) => {
  try {
    // Crear la hoja de cálculo
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    // Aplicar estilos a los encabezados
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headerStyle = { font: { bold: true }, alignment: { horizontal: 'center' } };
    
    // Ajustar anchos de columnas basados en el contenido
    const wscols = columns.map(col => ({ wch: Math.max(col.header.length, 10) }));
    worksheet['!cols'] = wscols;
    
    // Crear el libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
    
    // Generar el archivo
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  } catch (error) {
    console.error('Error al exportar a Excel:', error);
    alert('Error al exportar a Excel. Por favor, intente nuevamente.');
  }
};

/**
 * Exporta datos a un archivo PDF
 * @param {Array} data - Array de objetos con los datos a exportar
 * @param {Array} columns - Array de objetos con la configuración de columnas { header, key }
 * @param {string} title - Título del documento
 */
export const exportToPdf = (data, columns, title) => {
  try {
    // Crear documento PDF
    const doc = new jsPDF();
    
    // Configurar título
    doc.setFontSize(16);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    
    // Formatear datos para autoTable
    const headers = columns.map(col => col.header);
    const dataRows = data.map(item => columns.map(col => item[col.key] || ''));
    
    // Agregar tabla
    doc.autoTable({
      head: [headers],
      body: dataRows,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [66, 135, 245],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    // Agregar pie de página con fecha
    const date = new Date().toLocaleString();
    doc.setFontSize(8);
    doc.text(`Generado el: ${date}`, 14, doc.internal.pageSize.height - 10);
    
    // Guardar el documento
    doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error al exportar a PDF:', error);
    alert('Error al exportar a PDF. Por favor, intente nuevamente.');
  }
}; 