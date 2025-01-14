import { Product, UNIT_TYPES } from '../models/Product.js';
import { Category } from '../models/Category.js';
import cloudinary from '../config/cloudinary.js';
import mongoose from 'mongoose';



export const createProduct = async (req, res) => {
    try {
        // Verificar autenticación y roles permitidos
        if (!req.user || !req.user._id) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no autenticado'
            });
        }

        if (!['admin', 'encargado'].includes(req.user.role)) {
            return res.status(403).json({
                status: 'error',
                message: 'No tienes permisos para crear productos'
            });
        }

        const {
            name,
            barcode,
            qrCode,
            unitType,
            quantity,
            minStock,
            purchasePrice,
            salePrice,
            category,
            description,
            image
        } = req.body;

        // Validar campos requeridos
        const requiredFields = ['name', 'barcode', 'minStock', 'purchasePrice', 'salePrice', 'category'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Faltan campos requeridos',
                missingFields
            });
        }

        // Validar formato del ID de categoría
        if (!mongoose.Types.ObjectId.isValid(category)) {
            return res.status(400).json({
                status: 'error',
                message: 'ID de categoría inválido'
            });
        }

        // Verificar si la categoría existe
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
            return res.status(404).json({
                status: 'error',
                message: 'La categoría especificada no existe'
            });
        }

        // Validar precios
        if (Number(purchasePrice) < 0 || Number(salePrice) < 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Los precios no pueden ser negativos'
            });
        }

        if (Number(salePrice) < Number(purchasePrice)) {
            return res.status(400).json({
                status: 'error',
                message: 'El precio de venta no puede ser menor al precio de compra'
            });
        }

        // Preparar datos del producto
        const productData = {
            name,
            barcode,
            qrCode,
            minStock: Number(minStock),
            purchasePrice: Number(purchasePrice),
            salePrice: Number(salePrice),
            category,
            description,
            createdBy: req.user._id,
            quantity: Number(quantity) || 0
        };

        // Agregar unitType solo si se proporciona
        if (unitType && Object.values(UNIT_TYPES).includes(unitType)) {
            productData.unitType = unitType;
        }

        // Agregar imagen si se proporciona
        if (image && image.url && image.publicId) {
            productData.image = {
                url: image.url,
                publicId: image.publicId
            };
        }

        // Crear el producto
        const product = await Product.create(productData);

        // Poblar la categoría en la respuesta
        const populatedProduct = await Product.findById(product._id)
            .populate('category', 'name')
            .populate('createdBy', 'name email');

        res.status(201).json({
            status: 'success',
            message: 'Producto creado exitosamente',
            data: populatedProduct
        });

    } catch (error) {
        console.error('Error al crear producto:', error);

        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(400).json({
                status: 'error',
                message: `Ya existe un producto con este ${field}`,
                field
            });
        }

        return res.status(500).json({
            status: 'error',
            message: 'Error al crear el producto',
            error: error.message
        });
    }
};
  export const getInventoryAlerts = async (req, res) => {
    try {
      const alerts = await Product.find({
        quantity: { $lte: '$minStock' }
      })
      .select('name quantity minStock unitType weightUnit category alertActive lastAlertDate')
      .populate('category', 'name');
  
      const formattedAlerts = alerts.map(product => ({
        ...product.toJSON(),
        formattedQuantity: product.getFormattedQuantity(),
        alertLevel: product.quantity === 0 ? 'CRÍTICO' : 'BAJO',
        message: `${product.name} - ${product.getFormattedQuantity()} disponibles (Mínimo: ${product.minStock})`
      }));
  
      // Agrupar por nivel de urgencia
      const criticalAlerts = formattedAlerts.filter(a => a.alertLevel === 'CRÍTICO');
      const lowStockAlerts = formattedAlerts.filter(a => a.alertLevel === 'BAJO');
  
      res.json({
        critical: criticalAlerts,
        lowStock: lowStockAlerts,
        totalAlerts: alerts.length
      });
    } catch (error) {
      res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
  };
  
  // Función auxiliar para enviar notificaciones
  const sendAlertNotification = async (product) => {
    try {
      const notification = {
        type: product.quantity === 0 ? 'CRÍTICO' : 'STOCK BAJO',
        productName: product.name,
        currentStock: product.getFormattedQuantity(),
        minStock: product.minStock,
        timestamp: new Date()
      };
  
      // Aquí puedes implementar el envío de notificaciones
      console.log('Alerta de inventario:', notification);
    } catch (error) {
      console.error('Error al enviar notificación:', error);
    }
  };

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Eliminar imagen de Cloudinary si existe
    if (product.image?.publicId) {
      await cloudinary.uploader.destroy(product.image.publicId);
    }

    await product.deleteOne();

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const query = {};

    // Filtrar por categoría
    if (category) {
      query.category = category;
    }

    // Búsqueda por texto
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username')
      .sort({ [sortBy]: order })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = req.body;

        // Si se sube una nueva imagen, maneja la lógica aquí
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'products',
            });
            updatedData.image = {
                url: result.secure_url,
                publicId: result.public_id
            };
        }

        const updatedProduct = await Product.findByIdAndUpdate(productId, updatedData, { new: true });

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            product: updatedProduct
        });
    } catch (error) {
        res.status(500).json({ message: 'Error del servidor', error: error.message });
    }
};


export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('createdBy', 'username')
      .populate('updatedBy', 'username');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
