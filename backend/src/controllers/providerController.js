// controllers/providerController.js
import Cliente from '../models/Cliente.js';
import { Product } from '../models/Product.js';
import PurchaseOrder from '../models/PurchaseOrder.js';

// @desc    Crear un nuevo proveedor
// @route   POST /api/providers
// @access  Private
export const createProvider = async (req, res) => {
  try {

    const {
      name,
      email,
      phone,
      address,
      rncCedula,
      tipoNegocio,
      condicionesPago,
      contactoPrincipal,
      notasAdicionales
    } = req.body;

    // Validar campos requeridos
    if (!name || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Nombre y teléfono son campos requeridos'
      });
    }

    // Verificar si ya existe un proveedor con ese email o teléfono
    const existingProvider = await Cliente.findOne({
      $and: [
        { role: 'proveedor' },
        { $or: [
          { email: email && email.trim() !== '' ? email : null },
          { phone: phone }
        ]}
      ]
    });

    if (existingProvider) {
      return res.status(400).json({
        status: 'error',
        message: 'Ya existe un proveedor con ese email o teléfono'
      });
    }

    // Crear el proveedor
    const provider = await Cliente.create({
      name,
      email,
      phone,
      role: 'proveedor', // Siempre será proveedor
      address,
      rncCedula,
      tipoNegocio,
      condicionesPago,
      contactoPrincipal,
      notasAdicionales,
    });

    if (provider) {
      return res.status(201).json({
        status: 'success',
        message: 'Proveedor creado exitosamente',
        data: provider
      });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Datos de proveedor inválidos'
      });
    }
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener todos los proveedores
// @route   GET /api/providers
// @access  Private
export const getProviders = async (req, res) => {
  try {
    const { search, sort = 'name', order = 'asc' } = req.query;
    
    // Filtrar solo por role = proveedor
    const query = {
      role: 'proveedor'
    };
    
    // Búsqueda por texto si se proporciona
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { rncCedula: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Obtener proveedores
    const providers = await Cliente.find(query)
      .sort({ [sort]: order === 'desc' ? -1 : 1 });
      
    return res.json({
      status: 'success',
      count: providers.length,
      data: providers
    });
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener un proveedor por ID
// @route   GET /api/providers/:id
// @access  Private
export const getProviderById = async (req, res) => {
  try {
    const provider = await Cliente.findOne({
      _id: req.params.id,
      role: 'proveedor'
    });
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    // Obtener productos asociados al proveedor
    const products = await Product.find({
      _id: { $in: provider.products }
    }).select('name barcode quantity purchasePrice salePrice unitType');
    
    // Obtener órdenes de compra asociadas al proveedor
    const purchaseOrders = await PurchaseOrder.find({
      provider: provider._id
    })
    .select('orderNumber orderDate total balanceDue paymentStatus orderStatus')
    .sort({ createdAt: -1 })
    .limit(5);
    
    // Calcular totales
    const totalOrders = await PurchaseOrder.countDocuments({
      provider: provider._id
    });
    
    const pendingBalance = await provider.calculatePendingBalance();
    
    return res.json({
      status: 'success',
      data: {
        provider,
        products,
        recentOrders: purchaseOrders,
        statistics: {
          totalOrders,
          pendingBalance
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Actualizar un proveedor
// @route   PUT /api/providers/:id
// @access  Private
export const updateProvider = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      rncCedula,
      tipoNegocio,
      condicionesPago,
      contactoPrincipal,
      notasAdicionales
    } = req.body;
    
    // Comprobar que el proveedor existe
    const provider = await Cliente.findOne({
      _id: req.params.id,
      role: 'proveedor'
    });
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    // Verificar duplicados si se cambia email o teléfono
    if ((email && email !== provider.email) || (phone && phone !== provider.phone)) {
      const existingProvider = await Cliente.findOne({
        _id: { $ne: provider._id },
        role: 'proveedor',
        $or: [
          { email: email && email.trim() !== '' ? email : null },
          { phone: phone }
        ]
      });
      
      if (existingProvider) {
        return res.status(400).json({
          status: 'error',
          message: 'Ya existe un proveedor con ese email o teléfono'
        });
      }
    }
    
    // Actualizar campos
    provider.name = name || provider.name;
    provider.email = email || provider.email;
    provider.phone = phone || provider.phone;
    
    if (address) {
      provider.address = {
        ...provider.address,
        ...address
      };
    }
    
    provider.rncCedula = rncCedula || provider.rncCedula;
    provider.tipoNegocio = tipoNegocio || provider.tipoNegocio;
    provider.condicionesPago = condicionesPago || provider.condicionesPago;
    provider.contactoPrincipal = contactoPrincipal || provider.contactoPrincipal;
    provider.notasAdicionales = notasAdicionales || provider.notasAdicionales;
    provider.updatedAt = Date.now();
    
    const updatedProvider = await provider.save();
    
    return res.json({
      status: 'success',
      message: 'Proveedor actualizado exitosamente',
      data: updatedProvider
    });
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Obtener productos de un proveedor
// @route   GET /api/providers/:id/products
// @access  Private
export const getProviderProducts = async (req, res) => {
  try {
    const provider = await Cliente.findOne({
      _id: req.params.id,
      role: 'proveedor'
    });
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    const products = await Product.find({
      _id: { $in: provider.products }
    })
    .populate('category', 'name');
    
    return res.json({
      status: 'success',
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error al obtener productos del proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Agregar un producto a un proveedor
// @route   POST /api/providers/:id/products
// @access  Private
export const addProductToProvider = async (req, res) => {
  try {
    const { productId } = req.body;
    
    // Comprobar que el proveedor existe
    const provider = await Cliente.findOne({
      _id: req.params.id,
      role: 'proveedor'
    });
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    // Comprobar que el producto existe
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Producto no encontrado'
      });
    }
    
    // Agregar producto al proveedor si no está ya
    if (!provider.products.includes(productId)) {
      provider.products.push(productId);
      await provider.save();
    }
    
    return res.json({
      status: 'success',
      message: 'Producto agregado al proveedor exitosamente',
      data: provider
    });
  } catch (error) {
    console.error('Error al agregar producto al proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};

// @desc    Eliminar un proveedor
// @route   DELETE /api/providers/:id
// @access  Private
export const deleteProvider = async (req, res) => {
  try {
    const provider = await Cliente.findOne({
      _id: req.params.id,
      role: 'proveedor'
    });
    
    if (!provider) {
      return res.status(404).json({
        status: 'error',
        message: 'Proveedor no encontrado'
      });
    }
    
    // Verificar si tiene órdenes de compra asociadas
    const hasOrders = await PurchaseOrder.exists({
      provider: provider._id
    });
    
    if (hasOrders) {
      return res.status(400).json({
        status: 'error',
        message: 'No se puede eliminar el proveedor porque tiene órdenes de compra asociadas'
      });
    }
    
    await provider.deleteOne();
    
    return res.json({
      status: 'success',
      message: 'Proveedor eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error del servidor',
      error: error.message
    });
  }
};