import { DailyReport } from '../models/DailyReport.js';
import { Invoice } from '../models/Invoice.js';

export const createDailyReport = async (req, res) => {
    try {
        const { businessId, initialAmount } = req.body;

        // Verificar si ya existe un reporte abierto para hoy
        const existingReport = await DailyReport.findOne({
            business: businessId,
            status: 'open',
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        if (existingReport) {
            return res.status(400).json({
                status: 'error',
                message: 'Ya existe un reporte abierto para hoy'
            });
        }

        const report = await DailyReport.create({
            business: businessId,
            openedBy: req.user._id,
            cashRegister: {
                initialAmount,
                finalAmount: initialAmount,
                difference: 0
            }
        });

        res.status(201).json({
            status: 'success',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al crear el reporte diario',
            error: error.message
        });
    }
};

export const closeDailyReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { finalAmount, closingNotes } = req.body;

        const report = await DailyReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                status: 'error',
                message: 'Reporte no encontrado'
            });
        }

        if (report.status === 'closed') {
            return res.status(400).json({
                status: 'error',
                message: 'Este reporte ya está cerrado'
            });
        }

        // Obtener todas las facturas del día
        const todayInvoices = await Invoice.find({
            business: report.business,
            createdAt: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        });

        // Calcular totales por método de pago
        const salesSummary = todayInvoices.reduce((summary, invoice) => {
            summary.totalSales += invoice.total;
            summary.totalInvoices += 1;

            switch (invoice.paymentMethod) {
                case 'cash':
                    summary.paymentMethods.cash.count += 1;
                    summary.paymentMethods.cash.amount += invoice.total;
                    break;
                case 'credit_card':
                    summary.paymentMethods.creditCard.count += 1;
                    summary.paymentMethods.creditCard.amount += invoice.total;
                    break;
                case 'bank_transfer':
                    summary.paymentMethods.bankTransfer.count += 1;
                    summary.paymentMethods.bankTransfer.amount += invoice.total;
                    break;
            }

            return summary;
        }, {
            totalSales: 0,
            totalInvoices: 0,
            paymentMethods: {
                cash: { count: 0, amount: 0 },
                creditCard: { count: 0, amount: 0 },
                bankTransfer: { count: 0, amount: 0 }
            }
        });

        // Actualizar y cerrar el reporte
        report.sales = salesSummary;
        report.cashRegister.finalAmount = finalAmount;
        report.cashRegister.difference = 
        finalAmount - report.cashRegister.initialAmount - salesSummary.paymentMethods.cash.amount;
        report.closingNotes = closingNotes;
        report.status = 'closed';
        report.closedBy = req.user._id;

        await report.save();

        res.json({
            status: 'success',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al cerrar el reporte diario',
            error: error.message
        });
    }
    
};

export const addExpense = async (req, res) => {
    try {
        const { reportId } = req.params;
        const { description, amount, category, paymentMethod } = req.body;

        const report = await DailyReport.findById(reportId);
        if (!report) {
            return res.status(404).json({
                status: 'error',
                message: 'Reporte no encontrado'
            });
        }

        if (report.status === 'closed') {
            return res.status(400).json({
                status: 'error',
                message: 'No se pueden añadir gastos a un reporte cerrado'
            });
        }

        report.expenses.push({
            description,
            amount,
            category,
            paymentMethod
        });

        await report.save();

        res.json({
            status: 'success',
            data: report
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al añadir gasto',
            error: error.message
        });
    }
};

export const getCurrentDayReport = async (req, res) => {
    try {
        const { businessId } = req.params;

        const report = await DailyReport.findOne({
            business: businessId,
            date: {
                $gte: new Date().setHours(0, 0, 0, 0),
                $lt: new Date().setHours(23, 59, 59, 999)
            }
        }).populate([
            {
                path: 'inventoryMovements.product',
                select: 'name barcode price'
            },
            {
                path: 'openedBy',
                select: 'name'
            },
            {
                path: 'closedBy',
                select: 'name'
            }
        ]);

        if (!report) {
            return res.status(404).json({
                status: 'error',
                message: 'No hay reporte abierto para hoy'
            });
        }

        // Calcular totales
        const totals = report.calculateTotals();

        res.json({
            status: 'success',
            data: {
                report,
                totals,
                summary: {
                    salesByPaymentMethod: report.sales.paymentMethods,
                    totalExpenses: totals.totalExpenses,
                    netProfit: totals.netProfit,
                    cashInRegister: report.cashRegister.finalAmount,
                    totalTransactions: report.sales.totalInvoices
                }
            }
        });

    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Error al obtener el reporte del día',
            error: error.message
        });
    }
};