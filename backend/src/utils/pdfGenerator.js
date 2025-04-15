import PDFDocument from 'pdfkit';
import fs from 'fs';

export const generateInvoicePDF = async (sale) => {
    return new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument();
          const filename = `invoice-${sale._id}.pdf`;
          const stream = fs.createWriteStream(filename);
    
          doc.pipe(stream);
    
          // Encabezado
          doc.fontSize(20).text('Factura', { align: 'center' });
          doc.moveDown();
    
          // Información del cliente
          doc.fontSize(12).text(`Cliente: ${sale.client.name}`);
          doc.text(`Fecha: ${sale.date.toLocaleDateString()}`);
          doc.moveDown();
    
          // Tabla de productos
          doc.text('Productos:', { underline: true });
          sale.items.forEach(item => {
            doc.text(`${item.product.name} - Cantidad: ${item.quantity} - Precio: RD$ ${item.price}`);
          });
    
          doc.moveDown();
          doc.fontSize(14).text(`Total: RD$ ${sale.total}`, { align: 'right' });
    
          doc.end();
    
          stream.on('finish', () => {
            resolve(filename);
          });
        } catch (error) {
          reject(error);
        }
      });
    };

// Función genérica para generar PDFs
const generatePDF = async (documentType, data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];
      
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      
      switch (documentType) {
        case 'invoice':
          generateInvoiceContent(doc, data);
          break;
        case 'retention':
          generateRetentionContent(doc, data);
          break;
        default:
          doc.fontSize(20).text('Documento no soportado', { align: 'center' });
      }
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

const generateRetentionContent = (doc, data) => {
  // Encabezado
  doc.fontSize(20).text(data.documentTitle, { align: 'center' });
  doc.moveDown();
  
  // Información del negocio
  doc.fontSize(12).text(`Empresa: ${data.business.name}`);
  doc.text(`RUC: ${data.business.ruc}`);
  doc.text(`Dirección: ${data.business.address}`);
  doc.moveDown();
  
  // Información del documento
  doc.text(`Número: ${data.documentNumber}`);
  doc.text(`Estado: ${data.documentStatus.toUpperCase()}`);
  doc.moveDown();
  
  // Información del cliente
  doc.text(`Cliente: ${data.client.name}`);
  doc.text(`Identificación: ${data.client.identification}`);
  doc.text(`Factura relacionada: ${data.invoice.number}`);
  doc.text(`Fecha de factura: ${data.invoice.date}`);
  doc.moveDown();
  
  // Tabla de items
  doc.text('Detalle de retenciones:', { underline: true });
  doc.moveDown();
  
  let y = doc.y;
  doc.text('Descripción', 50, y);
  doc.text('Base', 300, y);
  doc.text('%', 370, y);
  doc.text('Valor', 470, y);
  doc.moveDown();
  
  data.retention.items.forEach(item => {
    y = doc.y;
    doc.text(item.description, 50, y);
    doc.text(`$${item.base}`, 300, y);
    doc.text(`${item.percentage}%`, 370, y);
    doc.text(`$${item.value}`, 470, y);
    doc.moveDown();
  });
  
  // Total
  doc.moveDown();
  doc.fontSize(14).text(`Total retenido: $${data.retention.total}`, { align: 'right' });
  
  // Observaciones
  if (data.retention.observations) {
    doc.moveDown();
    doc.fontSize(12).text('Observaciones:', { underline: true });
    doc.text(data.retention.observations);
  }
  
  // Datos de autorización
  doc.moveDown();
  doc.text(`Autorización: ${data.retention.authNumber}`);
  doc.text(`Fecha de autorización: ${data.retention.authDate}`);
};

const generateInvoiceContent = (doc, data) => {
  // Implementación básica para facturas
  doc.fontSize(20).text('FACTURA', { align: 'center' });
  doc.moveDown();
  
  doc.fontSize(12).text(`Número: ${data.number}`);
  doc.text(`Cliente: ${data.client.name}`);
  doc.text(`Fecha: ${data.date}`);
  
  // Resto de implementación...
};

export default generatePDF;