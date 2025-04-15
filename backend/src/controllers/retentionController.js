import asyncHandler from 'express-async-handler';
import { Retention } from '../models/retentionModel.js';
import { Invoice } from '../models/Invoice.js';
import Business from '../models/businessModel.js';
import generatePDF from '../utils/pdfGenerator.js';

// @desc    Obtener todas las retenciones con filtros
// @route   GET /api/retentions
// @access  Private
const getRetentions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Construir el objeto de filtros
  const filterObj = {};
  
  // Filtrar por fechas
  if (req.query.startDate) {
    filterObj.date = { $gte: new Date(req.query.startDate) };
  }
  if (req.query.endDate) {
    filterObj.date = { ...filterObj.date, $lte: new Date(req.query.endDate) };
  }
  
  // Filtrar por número de retención
  if (req.query.retentionNumber) {
    filterObj.retentionNumber = { $regex: req.query.retentionNumber, $options: 'i' };
  }
  
  // Filtrar por estado
  if (req.query.status) {
    filterObj.status = req.query.status;
  }
  
  // Filtrar por factura relacionada
  if (req.query.invoiceId) {
    filterObj.invoice = req.query.invoiceId;
  }
  
  // Filtrar por tipo de retención
  if (req.query.type) {
    filterObj.retentionType = req.query.type;
  }
  
  // Filtrar por rango de valores
  if (req.query.minTotal) {
    filterObj.totalRetained = { $gte: parseFloat(req.query.minTotal) };
  }
  if (req.query.maxTotal) {
    filterObj.totalRetained = { ...filterObj.totalRetained, $lte: parseFloat(req.query.maxTotal) };
  }

  // Ejecutar la consulta con paginación
  const totalItems = await Retention.countDocuments(filterObj);
  const retentions = await Retention.find(filterObj)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'invoice',
      select: 'invoiceNumber date customer total',
      populate: {
        path: 'customer',
        select: 'name identification'
      }
    });

  res.json({
    data: retentions,
    page,
    pages: Math.ceil(totalItems / limit),
    totalItems
  });
});

// @desc    Obtener una retención por ID
// @route   GET /api/retentions/:id
// @access  Private
const getRetentionById = asyncHandler(async (req, res) => {
  const retention = await Retention.findById(req.params.id)
    .populate({
      path: 'invoice',
      select: 'invoiceNumber date customer total items',
      populate: {
        path: 'customer',
        select: 'name identification address email phone'
      }
    });

  if (retention) {
    res.json(retention);
  } else {
    res.status(404);
    throw new Error('Retención no encontrada');
  }
});

// @desc    Crear una nueva retención
// @route   POST /api/retentions
// @access  Private
const createRetention = asyncHandler(async (req, res) => {
  const {
    invoice: invoiceId,
    date,
    items,
    retentionType,
    observations
  } = req.body;

  // Verificar que la factura existe
  const invoice = await Invoice.findById(invoiceId)
    .populate('customer', 'name identification address email phone');
  
  if (!invoice) {
    res.status(404);
    throw new Error('Factura no encontrada');
  }

  // Verificar que la factura no esté cancelada
  if (invoice.status === 'cancelled') {
    res.status(400);
    throw new Error('No se puede crear retención para una factura cancelada');
  }

  // Calcular el total retenido
  const totalRetained = items.reduce((sum, item) => {
    return sum + (item.base * (item.percentage / 100));
  }, 0);

  // Generar número secuencial de retención
  const business = await Business.findOne({});
  if (!business) {
    res.status(404);
    throw new Error('Información de la empresa no encontrada');
  }

  // Incrementar el contador de retenciones
  business.retentionCounter = (business.retentionCounter || 0) + 1;
  await business.save();

  // Formatear el número de retención
  const retentionNumber = `${business.retentionPrefix || 'RET'}-${business.retentionCounter.toString().padStart(9, '0')}`;

  // Crear la retención
  const retention = new Retention({
    invoice: invoiceId,
    date: date || new Date(),
    retentionNumber,
    items,
    retentionType,
    totalRetained,
    status: 'draft',
    observations,
    createdBy: req.user._id
  });

  const createdRetention = await retention.save();

  // Actualizar la factura para agregar referencia a la retención
  invoice.retentions = [...(invoice.retentions || []), createdRetention._id];
  await invoice.save();

  res.status(201).json(createdRetention);
});

// @desc    Actualizar una retención
// @route   PUT /api/retentions/:id
// @access  Private
const updateRetention = asyncHandler(async (req, res) => {
  const { 
    date, 
    items, 
    observations,
    retentionType
  } = req.body;

  const retention = await Retention.findById(req.params.id);

  if (!retention) {
    res.status(404);
    throw new Error('Retención no encontrada');
  }

  // Solo se pueden actualizar retenciones en estado borrador
  if (retention.status !== 'draft') {
    res.status(400);
    throw new Error('Solo se pueden actualizar retenciones en estado borrador');
  }

  // Recalcular el total retenido si hay cambios en los items
  let totalRetained = retention.totalRetained;
  if (items) {
    totalRetained = items.reduce((sum, item) => {
      return sum + (item.base * (item.percentage / 100));
    }, 0);
  }

  // Actualizar la retención
  retention.date = date || retention.date;
  retention.items = items || retention.items;
  retention.totalRetained = totalRetained;
  retention.observations = observations || retention.observations;
  retention.retentionType = retentionType || retention.retentionType;
  retention.updatedAt = new Date();

  const updatedRetention = await retention.save();
  res.json(updatedRetention);
});

// @desc    Eliminar una retención
// @route   DELETE /api/retentions/:id
// @access  Private
const deleteRetention = asyncHandler(async (req, res) => {
  const retention = await Retention.findById(req.params.id);

  if (!retention) {
    res.status(404);
    throw new Error('Retención no encontrada');
  }

  // Solo se pueden eliminar retenciones en estado borrador
  if (retention.status !== 'draft') {
    res.status(400);
    throw new Error('Solo se pueden eliminar retenciones en estado borrador');
  }

  // Eliminar referencia de la retención en la factura
  await Invoice.findByIdAndUpdate(retention.invoice, {
    $pull: { retentions: retention._id }
  });

  await Retention.deleteOne({ _id: retention._id });
  res.json({ message: 'Retención eliminada' });
});

// @desc    Procesar una retención
// @route   POST /api/retentions/:id/process
// @access  Private
const processRetention = asyncHandler(async (req, res) => {
  const retention = await Retention.findById(req.params.id);

  if (!retention) {
    res.status(404);
    throw new Error('Retención no encontrada');
  }

  // Solo se pueden procesar retenciones en estado borrador
  if (retention.status !== 'draft') {
    res.status(400);
    throw new Error('Esta retención ya ha sido procesada o cancelada');
  }

  // Simular envío al servicio de autorización fiscal
  // En un sistema real, aquí iría la integración con el SRI (Ecuador) u otra autoridad fiscal

  // Actualizar estado de la retención
  retention.status = 'processed';
  retention.processedAt = new Date();
  retention.authorizationNumber = `AUTH-${Math.floor(Math.random() * 1000000000)}`;
  retention.authorizationDate = new Date();

  const processedRetention = await retention.save();
  res.json(processedRetention);
});

// @desc    Cancelar una retención
// @route   POST /api/retentions/:id/cancel
// @access  Private
const cancelRetention = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  if (!reason) {
    res.status(400);
    throw new Error('Se requiere un motivo para cancelar la retención');
  }

  const retention = await Retention.findById(req.params.id);

  if (!retention) {
    res.status(404);
    throw new Error('Retención no encontrada');
  }

  // Solo se pueden cancelar retenciones procesadas
  if (retention.status !== 'processed') {
    res.status(400);
    throw new Error('Solo se pueden cancelar retenciones procesadas');
  }

  // Simular cancelación en el servicio fiscal
  // En un sistema real, aquí iría la integración con el SRI (Ecuador) u otra autoridad fiscal

  // Actualizar estado de la retención
  retention.status = 'cancelled';
  retention.cancellationReason = reason;
  retention.cancelledAt = new Date();

  const cancelledRetention = await retention.save();
  res.json(cancelledRetention);
});

// @desc    Obtener retenciones por factura
// @route   GET /api/retentions/invoice/:invoiceId
// @access  Private
const getRetentionsByInvoice = asyncHandler(async (req, res) => {
  const retentions = await Retention.find({ invoice: req.params.invoiceId })
    .sort({ date: -1 });

  res.json(retentions);
});

// @desc    Generar PDF de retención
// @route   GET /api/retentions/:id/pdf
// @access  Private
const generateRetentionPdf = asyncHandler(async (req, res) => {
  const retention = await Retention.findById(req.params.id)
    .populate({
      path: 'invoice',
      select: 'invoiceNumber date customer total',
      populate: {
        path: 'customer',
        select: 'name identification address email phone'
      }
    })
    .populate('createdBy', 'name');

  if (!retention) {
    res.status(404);
    throw new Error('Retención no encontrada');
  }

  const business = await Business.findOne({});
  if (!business) {
    res.status(404);
    throw new Error('Información de la empresa no encontrada');
  }

  // Generar datos para el PDF
  const pdfData = {
    documentTitle: 'COMPROBANTE DE RETENCIÓN',
    documentNumber: retention.retentionNumber,
    documentType: 'Retención',
    documentStatus: retention.status,
    business: {
      name: business.name,
      ruc: business.ruc,
      address: business.address,
      phone: business.phone,
      email: business.email,
      logo: business.logo
    },
    client: retention.invoice.customer,
    invoice: {
      number: retention.invoice.invoiceNumber,
      date: new Date(retention.invoice.date).toLocaleDateString()
    },
    retention: {
      date: new Date(retention.date).toLocaleDateString(),
      items: retention.items.map(item => ({
        description: item.description,
        base: item.base.toFixed(2),
        percentage: item.percentage.toFixed(2),
        value: ((item.base * item.percentage) / 100).toFixed(2)
      })),
      total: retention.totalRetained.toFixed(2),
      observations: retention.observations || '',
      authNumber: retention.authorizationNumber || 'PENDIENTE',
      authDate: retention.authorizationDate 
        ? new Date(retention.authorizationDate).toLocaleDateString() 
        : 'PENDIENTE'
    }
  };

  try {
    // Generar el PDF
    const pdfBuffer = await generatePDF('retention', pdfData);
    
    // Configurar headers para la descarga
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=retencion-${retention.retentionNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    
    // Enviar el PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    res.status(500);
    throw new Error('Error al generar el PDF de la retención');
  }
});

export {
  getRetentions,
  getRetentionById,
  createRetention,
  updateRetention,
  deleteRetention,
  processRetention,
  cancelRetention,
  getRetentionsByInvoice,
  generateRetentionPdf
}; 