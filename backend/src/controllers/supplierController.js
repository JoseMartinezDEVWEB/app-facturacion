import Supplier from '../models/Supplier.js';
import CreditPurchase from '../models/CreditPurchase.js';

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
    // Verificar si hay compras asociadas a este proveedor
    const hasRelatedPurchases = await CreditPurchase.exists({ supplier: req.params.id });
    
    if (hasRelatedPurchases) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar el proveedor porque tiene compras asociadas'
      });
    }
    
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado con éxito',
      data: {}
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

// Buscar proveedores por nombre o RUC
export const searchSuppliers = async (req, res) => {
  try {
    const searchTerm = req.query.term;
    
    if (!searchTerm) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un término de búsqueda'
      });
    }
    
    const suppliers = await Supplier.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { businessName: { $regex: searchTerm, $options: 'i' } },
        { ruc: { $regex: searchTerm, $options: 'i' } }
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

// Obtener estadísticas de proveedores (total, activos, inactivos)
export const getSupplierStats = async (req, res) => {
  try {
    const totalSuppliers = await Supplier.countDocuments();
    const activeSuppliers = await Supplier.countDocuments({ isActive: true });
    const inactiveSuppliers = await Supplier.countDocuments({ isActive: false });
    
    const suppliersWithDebt = await Supplier.countDocuments({ currentDebt: { $gt: 0 } });
    
    // Proveedores con mayor deuda
    const topDebtSuppliers = await Supplier.find({ currentDebt: { $gt: 0 } })
      .sort({ currentDebt: -1 })
      .limit(5);
    
    res.status(200).json({
      success: true,
      data: {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers,
        withDebt: suppliersWithDebt,
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