import { Invoice } from '../models/Invoice.js';
import { Business } from '../models/Business.js';
import { Product } from '../models/Product.js';
import { DailyReport } from '../models/DailyReport.js';

export const createInvoice = async (req, res) => {
    try {
        const {
            businessId,
            customer,
            items,
            purchaseType,
            paymentMethod,
            paymentDetails,
            isFiscal,
            notes,
            cash,
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

        // Procesar y validar cada item
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

            if (product.quantity < item.quantity) {
                return res.status(400).json({
                    status: 'error',
                    message: `Stock insuficiente para el producto: ${product.name}`
                });
            }

            // Calcular descuento del item si existe
            const itemDiscount = item.discount || 0;
            const itemPrice = product.salePrice;
            const itemSubtotal = (itemPrice * item.quantity) - itemDiscount;
            
            // Calcular impuestos por item si se especifican
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

            // Actualizar stock
            await Product.findByIdAndUpdate(product._id, {
                $inc: { quantity: -item.quantity }
            });
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
            const defaultTaxRate = isFiscal ? 18 : 0; // 18% IVA por defecto para facturas fiscales
            if (defaultTaxRate > 0) {
                const amount = (subtotal * defaultTaxRate) / 100;
                processedTaxes.push({
                    name: 'IVA',
                    rate: defaultTaxRate,
                    amount,
                    isExempt: false
                });
                taxAmount = amount;
            }
        }

        const total = subtotal + taxAmount;
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

        // Crear la factura
        const invoiceData = {
            business: businessId,
            cashier: req.user._id,
            customer,
            items: processedItems,
            purchaseType,
            paymentMethod,
            paymentDetails,
            paidAmount,
            paymentStatus,
            subtotal,
            discountAmount,
            taxes: processedTaxes,
            taxAmount,
            total,
            isFiscal,
            fiscalStatus: isFiscal ? 'pending' : 'not_fiscal',
            notes,
            cash,
            change,
            status: 'completed',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const invoice = await Invoice.create(invoiceData);

        // Obtener la factura con las referencias pobladas
        const populatedInvoice = await Invoice.findById(invoice._id)
            .populate('business')
            .populate('cashier', 'username email')
            .populate('items.product');

        res.status(201).json({
            status: 'success',
            data: populatedInvoice
        });

        // Después de crear la factura, actualizar el reporte diario
        const dailyReport = await DailyReport.findOne({
            business: businessId,
            status: 'open',
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        if (dailyReport) {
            // Actualizar las ventas en el reporte
            switch (paymentMethod) {
                case 'cash':
                    dailyReport.sales.paymentMethods.cash.count += 1;
                    dailyReport.sales.paymentMethods.cash.amount += total;
                    break;
                case 'credit_card':
                    dailyReport.sales.paymentMethods.creditCard.count += 1;
                    dailyReport.sales.paymentMethods.creditCard.amount += total;
                    break;
                case 'bank_transfer':
                    dailyReport.sales.paymentMethods.bankTransfer.count += 1;
                    dailyReport.sales.paymentMethods.bankTransfer.amount += total;
                    break;
                case 'credit':
                    dailyReport.sales.paymentMethods.credit.count += 1;
                    dailyReport.sales.paymentMethods.credit.amount += total;
                    break;
                case 'check':
                    dailyReport.sales.paymentMethods.check.count += 1;
                    dailyReport.sales.paymentMethods.check.amount += total;
                    break;
                default:
                    dailyReport.sales.paymentMethods.other.count += 1;
                    dailyReport.sales.paymentMethods.other.amount += total;
            }

            dailyReport.sales.totalSales += total;
            dailyReport.sales.totalInvoices += 1;

            // Registrar movimientos de inventario
            const inventoryMovements = items.map(item => ({
                type: 'sale',
                product: item.product,
                quantity: -item.quantity,
                cost: item.price * item.quantity
            }));

            dailyReport.inventoryMovements.push(...inventoryMovements);
            
            await dailyReport.save();
        }

    } catch (error) {
        console.error('Error al crear factura:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la factura',
            error: error.message
        });
    }
};

export const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        
        const invoice = await Invoice.findById(id)
            .populate('business')
            .populate('cashier', 'username email')
            .populate('items.product');

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la factura',
            error: error.message
        });
    }
};

// Obtener facturas con filtros
export const getInvoices = async (req, res) => {
    try {
        const {
            customer,
            startDate,
            endDate,
            status,
            paymentMethod,
            paymentStatus,
            isFiscal,
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

        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }

        if (paymentStatus) {
            filter.paymentStatus = paymentStatus;
        }

        if (isFiscal !== undefined) {
            filter.isFiscal = isFiscal === 'true';
        }

        if (minTotal && maxTotal) {
            filter.total = { $gte: Number(minTotal), $lte: Number(maxTotal) };
        } else if (minTotal) {
            filter.total = { $gte: Number(minTotal) };
        } else if (maxTotal) {
            filter.total = { $lte: Number(maxTotal) };
        }

        const skip = (Number(page) - 1) * Number(limit);

        const invoices = await Invoice.find(filter)
            .populate('business', 'name')
            .populate('cashier', 'username')
            .sort({ dateTime: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await Invoice.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: invoices.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            data: invoices
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las facturas',
            error: error.message
        });
    }
};

// Agregar pago a una factura
export const addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, paymentMethod, paymentDetails } = req.body;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Factura no encontrada'
            });
        }

        if (invoice.paymentStatus === 'paid') {
            return res.status(400).json({
                status: 'error',
                message: 'Esta factura ya está completamente pagada'
            });
        }

        // Validar monto
        const pendingAmount = invoice.total - invoice.paidAmount;
        if (amount > pendingAmount) {
            return res.status(400).json({
                status: 'error',
                message: `El monto del pago (${amount}) excede el monto pendiente (${pendingAmount})`
            });
        }

        // Registrar pago
        invoice.paidAmount += Number(amount);
        
        // Actualizar estado de pago
        if (invoice.paidAmount >= invoice.total) {
            invoice.paymentStatus = 'paid';
        } else {
            invoice.paymentStatus = 'partial';
        }

        // Registro de pago en historial (si se quisiera implementar)
        invoice.updatedAt = new Date();

        await invoice.save();

        // Actualizar el reporte diario si existe
        const dailyReport = await DailyReport.findOne({
            business: invoice.business,
            status: 'open',
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        if (dailyReport) {
            // Actualizar pagos recibidos
            switch (paymentMethod) {
                case 'cash':
                    dailyReport.payments.cash += Number(amount);
                    break;
                case 'credit_card':
                    dailyReport.payments.creditCard += Number(amount);
                    break;
                case 'bank_transfer':
                    dailyReport.payments.bankTransfer += Number(amount);
                    break;
                case 'check':
                    dailyReport.payments.check += Number(amount);
                    break;
                default:
                    dailyReport.payments.other += Number(amount);
            }

            await dailyReport.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Pago registrado correctamente',
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al registrar el pago',
            error: error.message
        });
    }
};

// Anular o cancelar una factura
export const cancelInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Factura no encontrada'
            });
        }

        if (invoice.status === 'cancelled') {
            return res.status(400).json({
                status: 'error',
                message: 'Esta factura ya está cancelada'
            });
        }

        if (invoice.status === 'completed' && invoice.isFiscal && invoice.fiscalStatus === 'approved') {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede cancelar una factura fiscal aprobada. Debe crear una nota de crédito.'
            });
        }

        // Restaurar stock de productos
        for (const item of invoice.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity }
            });
        }

        // Actualizar estado de la factura
        invoice.status = 'cancelled';
        invoice.notes = invoice.notes ? `${invoice.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`;
        invoice.updatedAt = new Date();

        await invoice.save();

        res.status(200).json({
            status: 'success',
            message: 'Factura cancelada correctamente',
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al cancelar la factura',
            error: error.message
        });
    }
};

// Procesar factura fiscal
export const processFiscalInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await Invoice.findById(id);

        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Factura no encontrada'
            });
        }

        if (!invoice.isFiscal) {
            return res.status(400).json({
                status: 'error',
                message: 'Esta factura no es de tipo fiscal'
            });
        }

        if (invoice.fiscalStatus !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: `La factura ya ha sido procesada con estado: ${invoice.fiscalStatus}`
            });
        }

        // Aquí iría la lógica para enviar la factura al sistema fiscal
        // Por ahora, simularemos que se aprueba automáticamente
        invoice.fiscalStatus = 'approved';
        invoice.fiscalResponse = {
            code: '00000',
            message: 'Factura fiscal aprobada',
            timestamp: new Date(),
            authId: `AUTH-${Date.now()}`
        };
        invoice.updatedAt = new Date();

        await invoice.save();

        res.status(200).json({
            status: 'success',
            message: 'Factura fiscal procesada correctamente',
            data: invoice
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al procesar la factura fiscal',
            error: error.message
        });
    }
};