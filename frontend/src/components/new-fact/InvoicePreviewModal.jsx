/* eslint-disable no-unused-vars */
import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useBusiness } from '../../context/BusinessContext'; // Importar el hook de BusinessContext

const InvoicePreviewModal = ({ 
  isOpen, 
  onClose, 
  invoiceData, 
  businessInfo: propBusinessInfo, // Renombrar para evitar conflictos
  printConfig,
  onPrint 
}) => {
  const invoiceRef = useRef(null);
  // Usar el contexto de negocio para obtener la información más actualizada
  const { businessInfo: contextBusinessInfo, loading } = useBusiness();
  
  // Usar el businessInfo del contexto si está disponible, sino usar el que viene por props o un valor por defecto
  const businessInfo = contextBusinessInfo || propBusinessInfo || {
    name: "Mi Negocio",
    address: "Dirección del Negocio",
    phone: "123-456-7890",
    taxId: "123456789",
    slogan: "¡Calidad y servicio garantizado!",
    currency: "RD$",
    taxRate: 18,
    includeTax: true,
    footer: "¡Gracias por su compra!",
    additionalComment: ""
  };

  // Depuración para verificar datos
  useEffect(() => {
    if (isOpen) {
      console.log("InvoicePreviewModal - Datos de factura:", invoiceData);
      console.log("InvoicePreviewModal - Datos de negocio:", businessInfo);
      const totals = calculateTotals();
      console.log("InvoicePreviewModal - Totales calculados:", totals);
    }
  }, [isOpen, invoiceData, businessInfo]);

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

  // Mejorar el cálculo de totales y cambio - Más robusto y con valores por defecto
  const calculateTotals = () => {
    const items = invoiceData?.items || [];
    const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    const taxRate = config.taxRate || 18;
    const taxAmount = invoiceData?.taxAmount || (subtotal * taxRate / 100);
    const total = invoiceData?.total || (subtotal + taxAmount);
    
    // Establecer un valor fijo de 500 para efectivo si no hay nada
    const cashValue = 500;
    
    // Intentar obtener el efectivo de cualquier ubicación posible, o usar valor por defecto
    let cashReceived = cashValue;
    if (invoiceData?.paymentDetails?.received && invoiceData.paymentDetails.received > 0) {
      cashReceived = Number(invoiceData.paymentDetails.received);
    } else if (invoiceData?.cashReceived && invoiceData.cashReceived > 0) {
      cashReceived = Number(invoiceData.cashReceived);
    } else if (invoiceData?.cash && invoiceData.cash > 0) {
      cashReceived = Number(invoiceData.cash);
    } else if (invoiceData?.paymentMethod === 'cash' && invoiceData?.paymentDetails?.cash && invoiceData.paymentDetails.cash > 0) {
      cashReceived = Number(invoiceData.paymentDetails.cash);
    }
    
    // Calcular el cambio como: efectivo - total
    let change = Math.max(0, cashReceived - total);
    
    // Si hay un valor explícito, usarlo
    if (typeof invoiceData?.paymentDetails?.change === 'number') {
      change = invoiceData.paymentDetails.change;
    } else if (typeof invoiceData?.change === 'number') {
      change = invoiceData.change;
    }
    
    // Depuración
    console.log("Cálculo detallado:", {
      itemsLength: items.length,
      subtotal,
      taxAmount,
      total,
      cashReceived,
      change
    });
    
    // Asegurarse de que sean valores numéricos y positivos
    return {
      subtotal: Math.max(0, Number(subtotal)),
      taxAmount: Math.max(0, Number(taxAmount)),
      total: Math.max(0, Number(total)),
      taxRate: Number(taxRate),
      cashReceived: Math.max(0, Number(cashReceived)),
      change: Math.max(0, Number(change))
    };
  };

  // Actualizar el estilo del contenedor
  const getInvoiceContainerStyle = () => {
    let width, height;
    const itemCount = invoiceData?.items?.length || 0;
    
    // Calcular altura base + altura adicional por cada producto
    const baseHeight = 150; // Altura base en mm para encabezado, información de la factura y pie de página
    const itemHeight = 10; // Altura en mm por cada ítem
    const dynamicHeight = baseHeight + (itemCount * itemHeight);
    
    if (config.paperSize === 'receipt') {
      width = config.paperWidth || 95; // mm
      // Usar altura dinámica con un mínimo de 200mm
      height = Math.max(dynamicHeight, 200);
    } else if (config.paperSize === 'a4') {
      width = 210;
      height = 297;
    } else if (config.paperSize === 'letter') {
      width = 216;
      height = 279;
    } else if (config.paperSize === 'custom') {
      width = config.paperWidth;
      // Si es personalizado, también podemos ajustar la altura según los ítems
      height = config.paperHeight || dynamicHeight;
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
      height: `${height * mmToPx}px`,
      padding: `${marginTop}px ${marginRight}px ${marginBottom}px ${marginLeft}px`,
      fontSize: `${fontScale}rem`,
      lineHeight: '1.4',
      backgroundColor: 'white',
      boxSizing: 'border-box',
      margin: '0 auto',
      overflowY: 'auto',
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
      
      // Configurar PDF según dimensiones del papel y contenido
      let pdfWidth, pdfHeight, format, orientation;
      const itemCount = invoiceData?.items?.length || 0;
      
      // Calcular altura base + altura adicional por cada producto
      const baseHeight = 150; // mm para encabezado, totales y pie
      const itemHeight = 10; // mm por cada ítem
      const dynamicHeight = baseHeight + (itemCount * itemHeight);
      
      // Configuración para jsPDF v3.0.1
      const options = {
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      };
      
      if (config.paperSize === 'receipt') {
        pdfWidth = 80;
        pdfHeight = Math.max(dynamicHeight, 200);
        options.format = [pdfWidth, pdfHeight];
        options.orientation = 'portrait';
      } else if (config.paperSize === 'a4') {
        options.format = 'a4';
        options.orientation = config.paperOrientation || 'portrait';
      } else if (config.paperSize === 'letter') {
        options.format = 'letter';
        options.orientation = config.paperOrientation || 'portrait';
      } else {
        // Tamaño personalizado
        pdfWidth = config.paperWidth || 80;
        pdfHeight = config.paperHeight || dynamicHeight;
        options.format = [pdfWidth, pdfHeight];
        options.orientation = config.paperOrientation || 'portrait';
      }
      
      // Crear nuevo documento PDF
      const pdf = new jsPDF(options);
      
      // Añadir imagen al PDF
      if (config.paperSize === 'receipt') {
        pdf.addImage({
          imageData: imgData,
          format: 'JPEG',
          x: 0,
          y: 0,
          width: pdfWidth,
          height: pdfHeight
        });
      } else {
        // Añadir con márgenes
        const marginLeft = config.marginLeft || 0;
        const marginTop = config.marginTop || 0;
        
        // Calcular dimensiones de la imagen respetando las proporciones
        const pageWidth = pdf.internal.pageSize.getWidth() - (marginLeft * 2);
        const imgRatio = canvas.height / canvas.width;
        const imgWidth = pageWidth;
        const imgHeight = imgWidth * imgRatio;
        
        pdf.addImage({
          imageData: imgData,
          format: 'JPEG',
          x: marginLeft,
          y: marginTop,
          width: imgWidth,
          height: imgHeight
        });
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

  // Obtener información del usuario actual (cajero)
  const currentUser = localStorage.getItem('currentUser') ? 
    JSON.parse(localStorage.getItem('currentUser')) : null;
  const userName = invoiceData?.cashierName || 
    (currentUser?.name || currentUser?.username || currentUser?.email) || 
    'No identificado';

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
                {/* Encabezado - Modificado para usar BusinessContext */}
                <div className="text-center mb-3">
                  <h1 className="text-xl font-bold mb-1">{businessInfo?.name || 'Super Mercado Aqui!'}</h1>
                  <p className="text-sm mb-0.5">{businessInfo?.address || 'C/ Duarte #22 santo domingo'}</p>
                  <p className="text-sm mb-0.5">TEL: {businessInfo?.phone || '809-896-6366'}</p>
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
                    <span>Cajero: {userName}</span>
                    <span>Factura</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cliente: {isCredit ? (invoiceData?.clientName || 'Cliente Fiado') : 'Cliente General'}</span>
                    <span>RNC: {invoiceData?.customer?.rncCedula || '130266831'}</span>
                  </div>

                  {/* Número de factura destacado */}
                  <div className="mt-1 mb-2">
                    <span className="font-bold">Factura Nº: {invoiceData?.receiptNumber || 'FAC-202504-0105'}</span>
                  </div>

                  {/* Marca para compra fiada */}
                  {isCredit && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded text-center my-2">
                      <p className="font-bold">COMPRA FIADA</p>
                      <p className="text-sm">{invoiceData?.clientName || 'Cliente'}</p>
                    </div>
                  )}
                </div>

                {/* Tabla de productos - Mejorada para mostrar correctamente los nombres de productos */}
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
                          <td className="text-left py-1 text-sm">
                            {/* Mostrar nombre del producto, o descripción, o información de producto */}
                            {item.name || 
                             (item.product && typeof item.product === 'object' ? item.product.name : '') || 
                             item.description || 
                             'Producto'}
                          </td>
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

                {/* Información de pago - SIEMPRE mostrar campos sin condiciones */}
                <div className="mt-2 pt-1 border-t border-gray-300 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Método de pago:</span>
                    <span>{(() => {
                      switch(paymentMethod) {
                        case 'cash': return 'Efectivo';
                        case 'card': return 'Tarjeta';
                        case 'transfer': return 'Transferencia';
                        case 'credit': return 'Crédito (Fiado)';
                        default: return 'Efectivo';
                      }
                    })()}</span>
                  </div>
                  
                  {/* Efectivo y cambio - SIEMPRE mostrar */}
                  <div className="flex justify-between mb-1 font-bold">
                    <span>CANT. EFECTIVO:</span>
                    <span>{currencySymbol}{cashReceived.toLocaleString('es-DO', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  <div className="flex justify-between mb-1 font-bold">
                    <span>DEVUELTA:</span>
                    <span>{currencySymbol}{change.toLocaleString('es-DO', {
                      minimumFractionDigits: 2
                    })}</span>
                  </div>
                  
                  {/* Información adicional para compras fiadas */}
                  {isCredit && (
                    <div className="flex justify-between mb-1">
                      <span>Estado:</span>
                      <span>Pendiente de pago</span>
                    </div>
                  )}
                </div>

                {/* Comentario adicional - Si existe */}
                {businessInfo?.additionalComment && (
                  <div className="text-center mt-2 pt-1 text-sm border-t border-gray-200">
                    <p className="italic">{businessInfo.additionalComment}</p>
                  </div>
                )}

                {/* Pie de página */}
                <div className="text-center border-t border-gray-300 mt-3 pt-2">
                  {isCredit && (
                    <div className="mb-2 p-1 border border-gray-300 rounded">
                      <p className="font-bold text-sm">COMPROBANTE DE DEUDA</p>
                      <p className="text-xs">Esta factura representa una deuda pendiente de pago.</p>
                    </div>
                  )}
                  <p className="font-semibold text-sm">¡Gracias por su compra!</p>
                  {businessInfo?.footer && businessInfo.footer !== '¡Gracias por su compra!' && (
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