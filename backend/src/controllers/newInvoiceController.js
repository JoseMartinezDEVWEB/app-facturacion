import { newInvoice } from '../models/newInvoice.js';
import { Product } from '../models/Product.js';
import Cliente from '../models/Cliente.js';

export const createInvoice = async (req, res) => {
  try {
    const { 
      items, 
      customer, 
      paymentMethod, 
      paymentDetails, 
      subtotal, 
      taxAmount, 
      total,
      isCredit,     // Nuevo campo para compras fiadas
      clienteId,    // ID del cliente para compras fiadas
      clientInfo    // Información adicional del cliente
    } = req.body;

    // Validar productos y stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Producto no encontrado: ${item.product}` });
      }
      
      // Verificación de stock especializada por tipo de producto
      if (product.unitType === 'peso') {
        // Para productos por peso, verificamos si hay stock suficiente
        // basado en el peso solicitado
        if (item.weightInfo && product.quantity < item.weightInfo.value) {
          return res.status(400).json({ 
            message: `Stock insuficiente para: ${product.name}. 
                      Solicitado: ${item.weightInfo.value} ${item.weightInfo.unit}, 
                      Disponible: ${product.quantity} ${product.weightUnit}` 
          });
        }
      } else {
        // Para productos normales, verificamos la cantidad numérica
        if (product.quantity < item.quantity) {
          return res.status(400).json({ message: `Stock insuficiente para: ${product.name}` });
        }
      }
    }

    // Generar número de factura
    const count = await newInvoice.countDocuments();
    const date = new Date();
    const receiptNumber = `FAC-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}-${(count + 1).toString().padStart(4, '0')}`;

    // Crear el objeto de factura
    const invoiceData = {
      receiptNumber,
      cashier: req.user?.id || null,
      customer,
      items: items.map(item => {
        // Adaptamos los items para guardarlos correctamente en el modelo
        const itemData = {
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          price: item.price || item.salePrice,
          subtotal: item.subtotal
        };

        // Si es un producto por peso, añadimos la información del peso
        if (item.weightInfo) {
          itemData.weightInfo = {
            value: item.weightInfo.value,
            unit: item.weightInfo.unit,
            pricePerUnit: item.weightInfo.pricePerUnit
          };
        }

        return itemData;
      }),
      paymentMethod,
      paymentDetails,
      subtotal,
      taxAmount,
      total,
      business: req.user.businessId
    };

    // Si es una compra fiada, añadir la información del cliente
    if (isCredit) {
      // Validar que se proporcionó el ID del cliente
      if (!clienteId) {
        return res.status(400).json({ 
          message: 'Se requiere un cliente para procesar una compra fiada' 
        });
      }

      // Añadir campos específicos de compra fiada
      invoiceData.isCredit = true;
      invoiceData.clienteId = clienteId;
      invoiceData.clientInfo = clientInfo || { id: clienteId };
      invoiceData.creditStatus = 'pending'; // Estado del crédito: pendiente

      try {
        // Buscar el cliente en la base de datos
        const cliente = await Cliente.findById(clienteId);

        if (!cliente) {
          return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        console.log('Cliente encontrado para compra fiada:', cliente.name);

        // Actualizar cuentas pendientes del cliente
        cliente.cuentasPendientes += total;
        await cliente.save();
        console.log('Cliente actualizado con nueva deuda:', cliente.cuentasPendientes);
      } catch (clienteError) {
        console.error('Error al procesar cliente para compra fiada:', clienteError);
        return res.status(500).json({
          message: 'Error al procesar cliente para compra fiada',
          error: clienteError.message
        });
      }
    }

    const invoice = new newInvoice(invoiceData);
    const savedInvoice = await invoice.save();

    // Actualizar stock
    for (const item of items) {
      const product = await Product.findById(item.product);
      
      if (product.unitType === 'peso' && item.weightInfo) {
        // Para productos por peso, decrementamos el stock basado en el peso
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.weightInfo.value }
        });
      } else {
        // Para productos normales, decrementamos basado en la cantidad
        await Product.findByIdAndUpdate(item.product, {
          $inc: { quantity: -item.quantity }
        });
      }
    }

    const populatedInvoice = await newInvoice.findById(savedInvoice._id)
      .populate('cashier', 'name')
      .populate('items.product', 'name price');

    res.status(201).json(populatedInvoice);

  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({
      message: 'Error al crear la factura',
      error: error.message
    });
  }
};

// Mantenemos el resto del controlador igual
export const getInvoices = async (req, res) => {
  try {
    const invoices = await newInvoice.find({ business: req.user.businessId })
      .populate('cashier', 'name')
      .populate('items.product', 'name')
      .sort({ createdAt: -1 });

    res.json(invoices);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener facturas',
      error: error.message
    });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await newInvoice.findById(req.params.id)
      .populate('cashier', 'name email')
      .populate('items.product', 'name price');

    if (!invoice) {
      return res.status(404).json({
        message: 'Factura no encontrada'
      });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener la factura',
      error: error.message
    });
  }
};