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

      const productData = req.body;

      // Validar campos requeridos
      const requiredFields = ['name', 'unitType', 'purchasePrice', 'salePrice', 'category'];
      const missingFields = requiredFields.filter(field => !req.body[field]);

      if (missingFields.length > 0) {
          return res.status(400).json({
              status: 'error',
              message: 'Faltan campos requeridos',
              missingFields
          });
      }

      // Si se proporciona un proveedor, verificar que existe y asociarlo
      if (productData.provider) {
  const provider = await Cliente.findOne({
    _id: productData.provider,
    role: 'proveedor'
  });
  
  if (!provider) {
    return res.status(404).json({
      status: 'error',
      message: 'Proveedor no encontrado'
    });
  }

  // Manejo de compra a crédito
if (productData.creditPurchase && productData.creditPurchase.isCredit) {
  // Validar que el término de pago es válido
  const validTerms = ['15dias', '30dias', '45dias', '60dias', 'otro'];
  if (!validTerms.includes(productData.creditPurchase.paymentTerm)) {
    return res.status(400).json({
      status: 'error',
      message: 'Término de pago no válido'
    });
  }
  
  // Calcular fecha de vencimiento si no se proporcionó
  if (!productData.creditPurchase.dueDate) {
    const dueDate = new Date();
    const term = productData.creditPurchase.paymentTerm;
    
    if (term === '15dias') {
      dueDate.setDate(dueDate.getDate() + 15);
    } else if (term === '30dias') {
      dueDate.setDate(dueDate.getDate() + 30);
    } else if (term === '45dias') {
      dueDate.setDate(dueDate.getDate() + 45);
    } else if (term === '60dias') {
      dueDate.setDate(dueDate.getDate() + 60);
    }
    
    productData.creditPurchase.dueDate = dueDate;
  }
  
  // Inicializar como no pagado
  productData.creditPurchase.isPaid = false;
  productData.creditPurchase.paymentDate = null;
}
  
  // Agregar el producto a la lista de productos del proveedor
  await Cliente.findByIdAndUpdate(productData.provider, {
    $addToSet: { products: newProduct._id }
  });
    }

      // Validar formato del ID de categoría
      if (!mongoose.Types.ObjectId.isValid(productData.category)) {
          return res.status(400).json({
              status: 'error',
              message: 'ID de categoría inválido'
          });
      }

      // Verificar si la categoría existe
      const categoryExists = await Category.findById(productData.category);
      if (!categoryExists) {
          return res.status(404).json({
              status: 'error',
              message: 'La categoría especificada no existe'
          });
      }

      // Validar precios
      if (Number(productData.purchasePrice) < 0 || Number(productData.salePrice) < 0) {
          return res.status(400).json({
              status: 'error',
              message: 'Los precios no pueden ser negativos'
          });
      }

      // Validaciones específicas para productos por peso
      if (productData.unitType === UNIT_TYPES.WEIGHT) {
          if (!productData.weightUnit) {
              return res.status(400).json({
                  status: 'error',
                  message: 'La unidad de peso es requerida para productos por peso'
              });
          }

          // Validar campos numéricos específicos para productos por peso
          const weightFields = ['minWeight'];
          if (productData.packageWeight) {
              weightFields.push('packageWeight');
          }
          
          for (const field of weightFields) {
              if (productData[field] && (isNaN(Number(productData[field])) || Number(productData[field]) <= 0)) {
                  return res.status(400).json({
                    status: 'error',
                        message: `El campo ${field} debe ser un número positivo`,
                        field
                    });
                }
            }
            
            // Si se proporciona packageWeight, calcular/validar pricePerUnit
            if (productData.packageWeight) {
                const packageWeight = Number(productData.packageWeight);
                const salePrice = Number(productData.salePrice);
                
                if (packageWeight > 0 && salePrice > 0) {
                    // Calcular el precio por unidad de peso
                    const pricePerUnit = salePrice / packageWeight;
                    // Guardar el precio por unidad en los datos del producto
                    productData.pricePerUnit = parseFloat(pricePerUnit.toFixed(2));
                }
            }
        }

        // Asegurarse de que los campos numéricos sean números
        ['purchasePrice', 'salePrice', 'quantity', 'minStock', 'minWeight', 'packageWeight', 'pricePerUnit'].forEach(field => {
            if (productData[field] !== undefined) {
                productData[field] = Number(productData[field]);
            }
        });
        
        // Agregar el usuario que crea el producto
        productData.createdBy = req.user._id;

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
      page,
      limit,
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

    // Si no se especifica página o límite, traer todos los productos
    if (!page || !limit) {
      const products = await Product.find(query)
        .populate('category', 'name')
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .sort({ [sortBy]: order });

      return res.json({
        products,
        totalPages: 1,
        currentPage: 1
      });
    } else {
      // Si se especifica paginación, aplicarla
      const products = await Product.find(query)
        .populate('category', 'name')
        .populate('createdBy', 'username')
        .populate('updatedBy', 'username')
        .sort({ [sortBy]: order })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      const total = await Product.countDocuments(query);

      return res.json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: Number(page)
      });
    }
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

export const getProductByCode = async (req, res) => {
  try {
      const { code } = req.params;
      
      const product = await Product.findOne({
          $or: [
              { barcode: code },
              { qrCode: code }
          ]
      });

      if (!product) {
          return res.status(404).json({
              status: 'error',
              message: 'Producto no encontrado'
          });
      }

      res.json({
          status: 'success',
          data: product
      });
  } catch (error) {
      res.status(500).json({
          status: 'error',
          message: 'Error al buscar el producto',
          error: error.message
      });
  }
};

export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode });
    
    if (!product) {
      console.log('Barcode not found:', barcode); // Para debugging
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: error.message });
  }
};