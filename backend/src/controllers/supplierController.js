import Supplier from '../models/supplierModel.js';
import fs from 'fs';
import path from 'path';

// Crear un nuevo proveedor
export const createSupplier = async (req, res) => {
  try {
    const {
      name,
      taxId,
      supplierType,
      category,
      status,
      address,
      phone,
      email,
      contactPerson,
      website,
      fiscalId,
      fiscalRegime,
      vatCondition,
      preferredPaymentMethod,
      currency,
      relationshipStartDate,
      paymentTerms
    } = req.body;

    // Validar campos obligatorios
    if (!name || !taxId || !supplierType || !category || !address || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser completados'
      });
    }

    // Manejar documentos subidos
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          name: file.originalname,
          path: file.path,
          uploadDate: new Date()
        });
      });
    }

    // Crear nuevo proveedor
    const supplier = await Supplier.create({
      name,
      taxId,
      supplierType,
      category,
      status: status || 'activo',
      address,
      phone,
      email,
      contactPerson: contactPerson || '',
      website: website || '',
      fiscalId: fiscalId || '',
      fiscalRegime: fiscalRegime || '',
      vatCondition: vatCondition || '',
      preferredPaymentMethod: preferredPaymentMethod || '',
      currency: currency || '',
      relationshipStartDate: relationshipStartDate || new Date(),
      paymentTerms: paymentTerms || '',
      documents
    });

    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: supplier
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

// Obtener todos los proveedores con filtros opcionales
export const getSuppliers = async (req, res) => {
  try {
    const { 
      name, 
      status, 
      category, 
      supplierType 
    } = req.query;
    
    // Construir filtro dinámicamente
    const filter = {};
    
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (supplierType) filter.supplierType = supplierType;
    
    const suppliers = await Supplier.find(filter).sort({ name: 1 });
    
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
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

// Actualizar un proveedor
export const updateSupplier = async (req, res) => {
  try {
    const {
      name,
      taxId,
      supplierType,
      category,
      status,
      address,
      phone,
      email,
      contactPerson,
      website,
      fiscalId,
      fiscalRegime,
      vatCondition,
      preferredPaymentMethod,
      currency,
      relationshipStartDate,
      paymentTerms
    } = req.body;

    // Buscar proveedor existente
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }

    // Actualizar campos
    if (name) supplier.name = name;
    if (taxId) supplier.taxId = taxId;
    if (supplierType) supplier.supplierType = supplierType;
    if (category) supplier.category = category;
    if (status) supplier.status = status;
    if (address) supplier.address = address;
    if (phone) supplier.phone = phone;
    if (email) supplier.email = email;
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (website !== undefined) supplier.website = website;
    if (fiscalId !== undefined) supplier.fiscalId = fiscalId;
    if (fiscalRegime !== undefined) supplier.fiscalRegime = fiscalRegime;
    if (vatCondition !== undefined) supplier.vatCondition = vatCondition;
    if (preferredPaymentMethod !== undefined) supplier.preferredPaymentMethod = preferredPaymentMethod;
    if (currency !== undefined) supplier.currency = currency;
    if (relationshipStartDate) supplier.relationshipStartDate = relationshipStartDate;
    if (paymentTerms !== undefined) supplier.paymentTerms = paymentTerms;

    // Manejar documentos subidos
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        supplier.documents.push({
          name: file.originalname,
          path: file.path,
          uploadDate: new Date()
        });
      });
    }

    // Guardar cambios
    await supplier.save();

    res.status(200).json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: supplier
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

// Eliminar un proveedor
export const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Eliminar archivos de documentos asociados
    if (supplier.documents && supplier.documents.length > 0) {
      supplier.documents.forEach(doc => {
        if (fs.existsSync(doc.path)) {
          fs.unlinkSync(doc.path);
        }
      });
    }
    
    await Supplier.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Proveedor eliminado exitosamente'
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

// Añadir documento a un proveedor
export const addDocumentToSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se ha proporcionado ningún documento'
      });
    }
    
    supplier.documents.push({
      name: req.file.originalname,
      path: req.file.path,
      uploadDate: new Date()
    });
    
    await supplier.save();
    
    res.status(200).json({
      success: true,
      message: 'Documento añadido exitosamente',
      data: supplier
    });
  } catch (error) {
    console.error('Error al añadir documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al añadir documento',
      error: error.message
    });
  }
};

// Eliminar documento de un proveedor
export const deleteDocument = async (req, res) => {
  try {
    const { id, docId } = req.params;
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Encontrar el documento
    const docIndex = supplier.documents.findIndex(doc => doc._id.toString() === docId);
    
    if (docIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Documento no encontrado'
      });
    }
    
    // Eliminar archivo físico
    const docPath = supplier.documents[docIndex].path;
    if (fs.existsSync(docPath)) {
      fs.unlinkSync(docPath);
    }
    
    // Eliminar referencia en el modelo
    supplier.documents.splice(docIndex, 1);
    
    await supplier.save();
    
    res.status(200).json({
      success: true,
      message: 'Documento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar documento:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar documento',
      error: error.message
    });
  }
};

// Calificar a un proveedor
export const rateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const { score, comment, userId } = req.body;
    
    if (!score || score < 0 || score > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe ser un número entre 0 y 5'
      });
    }
    
    const supplier = await Supplier.findById(id);
    
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    // Añadir comentario si existe
    if (comment) {
      supplier.rating.comments.push({
        text: comment,
        date: new Date(),
        user: userId
      });
    }
    
    // Actualizar puntuación
    // Se podría implementar un cálculo de promedio si hubiera múltiples calificaciones
    supplier.rating.score = score;
    
    await supplier.save();
    
    res.status(200).json({
      success: true,
      message: 'Proveedor calificado exitosamente',
      data: supplier.rating
    });
  } catch (error) {
    console.error('Error al calificar proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al calificar proveedor',
      error: error.message
    });
  }
};

// Obtener categorías de proveedores únicas
export const getSupplierCategories = async (req, res) => {
  try {
    const categories = await Supplier.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message
    });
  }
};

// Obtener tipos de proveedores únicos
export const getSupplierTypes = async (req, res) => {
  try {
    const types = await Supplier.distinct('supplierType');
    
    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Error al obtener tipos de proveedores:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener tipos de proveedores',
      error: error.message
    });
  }
}; 