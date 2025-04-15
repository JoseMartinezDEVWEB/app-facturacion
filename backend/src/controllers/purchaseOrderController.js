// controllers/purchaseOrderController.js
import PurchaseOrder from '../models/PurchaseOrder.js';
import Cliente from '../models/Cliente.js';
import { Product } from '../models/Product.js';

// @desc    Crear nueva orden de compra
// @route   POST /api/purchase-orders
// @access  Private
export const createPurchaseOrder = async (req, res) => {
  try {

    const {
      provider,
      estimatedDeliveryDate,
      items,
      discount,
      notes
    } = req.body;

    // Verificar que el proveedor existe y es de tipo proveedor
    const providerDoc = await Cliente.findById(provider);
    
    if (!providerDoc) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    if (providerDoc.role !== 'proveedor') {
      return res.status(400).json({
        status: 'error',
        message: 'El ID proporcionado no corresponde a un proveedor'
      });
    }

    // Validar items y calcular totales
    if (!items || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'La orden debe tener al menos un producto'
      });
    }
    
    // Procesar y validar cada item
    const processedItems = [];
    let subtotal = 0;
    let taxAmount = 0;
    
    for (const item of items) {
      // Si el producto ya existe, obtenerlo
      let product;
      
      if (item.productId) {
        product = await Product.findById(item.productId);
        if (!product) {
          return res.status(404).json({
            status: 'error',
            message: `Producto con ID ${item.productId} no encontrado`
          });
        }
      } else {
        // Crear nuevo producto si no existe (necesitamos la categoría)
        if (!item.category) {
          return res.status(400).json({
            status: 'error',
            message: 'Se requiere una categoría para crear un nuevo producto'
          });
        }

        product = new Product({
          name: item.name,
          purchasePrice: item.unitPrice,
          salePrice: item.unitPrice * 1.30, // Markup del 30% por defecto
          quantity: 0, // Se actualizará cuando se reciba
          minStock: 5, // Valor por defecto
          unitType: item.unitType || 'unidad',
          category: item.category,
          createdBy: req.user._id
        });
        
        // Si es un producto por peso, agregar los campos específicos
        if (item.unitType === 'peso') {
          product.weightUnit = item.weightUnit || 'kg';
          product.minWeight = item.minWeight || 0.01;
        }
        
        await product.save();
        
        // Actualizar el proveedor con este producto
        await Cliente.findByIdAndUpdate(provider, {
          $addToSet: { products: product._id }
        });
      }
      
      // Validar cantidad
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: `La cantidad para ${item.name || product.name} debe ser mayor a 0`
        });
      }
      
      // Calcular subtotal del item
      const itemSubtotal = item.quantity * item.unitPrice;
      const itemTax = itemSubtotal * 0.18; // ITBIS 18%
      
      processedItems.push({
        product: product._id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: itemSubtotal,
        notes: item.notes
      });
      
      subtotal += itemSubtotal;
      taxAmount += itemTax;
    }
    
    // Calcular total
    const discountAmount = discount || 0;
    const total = subtotal + taxAmount - discountAmount;
    
    // Generar número de orden
    const orderNumber = await PurchaseOrder.generateOrderNumber();
    
    // Crear la orden de compra
    const purchaseOrder = await PurchaseOrder.create({
      orderNumber,
      provider,
      estimatedDeliveryDate,
      items: processedItems,
      subtotal,
      taxAmount,
      discount: discountAmount,
      total,
      balanceDue: total,
      notes,
      createdBy: req.user._id
    });

    if (purchaseOrder) {
      // Actualizar las cuentas pendientes del proveedor
      await Cliente.findByIdAndUpdate(provider, {
        $inc: { cuentasPendientes: total }
      });
      
      const populatedOrder = await PurchaseOrder.findById(purchaseOrder._id)
        .populate('provider', 'name phone')
        .populate('items.product', 'name');
        
      return res.status(201).json({
        status: 'success',
        message: 'Orden de compra creada exitosamente',
        data: populatedOrder
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Error al crear la orden de compra'
      });
    }
  } catch (error) {
    console.error('Error al crear orden de compra:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener todas las órdenes de compra
// @route   GET /api/purchase-orders
// @access  Private
export const getPurchaseOrders = async (req, res) => {
  try {
    const purchaseOrders = await PurchaseOrder.find()
      .populate('provider', 'name phone')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
      
    return res.json({
      status: 'success',
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Error al obtener órdenes de compra:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener una orden de compra por ID
// @route   GET /api/purchase-orders/:id
// @access  Private
export const getPurchaseOrderById = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate('provider', 'name phone email address rncCedula')
      .populate('items.product', 'name unitType weightUnit');
      
    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Orden de compra no encontrada'
      });
    }
    
    return res.json({
      status: 'success',
      data: purchaseOrder
    });
  } catch (error) {
    console.error('Error al obtener orden de compra:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar estado de una orden de compra
// @route   PUT /api/purchase-orders/:id/status
// @access  Private
export const updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { orderStatus } = req.body;
    
    if (!orderStatus) {
      return res.status(400).json({
        status: 'error',
        message: 'El estado de la orden es requerido'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Orden de compra no encontrada'
      });
    }
    
    // Actualizar estado de la orden
    purchaseOrder.orderStatus = orderStatus;
    
    // Si el estado es "received" (recibida), actualizar inventario
    if (orderStatus === 'received' && purchaseOrder.orderStatus !== 'received') {
      purchaseOrder.actualDeliveryDate = new Date();
      
      // Actualizar stock de productos
      for (const item of purchaseOrder.items) {
        const product = await Product.findById(item.product);
        
        if (product) {
          // Actualizar cantidad
          product.quantity += item.quantity;
          
          // Actualizar precio de compra
          product.purchasePrice = item.unitPrice;
          
          // Guardar cambios
          await product.save();
        }
      }
    }
    
    const updatedOrder = await purchaseOrder.save();
    
    return res.json({
      status: 'success',
      message: 'Estado de orden actualizado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar estado de orden:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Registrar pago para una orden de compra
// @route   POST /api/purchase-orders/:id/payments
// @access  Private
export const addPaymentToPurchaseOrder = async (req, res) => {
  try {
    const { amount, method, reference, notes } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'El monto de pago debe ser mayor a 0'
      });
    }
    
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Orden de compra no encontrada'
      });
    }
    
    // Verificar que el monto no excede el saldo pendiente
    if (amount > purchaseOrder.balanceDue) {
      return res.status(400).json({
        status: 'error',
        message: 'El monto de pago no puede ser mayor al saldo pendiente'
      });
    }
    
    // Agregar el pago
    const payment = {
      date: new Date(),
      amount,
      method,
      reference,
      notes
    };
    
    purchaseOrder.payments.push(payment);
    
    // El hook pre-save actualizará amountPaid, balanceDue y paymentStatus
    const updatedOrder = await purchaseOrder.save();
    
    // Actualizar las cuentas pendientes del proveedor
    await Cliente.findByIdAndUpdate(purchaseOrder.provider, {
      $inc: { cuentasPendientes: -amount }
    });
    
    return res.json({
      status: 'success',
      message: 'Pago registrado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener órdenes de compra por proveedor
// @route   GET /api/purchase-orders/provider/:id
// @access  Private
export const getPurchaseOrdersByProvider = async (req, res) => {
  try {
    const providerId = req.params.id;
    
    // Verificar que el proveedor existe
    const provider = await Cliente.findById(providerId);
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    // Verificar que es un proveedor
    if (provider.role !== 'proveedor') {
      return res.status(400).json({
        status: 'error',
        message: 'El ID proporcionado no corresponde a un proveedor'
      });
    }
    
    // Obtener órdenes de compra
    const purchaseOrders = await PurchaseOrder.find({
      provider: providerId
    })
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });
      
    return res.json({
      status: 'success',
      count: purchaseOrders.length,
      data: purchaseOrders
    });
  } catch (error) {
    console.error('Error al obtener órdenes por proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener órdenes de compra pendientes de pago
// @route   GET /api/purchase-orders/pending
// @access  Private
export const getPendingPurchaseOrders = async (req, res) => {
  try {
    const pendingOrders = await PurchaseOrder.find({
      paymentStatus: { $ne: 'paid' }
    })
      .populate('provider', 'name phone')
      .sort({ createdAt: -1 });
      
    return res.json({
      status: 'success',
      count: pendingOrders.length,
      data: pendingOrders
    });
  } catch (error) {
    console.error('Error al obtener órdenes pendientes:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar una orden de compra (solo en estado borrador)
// @route   DELETE /api/purchase-orders/:id
// @access  Private
export const deletePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        status: 'error',
        message: 'Orden de compra no encontrada'
      });
    }
    
    // Solo permitir eliminar órdenes en estado borrador
    if (purchaseOrder.orderStatus !== 'draft') {
      return res.status(400).json({
        status: 'error',
        message: 'Solo se pueden eliminar órdenes en estado borrador'
      });
    }
    
    await purchaseOrder.deleteOne();
    
    return res.json({
      status: 'success',
      message: 'Orden de compra eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar orden de compra:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};