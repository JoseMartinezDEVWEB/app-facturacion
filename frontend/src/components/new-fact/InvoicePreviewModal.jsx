/* eslint-disable no-unused-vars */
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoicePreviewModal = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  businessInfo,
  printConfig,
  onPrint 
}) => {
  const invoiceRef = useRef(null);

  // Modificar la configuración predeterminada para un tamaño más grande
  const loadPrintConfig = () => {
    if (printConfig) return printConfig;
    
    try {
      const savedConfig = localStorage.getItem('print_configuration_settings');
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error('Error al cargar configuración de impresión:', error);
    }
    
    // Configuración predeterminada actualizada
    return {
      paperSize: 'receipt',
      paperWidth: 95, // Aumentado de 80 a 95mm
      paperHeight: 297, // Altura estándar A4
      paperOrientation: 'portrait',
      marginTop: 8,
      marginRight: 8,
      marginBottom: 8,
      marginLeft: 8,
      fontScale: 1.1 // Aumentado ligeramente
    };
  };

  const config = loadPrintConfig();

  // Función para formatear fechas
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric'
    };
    return new Date(dateString || Date.now()).toLocaleDateString('es-ES', options);
  };

  // Función para formatear hora
  const formatTime = (dateString) => {
    const options = { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true
    };
    return new Date(dateString || Date.now()).toLocaleTimeString('es-ES', options);
  };

  // Mejorar el cálculo de totales y cambio
  const calculateTotals = () => {
    const items = invoiceData?.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxRate = config.taxRate || 18;
    const taxAmount = invoiceData?.taxAmount || (subtotal * taxRate / 100);
    const total = invoiceData?.total || (subtotal + taxAmount);
    
    // Calcular el cambio basado en el efectivo recibido
    const cashReceived = Number(invoiceData?.paymentDetails?.received || invoiceData?.cashReceived || 0);
    const change = cashReceived > total ? cashReceived - total : 0;
    
    return {
      subtotal,
      taxAmount,
      total,
      taxRate,
      cashReceived,
      change
    };
  };

  // Actualizar el estilo del contenedor
  const getInvoiceContainerStyle = () => {
    let width, height;
    
    if (config.paperSize === 'receipt') {
      width = config.paperWidth || 95; // mm
      height = 'auto';
    } else if (config.paperSize === 'a4') {
      width = 210;
      height = 297;
    } else if (config.paperSize === 'letter') {
      width = 216;
      height = 279;
    } else if (config.paperSize === 'custom') {
      width = config.paperWidth;
      height = config.paperHeight;
    }
    
    if (config.paperOrientation === 'landscape' && height !== 'auto') {
      [width, height] = [height, width];
    }
    
    const mmToPx = 3.7795275591;
    const widthPx = width * mmToPx;
    
    const marginTop = (config.marginTop || 8) * mmToPx;
    const marginRight = (config.marginRight || 8) * mmToPx;
    const marginBottom = (config.marginBottom || 8) * mmToPx;
    const marginLeft = (config.marginLeft || 8) * mmToPx;
    
    const fontScale = config.fontScale || 1.1;
    
    return {
      width: `${widthPx}px`,
      maxWidth: '100%',
      height: height === 'auto' ? 'auto' : `${height * mmToPx}px`,
      padding: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
      fontSize: `${fontScale}rem`,
      lineHeight: '1.4',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      margin: '0 auto',
      overflowY: height !== 'auto' ? 'auto' : 'visible',
      maxHeight: '80vh',
      border: '1px solid #ddd',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    };
  };

  // Descargar como PDF
  const downloadAsPDF = async () => {
    if (!invoiceRef.current) return;
    
    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Configurar PDF según dimensiones del papel
      let pdfWidth, pdfHeight, format, orientation;
      
      if (config.paperSize === 'receipt') {
        pdfWidth = 80;
        // Calcular la altura basada en el contenido
        const contentRatio = canvas.height / canvas.width;
        pdfHeight = pdfWidth * contentRatio;
        format = [pdfWidth, pdfHeight]; // tamaño personalizado
        orientation = 'portrait';
      } else if (config.paperSize === 'a4') {
        format = 'a4';
        orientation = config.paperOrientation;
      } else if (config.paperSize === 'letter') {
        format = 'letter';
        orientation = config.paperOrientation;
      } else {
        // Tamaño personalizado
        pdfWidth = config.paperOrientation === 'portrait' ? config.paperWidth : config.paperHeight;
        pdfHeight = config.paperOrientation === 'portrait' ? config.paperHeight : config.paperWidth;
        format = [pdfWidth, pdfHeight];
        orientation = config.paperOrientation;
      }
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });
      
      // Añadir imagen al PDF
      if (config.paperSize === 'receipt') {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      } else {
        // Añadir con márgenes
        const marginLeft = config.marginLeft || 0;
        const marginTop = config.marginTop || 0;
        
        // Calcular dimensiones de la imagen respetando las proporciones
        const availableWidth = (config.paperOrientation === 'portrait' ? 
          (format === 'a4' ? 210 : 216) : 
          (format === 'a4' ? 297 : 279)) - (marginLeft * 2);
          
        const imgWidth = availableWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        pdf.addImage(imgData, 'JPEG', marginLeft, marginTop, imgWidth, imgHeight);
      }
      
      pdf.save(`Factura_${invoiceData?.receiptNumber || 'sin_numero'}.pdf`);
    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('No se pudo generar el PDF. Por favor, intente nuevamente.');
    }
  };

  if (!isOpen) return null;
  
  const { subtotal, taxAmount, total, taxRate, cashReceived, change } = calculateTotals();
  const currencySymbol = businessInfo?.currency || 'RD$';
  const paymentMethod = invoiceData?.paymentMethod || 'cash';
  const isCredit = invoiceData?.isCredit || paymentMethod === 'credit';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-lg shadow-xl p-6 max-w-5xl w-full mx-4 my-8"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">Vista Previa de Factura</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          </div>

          <div className="border rounded-lg shadow-sm overflow-auto max-h-[80vh] bg-gray-100 p-4">
            <div className="flex justify-center">
              <div ref={invoiceRef} style={getInvoiceContainerStyle()} className="bg-white shadow-sm">
                {/* Encabezado - Modificado para ser más similar a la imagen */}
                <div className="text-center mb-3">
                  <h1 className="text-xl font-bold mb-1">{businessInfo?.name || 'FACTURA'}</h1>
                  <p className="text-sm mb-0.5">{businessInfo?.address || 'AV. Hermanas Mirabal 573 Villa Mella'}</p>
                  <p className="text-sm mb-0.5">TEL: {businessInfo?.phone || '829-263-9080'}</p>
                  <p className="text-sm">RNC: {businessInfo?.taxId || '132-85683-1'}</p>
                  <hr className="my-2 border-t border-gray-300" />
                </div>

                {/* Información de la factura - Reformateado para parecerse a la imagen */}
                <div className="text-sm mb-2">
                  <div className="flex justify-between">
                    <span>Fecha: {formatDate(invoiceData?.dateTime)}</span>
                    <span>Hora: {formatTime(invoiceData?.dateTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cajero: {invoiceData?.cashierName || 'No identificado'}</span>
                    <span>Factura</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cliente: {isCredit ? (invoiceData?.clientName || 'Cliente Fiado') : 'Cliente General'}</span>
                    <span>RNC: {invoiceData?.customer?.rncCedula || '130266831'}</span>
                  </div>

                  {/* Número de factura destacado */}
                  <div className="mt-1 mb-2">
                    <span className="font-bold">Factura Nº: {invoiceData?.receiptNumber || 'N/A'}</span>
                  </div>

                  {/* Marca para compra fiada */}
                  {isCredit && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-center my-2">
                      <p className="font-bold">COMPRA FIADA</p>
                      <p className="text-sm">{invoiceData?.clientName || 'Cliente'}</p>
                    </div>
                  )}
                </div>

                {/* Tabla de productos - Reformateada como en la imagen */}
                <div className="mb-3">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-t border-b border-gray-300">
                        <th className="text-left py-1 text-sm font-semibold">Descripción</th>
                        <th className="text-center py-1 text-sm font-semibold">Cant.</th>
                        <th className="text-right py-1 text-sm font-semibold">Precio</th>
                        <th className="text-right py-1 text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(invoiceData?.items || []).map((item, index) => (
                        <tr key={index} className="border-b border-gray-200">
                          <td className="text-left py-1 text-sm">{item.name || item.description}</td>
                          <td className="text-center py-1 text-sm">
                            {typeof item.quantity === 'number' ? 
                              Number(item.quantity).toLocaleString('es-DO', {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 3
                              }) : 
                              item.quantity
                            }
                          </td>
                          <td className="text-right py-1 text-sm">
                            {currencySymbol}{Number(item.price).toLocaleString('es-DO', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                          <td className="text-right py-1 text-sm">
                            {currencySymbol}{Number(item.subtotal).toLocaleString('es-DO', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sección de totales - Reorganizado como en la imagen */}
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Sub-total:</span>
                    <span>{currencySymbol}{subtotal.toLocaleString('es-DO', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  
                  {taxAmount > 0 && (
                    <div className="flex justify-between mb-1">
                      <span>ITBIS ({taxRate}%):</span>
                      <span>{currencySymbol}{taxAmount.toLocaleString('es-DO', {
                        minimumFractionDigits: 2
                      })}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-bold text-base mb-1 mt-1 pt-1 border-t border-gray-300">
                    <span>TOTAL:</span>
                    <span>{currencySymbol}{total.toLocaleString('es-DO', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                </div>

                {/* Información de pago */}
                <div className="mt-2 pt-1 border-t border-gray-300 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Método de pago:</span>
                    <span>{(() => {
                      switch(paymentMethod) {
                        case 'cash': return 'Efectivo';
                        case 'card': return 'Tarjeta';
                        case 'transfer': return 'Transferencia';
                        case 'credit': return 'Crédito (Fiado)';
                        default: return 'Otro';
                      }
                    })()}</span>
                  </div>
                  
                  {/* Efectivo y cambio - Si es pago en efectivo */}
                  {paymentMethod === 'cash' && !isCredit && (
                    <>
                      <div className="flex justify-between mb-1">
                        <span>CANT. EFECTIVO:</span>
                        <span>{currencySymbol}{cashReceived.toLocaleString('es-DO', {
                          minimumFractionDigits: 2
                        })}</span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span>DEVUELTA:</span>
                        <span>{currencySymbol}{change.toLocaleString('es-DO', {
                          minimumFractionDigits: 2
                        })}</span>
                      </div>
                    </>
                  )}
                  
                  {/* Información adicional para compras fiadas */}
                  {isCredit && (
                    <div className="flex justify-between mb-1">
                      <span>Estado:</span>
                      <span>Pendiente de pago</span>
                    </div>
                  )}
                </div>

                {/* Pie de página */}
                <div className="text-center border-t border-gray-300 mt-3 pt-2">
                  {isCredit && (
                    <div className="mb-2 p-1 border border-gray-300 rounded">
                      <p className="font-bold text-sm">COMPROBANTE DE DEUDA</p>
                      <p className="text-xs">Esta factura representa una deuda pendiente de pago.</p>
                    </div>
                  )}
                  <p className="font-semibold text-sm">¡Gracias por su compra!</p>
                  {businessInfo?.footer && (
                    <p className="text-gray-600 text-xs mt-1">{businessInfo.footer}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 mt-4">
            <button
              onClick={onPrint}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Printer size={20} className="mr-2" />
              Imprimir
            </button>
            <button
              onClick={downloadAsPDF}
              className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Download size={20} className="mr-2" />
              Descargar PDF
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

InvoicePreviewModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  invoiceData: PropTypes.object,
  businessInfo: PropTypes.object,
  printConfig: PropTypes.object,
  onPrint: PropTypes.func.isRequired
};

export default InvoicePreviewModal;