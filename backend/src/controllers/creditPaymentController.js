import { Product } from '../models/Product.js';
import Cliente from '../models/Cliente.js';
import mongoose from 'mongoose';

/**
 * Obtener productos con pagos pendientes a proveedores
 */
export const getPendingPayments = async (req, res) => {
  try {
    // Filtros opcionales
    const { provider, daysUntil, isOverdue } = req.query;
    
    // Construir la consulta base
    const query = {
      'creditPurchase.isCredit': true,
      'creditPurchase.isPaid': false
    };
    
    // Filtrar por proveedor si se especifica
    if (provider) {
      query.provider = mongoose.Types.ObjectId.isValid(provider) 
        ? provider 
        : null;
    }
    
    // Filtrar por fecha de vencimiento
    if (isOverdue === 'true') {
      // Productos con pagos vencidos
      query['creditPurchase.dueDate'] = { $lt: new Date() };
    } else if (daysUntil) {
      // Productos que vencen dentro de X días
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + parseInt(daysUntil));
      
      query['creditPurchase.dueDate'] = { 
        $gte: new Date(),
        $lte: futureDate
      };
    }
    
    // Obtener productos pendientes de pago
    const pendingProducts = await Product.find(query)
      .populate('provider', 'name phone email')
      .populate('category', 'name')
      .populate('createdBy', 'name')
      .sort({ 'creditPurchase.dueDate': 1 });
    
    // Agrupar por proveedor
    const groupedByProvider = {};
    
    pendingProducts.forEach(product => {
      const providerId = product.provider ? product.provider._id.toString() : 'sin_proveedor';
      if (!groupedByProvider[providerId]) {
        groupedByProvider[providerId] = {
          provider: product.provider || { name: 'Sin proveedor asignado' },
          products: [],
          totalAmount: 0
        };
      }
      
      // Sumar al total del proveedor
      groupedByProvider[providerId].products.push(product);
      groupedByProvider[providerId].totalAmount += product.purchasePrice;
    });
    
    // Convertir a array para la respuesta
    const result = Object.values(groupedByProvider);
    
    // Calcular totales generales
    const totalPending = result.reduce((sum, group) => sum + group.totalAmount, 0);
    const totalProducts = pendingProducts.length;
    
    res.json({
      success: true,
      pendingPayments: result,
      summary: {
        totalProviders: result.length,
        totalProducts,
        totalAmount: totalPending
      }
    });
    
  } catch (error) {
    console.error('Error al obtener pagos pendientes:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener los pagos pendientes',
      error: error.message
    });
  }
};

/**
 * Marcar un producto como pagado
 */
export const markProductAsPaid = async (req, res) => {
  try {
    const { productId } = req.params;
    const { paymentDate, paymentDetails } = req.body;
    
    // Validar que el producto existe
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      });
    }
    
    // Verificar que el producto está a crédito y no pagado
    if (!product.creditPurchase || !product.creditPurchase.isCredit) {
      return res.status(400).json({
        status: 'error',
        message: 'Este producto no está configurado para compra a crédito'
      });
    }
    
    if (product.creditPurchase.isPaid) {
      return res.status(400).json({
        status: 'error',
        message: 'Este producto ya está marcado como pagado'
      });
    }
    
    // Actualizar producto
    product.creditPurchase.isPaid = true;
    product.creditPurchase.paymentDate = paymentDate || new Date();
    
    if (paymentDetails) {
      product.creditPurchase.paymentDetails = paymentDetails;
    }
    
    // Guardar cambios
    await product.save();
    
    // Actualizar el proveedor si existe
    if (product.provider) {
      // Registrar el pago en el historial del proveedor (si implementas esta funcionalidad)
      // Este es un lugar donde podrías expandir la funcionalidad
    }
    
    res.json({
      status: 'success',
      message: 'Producto marcado como pagado exitosamente',
      product
    });
    
  } catch (error) {
    console.error('Error al marcar producto como pagado:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al marcar el producto como pagado',
      error: error.message
    });
  }
};

/**
 * Marcar múltiples productos como pagados
 */
export const markMultipleAsPaid = async (req, res) => {
  try {
    const { productIds, paymentDate, paymentDetails } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Debe proporcionar un array de IDs de productos'
      });
    }
    
    // Actualizar múltiples productos
    const updateResult = await Product.updateMany(
      {
        _id: { $in: productIds },
        'creditPurchase.isCredit': true,
        'creditPurchase.isPaid': false
      },
      {
        $set: {
          'creditPurchase.isPaid': true,
          'creditPurchase.paymentDate': paymentDate || new Date(),
          'creditPurchase.paymentDetails': paymentDetails || ''
        }
      }
    );
    
    if (updateResult.nModified === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No se encontraron productos pendientes de pago con los IDs proporcionados'
      });
    }
    
    res.json({
      status: 'success',
      message: `${updateResult.nModified} productos marcados como pagados`,
      updatedCount: updateResult.nModified
    });
    
  } catch (error) {
    console.error('Error al marcar productos como pagados:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al marcar los productos como pagados',
      error: error.message
    });
  }
};

/**
 * Obtener estadísticas de pagos pendientes
 */
export const getCreditPaymentStats = async (req, res) => {
  try {
    // Total de productos a crédito
    const totalCredit = await Product.countDocuments({
      'creditPurchase.isCredit': true
    });
    
    // Productos pagados
    const totalPaid = await Product.countDocuments({
      'creditPurchase.isCredit': true,
      'creditPurchase.isPaid': true
    });
    
    // Productos pendientes de pago
    const totalPending = await Product.countDocuments({
      'creditPurchase.isCredit': true,
      'creditPurchase.isPaid': false
    });
    
    // Pagos vencidos
    const overdue = await Product.countDocuments({
      'creditPurchase.isCredit': true,
      'creditPurchase.isPaid': false,
      'creditPurchase.dueDate': { $lt: new Date() }
    });
    
    // Próximos a vencer (en los próximos 7 días)
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    
    const upcoming = await Product.countDocuments({
      'creditPurchase.isCredit': true,
      'creditPurchase.isPaid': false,
      'creditPurchase.dueDate': { 
        $gte: new Date(),
        $lte: nextWeekDate
      }
    });
    
    // Total monetario pendiente
    const financialStats = await Product.aggregate([
      {
        $match: {
          'creditPurchase.isCredit': true,
          'creditPurchase.isPaid': false
        }
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$purchasePrice" },
          avgAmount: { $avg: "$purchasePrice" },
          maxAmount: { $max: "$purchasePrice" }
        }
      }
    ]);
    
    const financialData = financialStats.length > 0 ? financialStats[0] : {
      totalAmount: 0,
      avgAmount: 0,
      maxAmount: 0
    };
    
    res.json({
      success: true,
      stats: {
        totalCredit,
        totalPaid,
        totalPending,
        overdue,
        upcoming,
        financial: {
          totalPendingAmount: financialData.totalAmount,
          averageProductPrice: financialData.avgAmount,
          highestProductPrice: financialData.maxAmount
        }
      }
    });
    
  } catch (error) {
    console.error('Error al obtener estadísticas de pagos:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener estadísticas de pagos a crédito',
      error: error.message
    });
  }
};