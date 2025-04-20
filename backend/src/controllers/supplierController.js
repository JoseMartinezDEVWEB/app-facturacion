import Supplier from '../models/Supplier.js';
import CreditPurchase from '../models/CreditPurchase.js';
import SupplierTransaction from '../models/SupplierTransaction.js';

/**
 * Controlador para gestionar proveedores
 */

// Obtener todos los proveedores
export const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({})
      .sort({ name: 1 }); // Ordenados por nombre
    
    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

// Obtener un proveedor por ID
export const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      data: supplier
    });
  } catch (error) {
    console.error('Error al obtener el proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el proveedor',
      error: error.message
    });
  }
};

// Crear un nuevo proveedor
export const createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado con éxito',
      data: supplier
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(400).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

// Actualizar un proveedor
export const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado con éxito',
      data: supplier
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(400).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

// Eliminar un proveedor
export const deleteSupplier = async (req, res) => {
  try {
    // Verificar si el proveedor tiene compras a crédito asociadas
    const hasAssociatedPurchases = await CreditPurchase.exists({ supplier: req.params.id });
    
    if (hasAssociatedPurchases) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque tiene compras a crédito asociadas'
      });
    }
    
    // Verificar si el proveedor tiene deuda pendiente
    const supplier = await Supplier.findById(req.params.id);
    
    if (supplier.currentDebt > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque tiene deuda pendiente'
      });
    }
    
    const deletedSupplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!deletedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado con éxito'
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar proveedor',
      error: error.message
    });
  }
};

// Búsqueda de proveedores
export const searchSuppliers = async (req, res) => {
  try {
    const { term } = req.query;
    
    if (!term) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    // Crear expresión regular para búsqueda insensible a mayúsculas/minúsculas
    const regex = new RegExp(term, 'i');
    
    const suppliers = await Supplier.find({
      $or: [
        { name: regex },
        { businessName: regex },
        { ruc: regex },
        { contactPerson: regex },
        { email: regex },
        { phone: regex }
      ]
    }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      count: suppliers.length,
      data: suppliers
    });
  } catch (error) {
    console.error('Error al buscar proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al buscar proveedores',
      error: error.message
    });
  }
};

// Estadísticas de proveedores
export const getSupplierStats = async (req, res) => {
  try {
    // Contar proveedores por categoría
    const total = await Supplier.countDocuments();
    const active = await Supplier.countDocuments({ isActive: true });
    const inactive = await Supplier.countDocuments({ isActive: false });
    const withDebt = await Supplier.countDocuments({ currentDebt: { $gt: 0 } });
    
    // Obtener proveedores con mayor deuda
    const topDebtSuppliers = await Supplier.find({ currentDebt: { $gt: 0 } })
      .sort({ currentDebt: -1 })
      .limit(5)
      .select('name businessName currentDebt');
    
    // Calcular deuda total
    const debtAggregate = await Supplier.aggregate([
      { $match: { currentDebt: { $gt: 0 } } },
      { $group: { _id: null, totalDebt: { $sum: '$currentDebt' } } }
    ]);
    
    const totalDebt = debtAggregate.length > 0 ? debtAggregate[0].totalDebt : 0;
    
    res.status(200).json({
      success: true,
      data: {
        total,
        active,
        inactive,
        withDebt,
        totalDebt,
        topDebtSuppliers
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de proveedores',
      error: error.message
    });
  }
};

// Obtener transacciones de un proveedor
export const getSupplierTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar si el proveedor existe
    const supplierExists = await Supplier.exists({ _id: id });
    
    if (!supplierExists) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Obtener las transacciones ordenadas por fecha (más recientes primero)
    const transactions = await SupplierTransaction.find({ supplier: id })
      .sort({ date: -1 })
      .populate('creditPurchase', 'invoiceNumber')
      .populate('createdBy', 'name');
    
    res.status(200).json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    console.error('Error al obtener transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener transacciones',
      error: error.message
    });
  }
};

// Registrar una nueva transacción
export const createSupplierTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, notes, date } = req.body;
    
    // Validar que el proveedor exista
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Validar tipo y monto
    if (!['payment', 'debt'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de transacción inválido. Debe ser "payment" o "debt"'
      });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a cero'
      });
    }
    
    // Si es un pago, verificar que no exceda la deuda actual
    if (type === 'payment' && amount > supplier.currentDebt) {
      return res.status(400).json({
        success: false,
        message: `El pago (${amount}) no puede ser mayor que la deuda actual (${supplier.currentDebt})`
      });
    }
    
    // Crear la transacción
    const transaction = await SupplierTransaction.create({
      supplier: id,
      type,
      amount,
      notes,
      date: date || new Date(),
      createdBy: req.user ? req.user._id : null
    });
    
    res.status(201).json({
      success: true,
      message: type === 'payment' ? 'Pago registrado con éxito' : 'Deuda registrada con éxito',
      data: transaction
    });
  } catch (error) {
    console.error('Error al registrar transacción:', error);
    res.status(400).json({
      success: false,
      message: 'Error al registrar transacción',
      error: error.message
    });
  }
}; 