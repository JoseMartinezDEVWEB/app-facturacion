import { Quote } from '../models/Quote.js';
import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { Business } from '../models/Business.js';

// Crear una nueva cotización
export const createQuote = async (req, res) => {
    try {
        const {
            businessId,
            customer,
            items,
            purchaseType,
            validUntil,
            notes,
            paymentTerms,
            deliveryTerms,
            additionalConditions,
            taxes
        } = req.body;

        // Validar negocio
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({
                status: 'error',
                message: 'Negocio no encontrado'
            });
        }

        // Procesar y validar cada ítem
        const processedItems = [];
        let subtotal = 0;
        let discountAmount = 0;

        for (const item of items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    message: `Producto no encontrado: ${item.productId}`
                });
            }
            
            // Verificar disponibilidad (opcional en cotizaciones)
            if (item.quantity > product.quantity) {
                // Solo advertir, no impedir
                console.warn(`Stock insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${item.quantity}`);
            }

            // Calcular descuento del ítem si existe
            const itemDiscount = item.discount || 0;
            const itemPrice = product.salePrice;
            const itemSubtotal = (itemPrice * item.quantity) - itemDiscount;
            
            // Calcular impuestos por ítem si se especifican
            const itemTaxes = [];
            if (item.taxes && item.taxes.length > 0) {
                for (const tax of item.taxes) {
                    const taxAmount = (itemSubtotal * tax.rate) / 100;
                    itemTaxes.push({
                        name: tax.name,
                        rate: tax.rate,
                        amount: taxAmount
                    });
                }
            }
            
            processedItems.push({
                product: product._id,
                quantity: item.quantity,
                price: itemPrice,
                discount: itemDiscount,
                taxes: itemTaxes,
                subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
            discountAmount += itemDiscount;
        }

        // Calcular impuestos totales
        let taxAmount = 0;
        const processedTaxes = [];
        
        if (taxes && taxes.length > 0) {
            for (const tax of taxes) {
                const amount = (subtotal * tax.rate) / 100;
                processedTaxes.push({
                    name: tax.name,
                    rate: tax.rate,
                    amount,
                    isExempt: tax.isExempt || false
                });
                if (!tax.isExempt) {
                    taxAmount += amount;
                }
            }
        } else {
            // Impuesto por defecto si no se especifica
            const defaultTaxRate = 18; // 18% IVA por defecto
            const amount = (subtotal * defaultTaxRate) / 100;
            processedTaxes.push({
                name: 'IVA',
                rate: defaultTaxRate,
                amount,
                isExempt: false
            });
            taxAmount = amount;
        }

        const total = subtotal + taxAmount;

        // Procesar fecha de validez
        let validUntilDate = null;
        if (validUntil) {
            validUntilDate = new Date(validUntil);
        } else {
            validUntilDate = new Date();
            validUntilDate.setDate(validUntilDate.getDate() + 30); // 30 días por defecto
        }

        // Crear la cotización
        const quoteData = {
            business: businessId,
            createdBy: req.user._id,
            customer,
            validUntil: validUntilDate,
            items: processedItems,
            purchaseType,
            subtotal,
            discountAmount,
            taxes: processedTaxes,
            taxAmount,
            total,
            notes,
            paymentTerms,
            deliveryTerms,
            additionalConditions,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const quote = await Quote.create(quoteData);

        // Obtener la cotización con las referencias pobladas
        const populatedQuote = await Quote.findById(quote._id)
            .populate('business')
            .populate('createdBy', 'username email')
            .populate('items.product');

        res.status(201).json({
            status: 'success',
            message: 'Cotización creada correctamente',
            data: populatedQuote
        });

    } catch (error) {
        console.error('Error al crear cotización:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la cotización',
            error: error.message
        });
    }
};

// Obtener una cotización específica
export const getQuote = async (req, res) => {
    try {
        const { id } = req.params;
        
        const quote = await Quote.findById(id)
            .populate('business')
            .populate('createdBy', 'username email')
            .populate('items.product')
            .populate('convertedToInvoice');

        if (!quote) {
            return res.status(404).json({
                status: 'error',
                message: 'Cotización no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: quote
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la cotización',
            error: error.message
        });
    }
};

// Obtener cotizaciones con filtros
export const getQuotes = async (req, res) => {
    try {
        const {
            customer,
            startDate,
            endDate,
            status,
            minTotal,
            maxTotal,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        // Aplicar filtros
        if (customer) {
            filter['customer.name'] = { $regex: customer, $options: 'i' };
        }

        if (startDate && endDate) {
            filter.dateTime = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        } else if (startDate) {
            filter.dateTime = { $gte: new Date(startDate) };
        } else if (endDate) {
            filter.dateTime = { $lte: new Date(endDate) };
        }

        if (status) {
            filter.status = status;
        }

        if (minTotal && maxTotal) {
            filter.total = { $gte: Number(minTotal), $lte: Number(maxTotal) };
        } else if (minTotal) {
            filter.total = { $gte: Number(minTotal) };
        } else if (maxTotal) {
            filter.total = { $lte: Number(maxTotal) };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const quotes = await Quote.find(filter)
            .populate('business', 'name')
            .populate('createdBy', 'username')
            .sort({ dateTime: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Quote.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: quotes.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            data: quotes
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las cotizaciones',
            error: error.message
        });
    }
};

// Actualizar estado de una cotización
export const updateQuoteStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        const quote = await Quote.findById(id);

        if (!quote) {
            return res.status(404).json({
                status: 'error',
                message: 'Cotización no encontrada'
            });
        }

        // Validar transiciones de estado permitidas
        const validTransitions = {
            'pending': ['approved', 'rejected', 'expired'],
            'approved': ['converted', 'expired'],
            'rejected': [],
            'expired': [],
            'converted': []
        };

        if (!validTransitions[quote.status].includes(status)) {
            return res.status(400).json({
                status: 'error',
                message: `No se puede cambiar el estado de "${quote.status}" a "${status}"`
            });
        }

        // Actualizar estado
        quote.status = status;
        
        // Si se rechaza, guardar motivo en notas
        if (status === 'rejected' && reason) {
            quote.notes = quote.notes ? `${quote.notes}\n\nRechazada: ${reason}` : `Rechazada: ${reason}`;
        }
        
        quote.updatedAt = new Date();
        await quote.save();

        res.status(200).json({
            status: 'success',
            message: `Estado de cotización actualizado a ${status}`,
            data: quote
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al actualizar el estado de la cotización',
            error: error.message
        });
    }
};

// Convertir cotización a factura
export const convertToInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { isFiscal = false, paymentMethod, paymentDetails, cash } = req.body;

        const quote = await Quote.findById(id)
            .populate('items.product');

        if (!quote) {
            return res.status(404).json({
                status: 'error',
                message: 'Cotización no encontrada'
            });
        }

        if (quote.status !== 'approved' && quote.status !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: `No se puede convertir una cotización con estado "${quote.status}"`
            });
        }

        if (quote.isExpired()) {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede convertir una cotización vencida'
            });
        }

        // Verificar disponibilidad de productos
        for (const item of quote.items) {
            const product = await Product.findById(item.product);
            
            if (!product) {
                return res.status(404).json({
                    status: 'error',
                    message: `Producto no encontrado: ${item.product}`
                });
            }

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    status: 'error',
                    message: `Stock insuficiente para el producto: ${product.name}. Disponible: ${product.quantity}, Requerido: ${item.quantity}`
                });
            }
        }

        // Determinar estado de pago inicial
        const total = quote.total;
        const paidAmount = paymentMethod === 'credit' ? 0 : (cash >= total ? total : cash);
        const change = cash && cash > total ? cash - total : 0;
        
        // Determinar estado de pago inicial
        let paymentStatus = 'pending';
        if (paymentMethod === 'credit') {
            paymentStatus = 'pending';
        } else if (paidAmount >= total) {
            paymentStatus = 'paid';
        } else if (paidAmount > 0) {
            paymentStatus = 'partial';
        }

        // Crear la factura a partir de la cotización
        const invoiceData = {
            business: quote.business,
            cashier: req.user._id,
            customer: quote.customer,
            items: quote.items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount,
                taxes: item.taxes,
                subtotal: item.subtotal
            })),
            purchaseType: quote.purchaseType,
            paymentMethod,
            paymentDetails,
            paymentStatus,
            paidAmount,
            subtotal: quote.subtotal,
            discountAmount: quote.discountAmount,
            taxes: quote.taxes,
            taxAmount: quote.taxAmount,
            total: quote.total,
            isFiscal,
            fiscalStatus: isFiscal ? 'pending' : 'not_fiscal',
            notes: quote.notes ? `Convertida de cotización #${quote.quoteNumber}. ${quote.notes}` : `Convertida de cotización #${quote.quoteNumber}`,
            cash,
            change,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const invoice = await Invoice.create(invoiceData);

        // Actualizar stock de productos
        for (const item of quote.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Actualizar cotización
        quote.status = 'converted';
        quote.convertedToInvoice = invoice._id;
        quote.updatedAt = new Date();
        await quote.save();

        // Obtener la factura con las referencias pobladas
        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('business')
            .populate('cashier', 'username email')
            .populate('items.product');

        res.status(201).json({
            status: 'success',
            message: 'Cotización convertida a factura correctamente',
            data: {
                quote,
                invoice: populatedInvoice
            }
        });

    } catch (error) {
        console.error('Error al convertir cotización a factura:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al convertir la cotización a factura',
            error: error.message
        });
    }
}; 