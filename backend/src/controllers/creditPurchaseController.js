import CreditPurchase from '../models/CreditPurchase.js';
import Supplier from '../models/Supplier.js';
import { Product } from '../models/Product.js';
import mongoose from 'mongoose';

/**
 * Controlador para gestionar compras a crédito
 */

/**
 * Obtiene todas las compras a crédito con filtros opcionales
 * @route GET /api/credit-purchases
 */
export const getCreditPurchases = async (req, res) => {
  try {
    // Opciones de filtrado
    const { 
      status, 
      supplier, 
      startDate, 
      endDate,
      page = 1,
      limit = 10,
      sort = '-createdAt'
    } = req.query;
    
    // Construir el objeto de filtros
    const filter = {};
    
    // Filtrar por estado si se proporciona
    if (status) {
      filter.status = status;
    }
    
    // Filtrar por proveedor si se proporciona
    if (supplier) {
      filter.supplier = supplier;
    }
    
    // Filtrar por rango de fechas si se proporcionan
    if (startDate || endDate) {
      filter.purchaseDate = {};
      if (startDate) filter.purchaseDate.$gte = new Date(startDate);
      if (endDate) filter.purchaseDate.$lte = new Date(endDate);
    }
    
    // Calcular el salto para la paginación
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener compras a crédito con paginación y ordenamiento
    const creditPurchases = await CreditPurchase.find(filter)
      .populate('supplier', 'name businessName taxId')
      .populate('items.product', 'name sku')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Contar el total de documentos para la paginación
    const total = await CreditPurchase.countDocuments(filter);
    
    res.json({
      data: creditPurchases,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener compras a crédito', 
      error: error.message 
    });
  }
};

/**
 * Obtiene una compra a crédito por su ID
 * @route GET /api/credit-purchases/:id
 */
export const getCreditPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de compra inválido' });
    }
    
    // Buscar la compra a crédito
    const creditPurchase = await CreditPurchase.findById(id)
      .populate('supplier', 'name businessName taxId email phone address')
      .populate('items.product', 'name sku description price');
    
    // Verificar si la compra existe
    if (!creditPurchase) {
      return res.status(404).json({ message: 'Compra a crédito no encontrada' });
    }
    
    res.json(creditPurchase);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la compra a crédito', 
      error: error.message 
    });
  }
};

/**
 * Crea una nueva compra a crédito
 * @route POST /api/credit-purchases
 */
export const createCreditPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const {
      supplier: supplierId,
      invoiceNumber,
      purchaseDate,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      attachments
    } = req.body;
    
    // Verificar si el proveedor existe
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Proveedor no encontrado' });
    }
    
    // Verificar que todos los productos existen
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ 
          message: `Producto con ID ${item.product} no encontrado` 
        });
      }
    }
    
    // Crear la nueva compra a crédito
    const newCreditPurchase = new CreditPurchase({
      supplier: supplierId,
      invoiceNumber,
      purchaseDate,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      balance: total, // Inicialmente el balance es igual al total
      notes,
      attachments
    });
    
    await newCreditPurchase.save({ session });
    
    // Actualizar inventario para cada producto
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { session }
      );
    }
    
    // Actualizar la deuda del proveedor
    supplier.debt = (supplier.debt || 0) + total;
    await supplier.save({ session });
    
    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();
    
    // Poblar los datos para la respuesta
    const populatedPurchase = await CreditPurchase.findById(newCreditPurchase._id)
      .populate('supplier', 'name businessName')
      .populate('items.product', 'name sku');
    
    res.status(201).json({
      message: 'Compra a crédito creada correctamente',
      creditPurchase: populatedPurchase
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({ 
      message: 'Error al crear la compra a crédito', 
      error: error.message 
    });
  }
};

/**
 * Actualiza una compra a crédito existente
 * @route PUT /api/credit-purchases/:id
 */
export const updateCreditPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const {
      supplier: supplierId,
      invoiceNumber,
      purchaseDate,
      dueDate,
      items,
      subtotal,
      tax,
      discount,
      total,
      notes,
      attachments
    } = req.body;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID de compra inválido' });
    }
    
    // Obtener la compra actual para calcular la diferencia en el total
    const currentPurchase = await CreditPurchase.findById(id);
    if (!currentPurchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Compra a crédito no encontrada' });
    }
    
    // Calcular la diferencia en el total para actualizar la deuda del proveedor
    const totalDifference = total - currentPurchase.total;
    
    // Actualizar la compra a crédito
    const updatedPurchase = await CreditPurchase.findByIdAndUpdate(
      id,
      {
        supplier: supplierId,
        invoiceNumber,
        purchaseDate,
        dueDate,
        items,
        subtotal,
        tax,
        discount,
        total,
        notes,
        attachments,
        // Actualizar el balance si el total cambió
        balance: currentPurchase.balance + totalDifference
      },
      { new: true, runValidators: true, session }
    );
    
    // Actualizar la deuda del proveedor si el total cambió
    if (totalDifference !== 0) {
      const supplier = await Supplier.findById(supplierId);
      supplier.debt = (supplier.debt || 0) + totalDifference;
      await supplier.save({ session });
    }
    
    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();
    
    // Poblar los datos para la respuesta
    const populatedPurchase = await CreditPurchase.findById(id)
      .populate('supplier', 'name businessName')
      .populate('items.product', 'name sku');
    
    res.json({
      message: 'Compra a crédito actualizada correctamente',
      creditPurchase: populatedPurchase
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({ 
      message: 'Error al actualizar la compra a crédito', 
      error: error.message 
    });
  }
};

/**
 * Elimina una compra a crédito
 * @route DELETE /api/credit-purchases/:id
 */
export const deleteCreditPurchase = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID de compra inválido' });
    }
    
    // Buscar la compra a crédito
    const creditPurchase = await CreditPurchase.findById(id);
    if (!creditPurchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Compra a crédito no encontrada' });
    }
    
    // Revertir el inventario para cada producto
    for (const item of creditPurchase.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: -item.quantity } },
        { session }
      );
    }
    
    // Actualizar la deuda del proveedor
    const supplier = await Supplier.findById(creditPurchase.supplier);
    if (supplier) {
      supplier.debt = Math.max(0, (supplier.debt || 0) - creditPurchase.balance);
      await supplier.save({ session });
    }
    
    // Eliminar la compra a crédito
    await CreditPurchase.findByIdAndDelete(id, { session });
    
    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();
    
    res.json({ 
      message: 'Compra a crédito eliminada correctamente',
      _id: id
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({ 
      message: 'Error al eliminar la compra a crédito', 
      error: error.message 
    });
  }
};

/**
 * Agrega un pago a una compra a crédito
 * @route POST /api/credit-purchases/:id/payments
 */
export const addPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { id } = req.params;
    const { amount, paymentDate, paymentMethod, notes, receiptNumber } = req.body;
    
    // Verificar si el ID es válido
    if (!mongoose.Types.ObjectId.isValid(id)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'ID de compra inválido' });
    }
    
    // Buscar la compra a crédito
    const creditPurchase = await CreditPurchase.findById(id);
    if (!creditPurchase) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Compra a crédito no encontrada' });
    }
    
    // Verificar que el pago no exceda el saldo pendiente
    if (amount > creditPurchase.balance) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ 
        message: 'El monto del pago no puede ser mayor al saldo pendiente',
        balance: creditPurchase.balance
      });
    }
    
    // Crear el nuevo pago
    const payment = {
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod,
      notes,
      receiptNumber
    };
    
    // Agregar el pago a la compra
    creditPurchase.payments.push(payment);
    
    // Recalcular el saldo y actualizar el estado
    creditPurchase.balance = creditPurchase.calculateBalance();
    
    if (creditPurchase.balance <= 0) {
      creditPurchase.status = 'pagada';
    } else {
      creditPurchase.status = 'parcial';
    }
    
    await creditPurchase.save({ session });
    
    // Actualizar la deuda del proveedor
    const supplier = await Supplier.findById(creditPurchase.supplier);
    if (supplier) {
      supplier.debt = Math.max(0, (supplier.debt || 0) - amount);
      await supplier.save({ session });
    }
    
    // Confirmar la transacción
    await session.commitTransaction();
    session.endSession();
    
    res.json({
      message: 'Pago registrado correctamente',
      creditPurchase: await CreditPurchase.findById(id)
        .populate('supplier', 'name businessName')
    });
  } catch (error) {
    // Revertir la transacción en caso de error
    await session.abortTransaction();
    session.endSession();
    
    res.status(500).json({ 
      message: 'Error al registrar el pago', 
      error: error.message 
    });
  }
};

/**
 * Obtiene estadísticas de compras a crédito
 * @route GET /api/credit-purchases/stats
 */
export const getCreditPurchaseStats = async (req, res) => {
  try {
    // Total de compras por estado
    const statusCounts = await CreditPurchase.aggregate([
      { $group: { 
        _id: '$status', 
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        pendingAmount: { $sum: '$balance' }
      }}
    ]);
    
    // Convertir array a objeto para facilitar su uso
    const statusStats = {};
    statusCounts.forEach(stat => {
      statusStats[stat._id] = {
        count: stat.count,
        totalAmount: stat.totalAmount,
        pendingAmount: stat.pendingAmount
      };
    });
    
    // Obtener el total de todas las compras
    const totals = await CreditPurchase.aggregate([
      { $group: { 
        _id: null, 
        count: { $sum: 1 },
        totalAmount: { $sum: '$total' },
        pendingAmount: { $sum: '$balance' }
      }}
    ]);
    
    // Pagos próximos a vencer (próximos 7 días)
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    const upcomingDue = await CreditPurchase.find({
      dueDate: { $gte: now, $lte: nextWeek },
      status: { $in: ['pendiente', 'parcial'] }
    })
    .populate('supplier', 'name businessName')
    .sort('dueDate');
    
    res.json({
      statusStats,
      totals: totals.length > 0 ? totals[0] : { count: 0, totalAmount: 0, pendingAmount: 0 },
      upcomingDue
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener estadísticas', 
      error: error.message 
    });
  }
}; 