import { CreditNote } from '../models/CreditNote.js';
import { Invoice } from '../models/Invoice.js';
import { Product } from '../models/Product.js';
import { DailyReport } from '../models/DailyReport.js';

// Crear una nueva nota de crédito
export const createCreditNote = async (req, res) => {
    try {
        const {
            businessId,
            invoiceId,
            reason,
            reasonDetails,
            items,
            refundMethod,
            refundDetails,
            isFiscal,
            notes
        } = req.body;

        // Verificar que la factura relacionada existe
        const invoice = await Invoice.findById(invoiceId)
            .populate('items.product');
        
        if (!invoice) {
            return res.status(404).json({
                status: 'error',
                message: 'Factura no encontrada'
            });
        }

        // Validar que la factura no esté cancelada
        if (invoice.status === 'cancelled') {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede crear una nota de crédito para una factura cancelada'
            });
        }

        // Procesar elementos de la devolución
        const processedItems = [];
        let subtotal = 0;
        let discountAmount = 0;

        for (const item of items) {
            // Verificar que el producto existe en la factura original
            const invoiceItem = invoice.items.find(i => i.product._id.toString() === item.productId);
            
            if (!invoiceItem) {
                return res.status(400).json({
                    status: 'error',
                    message: `El producto con ID ${item.productId} no existe en la factura original`
                });
            }

            // Validar que la cantidad devuelta no exceda la cantidad comprada
            if (item.quantity > invoiceItem.quantity) {
                return res.status(400).json({
                    status: 'error',
                    message: `La cantidad a devolver (${item.quantity}) excede la cantidad comprada (${invoiceItem.quantity})`
                });
            }

            const itemPrice = invoiceItem.price;
            const itemDiscount = invoiceItem.discount ? (invoiceItem.discount / invoiceItem.quantity) * item.quantity : 0;
            const itemSubtotal = (itemPrice * item.quantity) - itemDiscount;

            // Calcular impuestos del item
            const itemTaxes = [];
            if (invoiceItem.taxes && invoiceItem.taxes.length > 0) {
                for (const tax of invoiceItem.taxes) {
                    const taxRate = tax.rate;
                    const taxAmount = (itemSubtotal * taxRate) / 100;
                    itemTaxes.push({
                        name: tax.name,
                        rate: taxRate,
                        amount: taxAmount
                    });
                }
            }

            processedItems.push({
                product: item.productId,
                quantity: item.quantity,
                price: itemPrice,
                discount: itemDiscount,
                taxes: itemTaxes,
                subtotal: itemSubtotal
            });

            subtotal += itemSubtotal;
            discountAmount += itemDiscount;

            // Restaurar stock del producto
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { quantity: item.quantity }
            });
        }

        // Calcular impuestos totales
        const processedTaxes = [];
        let taxAmount = 0;

        // Si la factura original tenía impuestos, calcular proporcionales para la devolución
        if (invoice.taxes && invoice.taxes.length > 0) {
            for (const tax of invoice.taxes) {
                // Calculamos el impuesto proporcional al monto de devolución
                const amount = (subtotal * tax.rate) / 100;
                processedTaxes.push({
                    name: tax.name,
                    rate: tax.rate,
                    amount: amount
                });
                taxAmount += amount;
            }
        }

        const total = subtotal + taxAmount;

        // Crear la nota de crédito
        const creditNoteData = {
            business: businessId,
            relatedInvoice: invoiceId,
            createdBy: req.user._id,
            reason,
            reasonDetails,
            items: processedItems,
            subtotal,
            discountAmount,
            taxes: processedTaxes,
            taxAmount,
            total,
            refundMethod,
            refundDetails,
            status: 'processed',
            isFiscal,
            fiscalStatus: isFiscal ? 'pending' : 'not_fiscal',
            notes,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const creditNote = await CreditNote.create(creditNoteData);

        // Actualizar la factura original para referencia
        if (!invoice.refunds) {
            invoice.refunds = [];
        }

        invoice.refunds.push({
            amount: total,
            date: new Date(),
            reason: `${reason}: ${reasonDetails}`,
            processedBy: req.user._id
        });

        if (total >= invoice.total) {
            invoice.status = 'refunded';
        } else {
            invoice.status = 'partially_refunded';
        }

        invoice.updatedAt = new Date();
        await invoice.save();

        // Actualizar el reporte diario si existe
        const dailyReport = await DailyReport.findOne({
            business: businessId,
            status: 'open',
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        if (dailyReport) {
            // Registrar la devolución
            dailyReport.refunds.count += 1;
            dailyReport.refunds.amount += total;

            // Registrar movimientos de inventario
            const inventoryMovements = processedItems.map(item => ({
                type: 'refund',
                product: item.product,
                quantity: item.quantity,
                cost: item.price * item.quantity
            }));

            dailyReport.inventoryMovements.push(...inventoryMovements);
            
            await dailyReport.save();
        }

        // Obtener la nota de crédito con las referencias pobladas
        const populatedCreditNote = await CreditNote.findById(creditNote._id)
            .populate('business')
            .populate('relatedInvoice')
            .populate('createdBy', 'username email')
            .populate('items.product');

        res.status(201).json({
            status: 'success',
            message: 'Nota de crédito creada correctamente',
            data: populatedCreditNote
        });

    } catch (error) {
        console.error('Error al crear nota de crédito:', error);
        res.status(500).json({
            status: 'error',
            message: 'Error al crear la nota de crédito',
            error: error.message
        });
    }
};

// Obtener una nota de crédito específica
export const getCreditNote = async (req, res) => {
    try {
        const { id } = req.params;
        
        const creditNote = await CreditNote.findById(id)
            .populate('business')
            .populate('relatedInvoice')
            .populate('createdBy', 'username email')
            .populate('items.product');

        if (!creditNote) {
            return res.status(404).json({
                status: 'error',
                message: 'Nota de crédito no encontrada'
            });
        }

        res.status(200).json({
            status: 'success',
            data: creditNote
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener la nota de crédito',
            error: error.message
        });
    }
};

// Obtener notas de crédito con filtros
export const getCreditNotes = async (req, res) => {
    try {
        const {
            invoiceId,
            startDate,
            endDate,
            status,
            refundMethod,
            isFiscal,
            minTotal,
            maxTotal,
            page = 1,
            limit = 10
        } = req.query;

        const filter = {};

        // Aplicar filtros
        if (invoiceId) {
            filter.relatedInvoice = invoiceId;
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

        if (refundMethod) {
            filter.refundMethod = refundMethod;
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

        const creditNotes = await CreditNote.find(filter)
            .populate('business', 'name')
            .populate('relatedInvoice', 'receiptNumber')
            .populate('createdBy', 'username')
            .sort({ dateTime: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await CreditNote.countDocuments(filter);

        res.status(200).json({
            status: 'success',
            results: creditNotes.length,
            total,
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            data: creditNotes
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener las notas de crédito',
            error: error.message
        });
    }
};

// Procesar una nota de crédito fiscal
export const processFiscalCreditNote = async (req, res) => {
    try {
        const { id } = req.params;

        const creditNote = await CreditNote.findById(id);

        if (!creditNote) {
            return res.status(404).json({
                status: 'error',
                message: 'Nota de crédito no encontrada'
            });
        }

        if (!creditNote.isFiscal) {
            return res.status(400).json({
                status: 'error',
                message: 'Esta nota de crédito no es de tipo fiscal'
            });
        }

        if (creditNote.fiscalStatus !== 'pending') {
            return res.status(400).json({
                status: 'error',
                message: `La nota de crédito ya ha sido procesada con estado: ${creditNote.fiscalStatus}`
            });
        }

        // Aquí iría la lógica para enviar la nota de crédito al sistema fiscal
        // Por ahora, simularemos que se aprueba automáticamente
        creditNote.fiscalStatus = 'approved';
        creditNote.fiscalResponse = {
            code: '00000',
            message: 'Nota de crédito fiscal aprobada',
            timestamp: new Date(),
            authId: `AUTH-NC-${Date.now()}`
        };
        creditNote.updatedAt = new Date();

        await creditNote.save();

        res.status(200).json({
            status: 'success',
            message: 'Nota de crédito fiscal procesada correctamente',
            data: creditNote
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al procesar la nota de crédito fiscal',
            error: error.message
        });
    }
};

// Anular una nota de crédito
export const cancelCreditNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const creditNote = await CreditNote.findById(id)
            .populate('items.product');

        if (!creditNote) {
            return res.status(404).json({
                status: 'error',
                message: 'Nota de crédito no encontrada'
            });
        }

        if (creditNote.status === 'cancelled') {
            return res.status(400).json({
                status: 'error',
                message: 'Esta nota de crédito ya está cancelada'
            });
        }

        if (creditNote.isFiscal && creditNote.fiscalStatus === 'approved') {
            return res.status(400).json({
                status: 'error',
                message: 'No se puede cancelar una nota de crédito fiscal aprobada'
            });
        }

        // Revertir restauración de stock de productos
        for (const item of creditNote.items) {
            await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: -item.quantity }
            });
        }

        // Actualizar estado de la nota de crédito
        creditNote.status = 'cancelled';
        creditNote.notes = creditNote.notes ? `${creditNote.notes}\n\nCancelada: ${reason}` : `Cancelada: ${reason}`;
        creditNote.updatedAt = new Date();

        await creditNote.save();

        // Actualizar la factura relacionada
        const invoice = await Invoice.findById(creditNote.relatedInvoice);
        if (invoice) {
            // Buscar y eliminar la referencia a esta devolución
            if (invoice.refunds && invoice.refunds.length > 0) {
                const refundIndex = invoice.refunds.findIndex(
                    r => r.amount === creditNote.total && 
                    r.reason.includes(creditNote.reason)
                );
                
                if (refundIndex !== -1) {
                    invoice.refunds.splice(refundIndex, 1);
                }
            }

            // Restaurar estado original de la factura
            const hasOtherRefunds = invoice.refunds && invoice.refunds.length > 0;
            
            if (!hasOtherRefunds) {
                invoice.status = 'completed';
            } else {
                // Verificar si es refund total o parcial
                const totalRefunded = invoice.refunds.reduce((sum, refund) => sum + refund.amount, 0);
                invoice.status = totalRefunded >= invoice.total ? 'refunded' : 'partially_refunded';
            }

            invoice.updatedAt = new Date();
            await invoice.save();
        }

        res.status(200).json({
            status: 'success',
            message: 'Nota de crédito cancelada correctamente',
            data: creditNote
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al cancelar la nota de crédito',
            error: error.message
        });
    }
}; 